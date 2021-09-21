import { Account, Book, Bkper, Group } from "bkper";
import EventHandlerTransactionDeleted from "./EventHandlerTransactionDeleted";
import EventHandlerTransactionPosted from "./EventHandlerTransactionPosted";

export default class EventHandlerTransactionUpdated {

  
  async handleEvent(event: bkper.Event): Promise<string[] | string | boolean> {
    //TODO only update if accounts or amount has change
    if (!event.data.previousAttributes['creditAccId'] && !event.data.previousAttributes['debitAccId'] && !event.data.previousAttributes['amount']) {
      return 'No changes in accounts or amount. Keeping previous calculated taxes.'
    }

    let deletedResult = await new EventHandlerTransactionDeleted().handleEvent(event)
    let postedResult = await new EventHandlerTransactionPosted().handleEvent(event);
    
    let result: string[] = [];
    if (deletedResult && Array.isArray(deletedResult) && deletedResult.length > 0) {
      result = result.concat(deletedResult);
    }
    if (postedResult && Array.isArray(postedResult) && postedResult.length > 0) {
      result = result.concat(postedResult);
    }
    return result.length > 0 ? result : false;
  }

}