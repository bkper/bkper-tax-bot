import Bkper from "bkper-node/lib";
import Account from "bkper-node/lib/model/Account";
import Book from "bkper-node/lib/model/Book";
import Group from "bkper-node/lib/model/Group";

export default abstract class EventHandler {

  protected abstract processTransaction(book: Book, transaction: bkper.Transaction): Promise<string[] | string | boolean>;
  
  async handleEvent(event: bkper.Event): Promise<string[] | string | boolean> {
    let bookId = event.bookId;
    let operation = event.data.object as bkper.TransactionOperation;
    let transaction = operation.transaction;
    var book = await Bkper.getBook(bookId);

    if (!transaction.posted) {
      return null;
    }

    return this.processTransaction(book, transaction);
  }

  protected getId(transaction: bkper.Transaction, accountOrGroup: Account | Group) {
    return `tax_${transaction.id}_${accountOrGroup.getId()}`;
  }

}