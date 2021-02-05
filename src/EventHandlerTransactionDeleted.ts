import { Account, Book, Group } from "bkper";
import {TAX_EXCLUDED_LEGACY_PROP, TAX_EXCLUDED_RATE_PROP, TAX_INCLUDED_LEGACY_PROP, TAX_INCLUDED_RATE_PROP, TAX_RATE_LEGACY_PROP } from "./constants";
import EventHandler from "./EventHandler";

export default class EventHandlerTransactionDeleted extends EventHandler {

  protected async processTransaction(book: Book, transaction: bkper.Transaction, event: bkper.Event): Promise<string[] | string | boolean> {
    var creditAccount = await book.getAccount(transaction.creditAccount.id);
    
    var debitAccount = await book.getAccount(transaction.debitAccount.id);

    let transactionsIds: string[] = [];

    transactionsIds = transactionsIds.concat(await this.getTaxTransactionsIds(book, creditAccount, transaction));
    transactionsIds = transactionsIds.concat(await this.getTaxTransactionsIds(book, debitAccount, transaction));

    if (event.data.previousAttributes) {
      let oldCreditAccountId = event.data.previousAttributes['creditAccId'];
      if (oldCreditAccountId && oldCreditAccountId != transaction.creditAccount.id) {
        let oldCreditAccount = await book.getAccount(oldCreditAccountId);
        transactionsIds = transactionsIds.concat(await this.getTaxTransactionsIds(book, oldCreditAccount, transaction));
      }

      let oldDebitAccountId = event.data.previousAttributes['debitAccId'];
      if (oldDebitAccountId && oldDebitAccountId != transaction.debitAccount.id) {
        let oldDebitAccount = await book.getAccount(oldDebitAccountId);
        transactionsIds = transactionsIds.concat(await this.getTaxTransactionsIds(book, oldDebitAccount, transaction));
      }
    }


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
        deletedRecords.push(`DELETED: ${tx.getDateFormatted()} ${book.formatValue(tx.getAmount())} ${tx.getDescription()}`)
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

    this.addTaxTransactions(book, account, transaction, transactionsIds);

    let groups = await account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        this.addTaxTransactions(book, group, transaction, transactionsIds);
      }
    }

    return transactionsIds;
  }

  private addTaxTransactions(book: Book, accountOrGroup: Account|Group, transaction: bkper.Transaction, txIds: string[]) {
    let taxTags = [TAX_RATE_LEGACY_PROP, TAX_INCLUDED_RATE_PROP, TAX_INCLUDED_LEGACY_PROP, TAX_EXCLUDED_RATE_PROP, TAX_EXCLUDED_LEGACY_PROP];
    for (const taxTag of taxTags) {
      let taxTxId = this.getTaxTransactionId(book, accountOrGroup, transaction, taxTag);
      if (taxTxId != null) {
        txIds.push(taxTxId);
      }
    }
  }

  private getTaxTransactionId(book: Book, accountOrGroup: Account | Group, transaction: bkper.Transaction, taxProperty: string,): string {

    let taxPropertyValue = accountOrGroup.getProperty(taxProperty);

    if (taxPropertyValue == null || taxPropertyValue.trim() == '') {
      return null;
    }

    let taxTag = taxProperty == TAX_RATE_LEGACY_PROP ? 'tax' : taxProperty;

    return `${super.getId(taxTag, transaction, accountOrGroup)}`
  }

}