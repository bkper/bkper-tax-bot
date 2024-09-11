import { connect } from 'ngrok';
import { getOAuthToken } from 'bkper';
import { Bkper, App } from 'bkper-js';
import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'development';

Bkper.setConfig({
  oauthTokenProvider: () => getOAuthToken(),
  apiKeyProvider: () => process.env.BKPER_API_KEY,
})

const app = new App();

(async function () {
  try {
    const url = await connect({ port: 3001 });
    console.log(`Started ngrok at ${url}`);
    await app.setWebhookUrlDev(url).patch();
  } catch (err) {
    console.log(err);
  }
})();

async function exit() {
  try {
    await app.setWebhookUrlDev(null).patch();
    console.log(' \nRemoved webhook.');
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
