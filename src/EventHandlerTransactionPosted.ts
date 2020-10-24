class EventHandlerTransactionPosted extends EventHandler {

  protected processTransaction(book: Bkper.Book, transaction: bkper.Transaction): string[] | string | boolean {

    if (transaction.agentId == 'sales-tax-bot') {
      console.log("Same payload agent. Preventing bot loop.");
      return false;
    }

    var creditAccount = book.getAccount(transaction.creditAccount.id);
    var debitAccount = book.getAccount(transaction.debitAccount.id);

    let fullIncludedTax = this.getFullTaxRate_(book, creditAccount, debitAccount, true);
    let fullNonIncludedTax = this.getFullTaxRate_(book, creditAccount, debitAccount, false);

    if (fullIncludedTax == 0 && fullNonIncludedTax == 0) {
      return false;
    }

    if (fullIncludedTax >= 100) {
      return `Cannot process more than 100% in total taxes. Sum of all taxes: ${fullIncludedTax}`;
    }

    let netAmount = +transaction.amount;

    if (fullIncludedTax > 0) {
      netAmount = +transaction.amount - ((+transaction.amount * fullIncludedTax) / (100 + fullIncludedTax));
    }

    let transactions: Bkper.Transaction[] = [];

    transactions = transactions.concat(this.getTaxTransactions(netAmount, book, transaction, creditAccount));
    transactions = transactions.concat(this.getTaxTransactions(netAmount, book, transaction, debitAccount));

    if (transactions.length > 0) {
      transactions = book.batchCreateTransactions(transactions);
      if (transactions.length > 0) {
        return transactions.map(tx => `${tx.getDateFormatted()} ${tx.getAmount()} ${tx.getDescription()}`);
      } else {
        return false;
      }
    } else {
      return false;
    }

  }


  private getFullTaxRate_(book: Bkper.Book, creditAccount: Bkper.Account, debitAccount: Bkper.Account, included: boolean): number {
    let totalTax = 0;
    totalTax += this.getFullTaxRateFromAccount_(book, creditAccount, included);
    totalTax += this.getFullTaxRateFromAccount_(book, debitAccount, included);
    return totalTax;
  }

  private getFullTaxRateFromAccount_(book: Bkper.Book, account: Bkper.Account, included: boolean): number {
    let totalTax = this.getTaxRateFromAccountOrGroup_(book, account, included);
    let groups = account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        totalTax += this.getTaxRateFromAccountOrGroup_(book, group, included);
      }
    }
    return totalTax;
  }

  private getTaxRateFromAccountOrGroup_(book: Bkper.Book, accountOrGroup: Bkper.Account | Bkper.Group, included: boolean): number {
    let taxTag = accountOrGroup.getProperty('tax_rate');
    if (taxTag == null || taxTag.trim() == '') {
      return 0;
    }
    const tax = book.parseValue(taxTag);
    if (included && tax < 0) {
      return 0;
    }

    if (!included && tax > 0) {
      return 0;
    }

    return tax;
  }

  private getTaxTransactions(netAmount: number, book: Bkper.Book, transaction: bkper.Transaction, account: Bkper.Account): Bkper.Transaction[] {

    let transactions: Bkper.Transaction[] = [];

    let accountTransaction = this.createTaxTransaction(book, account, account.getName(), transaction, netAmount);
    if (accountTransaction != null) {
      transactions.push(accountTransaction)
    }

    let groups = account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        let groupTransaction = this.createTaxTransaction(book, group, account.getName(), transaction, netAmount);
        if (groupTransaction != null) {
          transactions.push(groupTransaction);
        }
      }
    }

    return transactions;
  }


  private createTaxTransaction(book: Bkper.Book, accountOrGroup: Bkper.Account | Bkper.Group, accountName: string, transaction: bkper.Transaction, netAmount: number): Bkper.Transaction {
    let taxTag = accountOrGroup.getProperty('tax_rate');

    if (taxTag == null || taxTag.trim() == '') {
      return null;
    }

    let tax = new Number(taxTag).valueOf();

    if (tax < 0) {
      tax *= -1;
    }

    let amount = netAmount * (tax / 100);

    let tax_description = accountOrGroup.getProperty('tax_description');

    if (tax_description == null) {
      tax_description = '';
    }

    tax_description = tax_description.replace('${transaction.description}', transaction.description);
    tax_description = tax_description.replace('${account.name}', accountName);

    let id = `${super.getId(transaction, accountOrGroup)}`

    let taxTransaction = book.newTransaction()
                          .addRemoteId(id)
                          .setDate(transaction.date)
                          .setAmount(amount)
                          .setDescription(tax_description);

    return taxTransaction;
  }

}