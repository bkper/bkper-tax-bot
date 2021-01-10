import Account from "bkper-node/lib/Account";
import Book from "bkper-node/lib/Book";
import Group from "bkper-node/lib/Group";
import EventHandler from "./EventHandler";

export default class EventHandlerTransactionDeleted extends EventHandler {

  protected async processTransaction(book: Book, transaction: bkper.Transaction): Promise<string[] | string | boolean> {
    var creditAccount = book.getAccount(transaction.creditAccount.id);
    
    var debitAccount = book.getAccount(transaction.debitAccount.id);

    let transactionsIds: string[] = [];

    transactionsIds = transactionsIds.concat(this.getTaxTransactionsIds(book, creditAccount, transaction));
    transactionsIds = transactionsIds.concat(this.getTaxTransactionsIds(book, debitAccount, transaction));

    if (transactionsIds.length == 0) {
      return false;
    }

    let deletedRecords: string[] = [];
    transactionsIds.forEach(async id => {
      let iterator = book.getTransactions(`remoteId:${id}`);
      if (iterator.hasNext()) {
        let tx = await iterator.next();
        if (tx.isChecked()) {
          tx = await tx.uncheck();
        }
        tx = await tx.remove();
        deletedRecords.push(`DELETED: ${tx.getDateFormatted()} ${tx.getAmount()} ${tx.getDescription()}`)
      }
    })

    return deletedRecords;
  }

  private getTaxTransactionsIds(book: Book, account: Account, transaction: bkper.Transaction): string[] {

    let transactionsIds: string[] = [];

    let accountTransactionId = this.getTaxTransactionId(book, account, transaction);
    if (accountTransactionId != null) {
      transactionsIds.push(accountTransactionId)
    }

    let groups = account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        let groupTransactionId = this.getTaxTransactionId(book, group, transaction);
        if (groupTransactionId != null) {
          transactionsIds.push(groupTransactionId);
        }
      }
    }

    return transactionsIds;
  }

  private getTaxTransactionId(book: Book, accountOrGroup: Account | Group, transaction: bkper.Transaction): string {
    let taxTag = accountOrGroup.getProperty('tax_rate');

    if (taxTag == null || taxTag.trim() == '') {
      return null;
    }

    let tax = new Number(taxTag).valueOf();

    if (tax == 0) {
      return null;
    }

    if (tax < 0) {
      tax *= -1;
    }

    return `${super.getId(transaction, accountOrGroup)}`
  }

}