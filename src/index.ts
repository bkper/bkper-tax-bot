import 'source-map-support/register'
import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';
import Bkper from 'bkper-node';
import EventHandlerTransactionDeleted from './EventHandlerTransactionDeleted';
import EventHandlerTransactionPosted from "./EventHandlerTransactionPosted";
require('dotenv').config()

export const doPost: HttpFunction = async (req, res) => {

  res.setHeader('Content-Type', 'application/json');

  try {

    Bkper.setApiKey(process.env.BKPER_API_KEY ? process.env.BKPER_API_KEY : req.headers['bkper-api-key'] as string)
    Bkper.setOAuthTokenProvider(async () => req.headers['bkper-oauth-token'] as string)

    let event: bkper.Event = req.body
    let result: { result: string[] | string | boolean } = { result: false };

    console.log(`Received ${event.type} event...`)

    switch (event.type) {
      case 'TRANSACTION_POSTED':
        result.result = await new EventHandlerTransactionPosted().handleEvent(event);
        break;
      case 'TRANSACTION_DELETED':
        result.result = await new EventHandlerTransactionDeleted().handleEvent(event);
        break;
      case 'TRANSACTION_RESTORED':
        result.result = await new EventHandlerTransactionPosted().handleEvent(event);
        break;
      case 'TRANSACTION_RESTORED':
        result.result = await new EventHandlerTransactionPosted().handleEvent(event);
        break;
      case 'TRANSACTION_UPDATED':
        new EventHandlerTransactionDeleted().handleEvent(event)
        result.result = await new EventHandlerTransactionPosted().handleEvent(event);
        break;
    }

    console.log(result)

    res.send(JSON.stringify(result, null, 4))

  } catch (err) {
    res.send(JSON.stringify({ 
      error: err.stack.split("\n")
    }, null, 4))
  }

};






// /**
//  * Trigger called upon transaction updated. See bkper.yaml for configured triggers.
//  */
// function onTransactionUpdated(event: bkper.Event) {
//   //First call DELETE handler to delete already created tax transactions.
//   new EventHandlerTransactionDeleted().handleEvent(event);
//   //Then call same POSTED event handler to repost tax transactions  
//   return new EventHandlerTransactionPosted().handleEvent(event);
// }

