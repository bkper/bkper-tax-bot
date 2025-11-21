import 'source-map-support/register.js';
import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';
import { Bkper } from 'bkper-js';
import { Request, Response } from 'express';
import express from 'express';
import httpContext from 'express-http-context';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { AppContext } from './AppContext.js';
import EventHandlerTransactionDeleted from './EventHandlerTransactionDeleted.js';
import EventHandlerTransactionPosted from "./EventHandlerTransactionPosted.js";
import EventHandlerTransactionUpdated from './EventHandlerTransactionUpdated.js';

// Ensure env at right location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
app.use(httpContext.middleware);
app.use('/', handleEvent);
export const doPost: HttpFunction = app;


function init(req: Request, res: Response): AppContext {

  res.setHeader('Content-Type', 'application/json');

  const bkper = new Bkper({
      oauthTokenProvider: async () => req.headers['bkper-oauth-token'] as string,
      apiKeyProvider: async () => process.env.BKPER_API_KEY || req.headers['bkper-api-key'] as string
  })

  return new AppContext(httpContext, bkper);

}

async function handleEvent(req: Request, res: Response) {

  const context = init(req, res);

  try {

    let event: bkper.Event = req.body;
    let result: { result: string[] | string | boolean } = { result: false };

    console.log(`Received ${event.type} event from ${event?.user?.username}...`);

    switch (event.type) {
      case 'TRANSACTION_POSTED':
        result.result = await new EventHandlerTransactionPosted(context).handleEvent(event);
        break;
      case 'TRANSACTION_DELETED':
        result.result = await new EventHandlerTransactionDeleted(context).handleEvent(event);
        break;
      case 'TRANSACTION_RESTORED':
        result.result = await new EventHandlerTransactionPosted(context).handleEvent(event);
        break;
      case 'TRANSACTION_RESTORED':
        result.result = await new EventHandlerTransactionPosted(context).handleEvent(event);
        break;
      case 'TRANSACTION_UPDATED':
        result.result = await new EventHandlerTransactionUpdated(context).handleEvent(event);
        break;
    }

    console.log(`Result: ${JSON.stringify(result)}`);
    res.send(response(result));

  } catch (err: any) {
    console.error(err);
    res.send(response({ error: err.stack ? err.stack.split("\n") : err }));
  }

}

function response(result: any): string {
  const body = JSON.stringify(result, null, 4);
  return body;
}
