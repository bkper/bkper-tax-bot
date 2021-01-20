import { Account, Book, Bkper, Group } from "bkper";

export default abstract class EventHandler {

  protected abstract processTransaction(book: Book, transaction: bkper.Transaction): Promise<string[] | string | boolean>;
  
  async handleEvent(event: bkper.Event): Promise<string[] | string | boolean> {
    let bookId = event.bookId;
    let operation = event.data.object as bkper.TransactionOperation;
    let transaction = operation.transaction;
    var book = await Bkper.getBook(bookId);

    if (!transaction.posted) {
      return false;
    }

    return this.processTransaction(book, transaction);
  }

  protected getId(taxTag: string, transaction: bkper.Transaction, accountOrGroup: Account | Group) {
    return `${taxTag}_${transaction.id}_${accountOrGroup.getId()}`;
  }

}