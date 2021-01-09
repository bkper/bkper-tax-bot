// BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('BOT_KEY'));

// /**
//  * Trigger called upon transaction posted. See bkper.yaml for configured triggers.
//  */
// function onTransactionPosted(event: bkper.Event) {
//   return new EventHandlerTransactionPosted().handleEvent(event);
// }

// /**
//  * Trigger called upon transaction deleted. See bkper.yaml for configured triggers.
//  */
// function onTransactionDeleted(event: bkper.Event) {
//   return new EventHandlerTransactionDeleted().handleEvent(event);
// }

// /**
//  * Trigger called upon transaction restored. See bkper.yaml for configured triggers.
//  */
// function onTransactionRestored(event: bkper.Event) {
//   //Call same POSTED event handler to repost tax transactions 
//   return new EventHandlerTransactionPosted().handleEvent(event);
// }

// /**
//  * Trigger called upon transaction updated. See bkper.yaml for configured triggers.
//  */
// function onTransactionUpdated(event: bkper.Event) {
//   //First call DELETE handler to delete already created tax transactions.
//   new EventHandlerTransactionDeleted().handleEvent(event);
//   //Then call same POSTED event handler to repost tax transactions  
//   return new EventHandlerTransactionPosted().handleEvent(event);
// }