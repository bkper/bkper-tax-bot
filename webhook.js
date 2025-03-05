import ngrok from '@ngrok/ngrok';
import { Bkper } from 'bkper-js';
import { getOAuthToken } from 'bkper'
import { App } from 'bkper-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

dotenv.config({path:`${__dirname}/.env`})
process.env.NODE_ENV='development';

Bkper.setConfig({
  oauthTokenProvider: () => getOAuthToken(),
  apiKeyProvider: () => process.env.BKPER_API_KEY,
})

const app = new App();
let listener;

(async function() {
  try {
    console.log("Starting ngrok...");
    listener = await ngrok.forward({ port: 3041, authtoken_from_env: true });
    const url = listener.url();
    console.log(`Started ngrok at ${url}`);
    await app.setWebhookUrlDev(url).patch();
  } catch (err) {
    console.log(err);
    throw err;
  }
})();

async function exit() {
  try {
    await app.setWebhookUrlDev(null).patch();
    console.log(' \nRemoved webhook.')
    if (listener) {
      listener.close();
    }
  } catch (err) {
    console.log(err);
  }
  process.exit();
}



process.on('exit', exit);
process.on('SIGINT', exit);
process.on('SIGUSR1', exit);
process.on('SIGUSR2', exit);
process.on('uncaughtException', exit);

process.stdin.resume();