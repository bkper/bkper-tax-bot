import { Account, Book, Group } from "bkper";
import EventHandler from "./EventHandler";

export default class EventHandlerTransactionDeleted extends EventHandler {

  protected async processTransaction(book: Book, transaction: bkper.Transaction): Promise<string[] | string | boolean> {
    var creditAccount = await book.getAccount(transaction.creditAccount.id);
    
    var debitAccount = await book.getAccount(transaction.debitAccount.id);

    let transactionsIds: string[] = [];

    transactionsIds = transactionsIds.concat(await this.getTaxTransactionsIds(book, creditAccount, transaction));
    transactionsIds = transactionsIds.concat(await this.getTaxTransactionsIds(book, debitAccount, transaction));

    if (transactionsIds.length == 0) {
      return false;
    }

    let deletedRecords: string[] = [];
    for (const id of transactionsIds) {
      let iterator = book.getTransactions(`remoteId:${id}`);
      if (await iterator.hasNext()) {
        let tx = await iterator.next();
        if (tx.isChecked()) {
          tx = await tx.uncheck();
        }
        tx = await tx.remove();
        deletedRecords.push(`DELETED: ${tx.getDateFormatted()} ${tx.getAmount()} ${tx.getDescription()}`)
      }
    }

    if (deletedRecords.length != 0) {
      return deletedRecords;
    } else {
      return false;
    }
  }

  private async getTaxTransactionsIds(book: Book, account: Account, transaction: bkper.Transaction): Promise<string[]> {

    let transactionsIds: string[] = [];

    let accountTransactionId = this.getTaxTransactionId(book, account, transaction);
    if (accountTransactionId != null) {
      transactionsIds.push(accountTransactionId)
    }

    let groups = await account.getGroups();
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