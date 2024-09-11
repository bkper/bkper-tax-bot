import { Account, Book, Bkper, Group } from "bkper-js";

export default abstract class EventHandler {

  protected abstract processTransaction(book: Book, transaction: bkper.Transaction, event: bkper.Event): Promise<string[] | string | boolean>;
  
  async handleEvent(event: bkper.Event): Promise<string[] | string | boolean> {
    let operation = event.data.object as bkper.TransactionOperation;
    let transaction = operation.transaction;
    let book = new Book(event.book);

    if (!transaction.posted) {
      return false;
    }

    if (transaction.agentId == 'exchange-bot') {
      console.log("Skipping Exchange Bot Agent.");
      return false;
    } 
    const logtag = `Handling ${event.type} event on book ${book.getName()} from user ${event.user.username}`;
    console.time(logtag)

    const response = this.processTransaction(book, transaction, event);
    
    console.timeEnd(logtag)

    return response;
  }

  protected getId(taxTag: string, transaction: bkper.Transaction, accountOrGroup: bkper.Account | bkper.Group) {
    return `${taxTag}_${transaction.id}_${accountOrGroup.id}`;
  }

}