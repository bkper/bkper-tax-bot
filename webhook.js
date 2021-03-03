const ngrok = require('ngrok');
const Bkper = require('bkper').Bkper;

//Ensure env at right location
require('dotenv').config();

process.env.NODE_ENV='development';

const app = Bkper.setApiKey(process.env.BKPER_API_KEY);

(async function() {
  const url = await ngrok.connect({ port: 3001 });
  console.log(`Started ngrok at ${url}`);
  await app.setWebhookUrlDev(url).patch()
})();


async function exit() {
  try {
    await app.setWebhookUrlDev(null).patch();
    console.log(' \nRemoved webhook.')
  } catch (err) {
    console.log(err)
  }
  process.exit();
}

process.on('exit', exit);
process.on('SIGINT', exit);
process.on('SIGUSR1', exit);
process.on('SIGUSR2', exit);
process.on('uncaughtException', exit);