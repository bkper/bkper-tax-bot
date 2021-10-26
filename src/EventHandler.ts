import { Account, Book, Bkper, Group } from "bkper";

export default abstract class EventHandler {

  protected abstract processTransaction(book: Book, transaction: bkper.Transaction, event: bkper.Event): Promise<string[] | string | boolean>;
  
  async handleEvent(event: bkper.Event): Promise<string[] | string | boolean> {
    let operation = event.data.object as bkper.TransactionOperation;
    let transaction = operation.transaction;
    let book = Bkper.newBook(event.book);

    if (!transaction.posted) {
      return false;
    }

    if (transaction.agentId == 'exchange-bot') {
      console.log("Skipping Exchange Bot Agent.");
      return false;
    } 

    return this.processTransaction(book, transaction, event);
  }

  protected getId(taxTag: string, transaction: bkper.Transaction, accountOrGroup: Account | Group) {
    return `${taxTag}_${transaction.id}_${accountOrGroup.getId()}`;
  }

}