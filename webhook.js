const localtunnel = require('localtunnel');
const Bkper = require('bkper').Bkper;

//Ensure env at right location
require('dotenv').config();

process.env.NODE_ENV='development';

const app = Bkper.setApiKey(process.env.BKPER_API_KEY);


(async () => {
  try {
    const tunnel = await localtunnel({ port: 3001 });
    await app.setWebhookUrlDev(tunnel.url).patch()
    console.log(`Listening at ${tunnel.url}`);
    tunnel.on('close', async () => {
      await exit()
    });    
  } catch (err) {
    console.log(err)
  }  
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