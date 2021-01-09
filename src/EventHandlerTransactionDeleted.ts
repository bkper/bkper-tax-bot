// class EventHandlerTransactionDeleted extends EventHandler {

//   protected processTransaction(book: Bkper.Book, transaction: bkper.Transaction): string[] | string | boolean {
//     var creditAccount = book.getAccount(transaction.creditAccount.id);
//     var debitAccount = book.getAccount(transaction.debitAccount.id);

//     let transactionsIds: string[] = [];

//     transactionsIds = transactionsIds.concat(this.getTaxTransactionsIds(book, creditAccount, transaction));
//     transactionsIds = transactionsIds.concat(this.getTaxTransactionsIds(book, debitAccount, transaction));

//     if (transactionsIds.length == 0) {
//       return false;
//     }

//     let deletedRecords: string[] = [];
//     transactionsIds.forEach(id => {
//       let iterator = book.getTransactions(`remoteId:${id}`);
//       if (iterator.hasNext()) {
//         let tx = iterator.next();
//         if (tx.isChecked()) {
//           tx = tx.uncheck();
//         }
//         tx = tx.remove();
//         deletedRecords.push(`DELETED: ${tx.getDateFormatted()} ${tx.getAmount()} ${tx.getDescription()}`)
//       }
//     })

//     return deletedRecords;
//   }

//   private getTaxTransactionsIds(book: Bkper.Book, account: Bkper.Account, transaction: bkper.Transaction): string[] {

//     let transactionsIds: string[] = [];

//     let accountTransactionId = this.getTaxTransactionId(book, account, transaction);
//     if (accountTransactionId != null) {
//       transactionsIds.push(accountTransactionId)
//     }

//     let groups = account.getGroups();
//     if (groups != null) {
//       for (var group of groups) {
//         let groupTransactionId = this.getTaxTransactionId(book, group, transaction);
//         if (groupTransactionId != null) {
//           transactionsIds.push(groupTransactionId);
//         }
//       }
//     }

//     return transactionsIds;
//   }

//   private getTaxTransactionId(book: Bkper.Book, accountOrGroup: Bkper.Account | Bkper.Group, transaction: bkper.Transaction): string {
//     let taxTag = accountOrGroup.getProperty('tax_rate');

//     if (taxTag == null || taxTag.trim() == '') {
//       return null;
//     }

//     let tax = new Number(taxTag).valueOf();

//     if (tax == 0) {
//       return null;
//     }

//     if (tax < 0) {
//       tax *= -1;
//     }

//     return `${super.getId(transaction, accountOrGroup)}`
//   }

// }