import { AppContext } from "./AppContext.js";
import EventHandlerTransactionDeleted from "./EventHandlerTransactionDeleted.js";
import EventHandlerTransactionPosted from "./EventHandlerTransactionPosted.js";

export default class EventHandlerTransactionUpdated {
    protected context: AppContext;

    constructor(context: AppContext) {
        this.context = context;
    }

    async handleEvent(event: bkper.Event): Promise<string[] | string | boolean> {
        //TODO only update if accounts or amounts (transaction amount or tax amount) has changed

        if (event.data.previousAttributes && !event.data.previousAttributes['dateValue'] && !event.data.previousAttributes['creditAccId'] && !event.data.previousAttributes['debitAccId'] && !event.data.previousAttributes['amount'] && event.data.previousAttributes['tax_included_amount'] == undefined && event.data.previousAttributes['tax_excluded_amount'] == undefined) {
            return 'No changes in accounts or amount. Keeping previous calculated taxes.'
        }

        let deletedResult = await new EventHandlerTransactionDeleted(this.context).handleEvent(event)
        let postedResult = await new EventHandlerTransactionPosted(this.context).handleEvent(event);

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