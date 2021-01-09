// class EventHandlerTransactionPosted extends EventHandler {

//   protected processTransaction(book: Bkper.Book, transaction: bkper.Transaction): string[] | string | boolean {

//     if (transaction.agentId == 'sales-tax-bot') {
//       console.log("Same payload agent. Preventing bot loop.");
//       return false;
//     }

//     var creditAccount = book.getAccount(transaction.creditAccount.id);
//     var debitAccount = book.getAccount(transaction.debitAccount.id);
    
//     let fullNonIncludedTax = this.getFullTaxRate_(book, creditAccount, debitAccount, false);
//     let netAmount = +transaction.amount;

//     let taxAmount = transaction.properties['tax_amount'] ? book.parseValue(transaction.properties['tax_amount']) : null;

//     //Ensure tax amount positive
//     if (taxAmount && taxAmount < 0) {
//       taxAmount *= -1;
//     }

//     let fullIncludedTax = this.getFullTaxRate_(book, creditAccount, debitAccount, true);

//     if (fullIncludedTax == 0 && fullNonIncludedTax == 0 && (taxAmount == null || taxAmount == 0)) {
//       return false;
//     }

//     if (fullIncludedTax >= 100) {
//       return `Cannot process more than 100% in total taxes. Sum of all taxes: ${fullIncludedTax}`;
//     }

//     if (fullIncludedTax > 0 && taxAmount == null) {
//       netAmount = +transaction.amount - ((+transaction.amount * fullIncludedTax) / (100 + fullIncludedTax));
//     } else if (taxAmount != null) {
//       netAmount = +transaction.amount - taxAmount;
//     }

//     let transactions: Bkper.Transaction[] = [];

//     transactions = transactions.concat(this.getTaxTransactions(book, creditAccount, transaction, netAmount, taxAmount));
//     transactions = transactions.concat(this.getTaxTransactions(book, debitAccount, transaction, netAmount, taxAmount));

//     if (transactions.length > 0) {
//       transactions = book.batchCreateTransactions(transactions);
//       if (transactions.length > 0) {
//         return transactions.map(tx => `POSTED: ${tx.getDateFormatted()} ${tx.getAmount()} ${tx.getDescription()}`);
//       } else {
//         return false;
//       }
//     } else {
//       return false;
//     }

//   }


//   private getFullTaxRate_(book: Bkper.Book, creditAccount: Bkper.Account, debitAccount: Bkper.Account, included: boolean): number {
//     let totalTax = 0;
//     totalTax += this.getFullTaxRateFromAccount_(book, creditAccount, included);
//     totalTax += this.getFullTaxRateFromAccount_(book, debitAccount, included);
//     return totalTax;
//   }

//   private getFullTaxRateFromAccount_(book: Bkper.Book, account: Bkper.Account, included: boolean): number {
//     let totalTax = this.getTaxRateFromAccountOrGroup_(book, account, included);
//     let groups = account.getGroups();
//     if (groups != null) {
//       for (var group of groups) {
//         totalTax += this.getTaxRateFromAccountOrGroup_(book, group, included);
//       }
//     }
//     return totalTax;
//   }

//   private getTaxRateFromAccountOrGroup_(book: Bkper.Book, accountOrGroup: Bkper.Account | Bkper.Group, included: boolean): number {
//     let taxTag = accountOrGroup.getProperty('tax_rate');
//     if (taxTag == null || taxTag.trim() == '') {
//       return 0;
//     }
//     const tax = book.parseValue(taxTag);
//     if (included && tax < 0) {
//       return 0;
//     }

//     if (!included && tax > 0) {
//       return 0;
//     }

//     return tax;
//   }

//   private getTaxTransactions(book: Bkper.Book, account: Bkper.Account, transaction: bkper.Transaction, netAmount: number, taxAmount: number): Bkper.Transaction[] {

//     let transactions: Bkper.Transaction[] = [];

//     let accountTransaction = this.createTaxTransaction(book, account, account.getName(), transaction, netAmount, taxAmount);
//     if (accountTransaction != null) {
//       transactions.push(accountTransaction)
//     }

//     let groups = account.getGroups();
//     if (groups != null) {
//       for (var group of groups) {
//         let groupTransaction = this.createTaxTransaction(book, group, account.getName(), transaction, netAmount, taxAmount);
//         if (groupTransaction != null) {
//           transactions.push(groupTransaction);
//         }
//       }
//     }

//     return transactions;
//   }


//   private createTaxTransaction(book: Bkper.Book, accountOrGroup: Bkper.Account | Bkper.Group, accountName: string, transaction: bkper.Transaction, netAmount: number, taxAmount: number): Bkper.Transaction {

//     let taxTag = accountOrGroup.getProperty('tax_rate');

//     if (taxTag == null || taxTag.trim() == '') {
//       return null;
//     }

//     let tax = book.parseValue(taxTag);

//     if (tax == 0 && (taxAmount == null || taxAmount == 0)) {
//       return null;
//     }

//     // Fixed tax_amount overrides included tax
//     let amount: number | string = taxAmount && taxAmount > 0 && tax > 0 ? taxAmount : netAmount * (tax / 100);
    
//     if (amount < 0) {
//       amount *= -1;
//     }

//     let tax_description = accountOrGroup.getProperty('tax_description');

//     if (tax_description == null) {
//       tax_description = '';
//     }

//     let tax_round = +transaction.properties['tax_round'];
//     if (tax_round != null && !isNaN(tax_round) && tax_round <= 8) {
//       amount = amount.toFixed(tax_round);
//     }

//     tax_description = tax_description.replace('${transaction.description}', transaction.description);
//     tax_description = tax_description.replace('${account.name}', accountName);

//     let id = `${super.getId(transaction, accountOrGroup)}`

//     let taxTransaction = book.newTransaction()
//                           .addRemoteId(id)
//                           .setDate(transaction.date)
//                           .setAmount(amount)
//                           .setDescription(tax_description);

//     return taxTransaction;
//   }

// }