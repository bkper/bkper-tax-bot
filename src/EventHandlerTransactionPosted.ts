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

    let records = new Array<string>();

    records = records.concat(this.getRecords_(netAmount, book, transaction, creditAccount));
    records = records.concat(this.getRecords_(netAmount, book, transaction, debitAccount));

    if (records.length > 0) {
      book.record(records);
      return records;
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

  private getRecords_(netAmount: number, book: Bkper.Book, transaction: bkper.Transaction, account: Bkper.Account): string[] {

    let records = new Array<string>();

    let record = this.getRecordText(netAmount, account, account.getName(), transaction, book);
    if (record != null) {
      records.push(record)
    }

    let groups = account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        let groupRecord = this.getRecordText(netAmount, group, account.getName(), transaction, book);
        if (groupRecord != null) {
          records.push(groupRecord);
        }
      }
    }

    return records;
  }


  private getRecordText(netAmount: number, accountOrGroup: Bkper.Account | Bkper.Group, accountName: string, transaction: bkper.Transaction, book: Bkper.Book) {
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

    let id = `id:${super.getId(transaction, accountOrGroup)}`

    return `${transaction.dateFormatted} ${book.formatValue(amount)} ${tax_description} ${id}`;
  }

}