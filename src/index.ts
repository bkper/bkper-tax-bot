import 'source-map-support/register.js';
import { HttpFunction } from '@google-cloud/functions-framework/build/src/functions';
import { Bkper } from 'bkper-js';
import EventHandlerTransactionDeleted from './EventHandlerTransactionDeleted.js';
import EventHandlerTransactionPosted from "./EventHandlerTransactionPosted.js";
import { Request, Response } from 'express';
import express from 'express';
import httpContext from 'express-http-context';
import EventHandlerTransactionUpdated from './EventHandlerTransactionUpdated.js';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(httpContext.middleware);
app.use('/', handleEvent);
export const doPost: HttpFunction = app;


function init(req: Request, res: Response) {

  res.setHeader('Content-Type', 'application/json');

  // Put OAuth token from header in the http context for later use when calling the API. https://julio.li/b/2016/10/29/request-persistence-express/
  const oauthTokenHeader = 'bkper-oauth-token';
  httpContext.set(oauthTokenHeader, req.headers[oauthTokenHeader]);

  Bkper.setConfig({
    oauthTokenProvider: process.env.NODE_ENV === 'development' ? async () => import('bkper').then(bkper => bkper.getOAuthToken()) : async () => httpContext.get(oauthTokenHeader),
    apiKeyProvider: async () => process.env.BKPER_API_KEY || req.headers['bkper-api-key'] as string
  })

}

async function handleEvent(req: Request, res: Response) {

  init(req, res);

  try {

    let event: bkper.Event = req.body;
    let result: { result: string[] | string | boolean } = { result: false };

    console.log(`Received ${event.type} event from ${event?.user?.username}...`);

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
        result.result = await new EventHandlerTransactionUpdated().handleEvent(event);
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
