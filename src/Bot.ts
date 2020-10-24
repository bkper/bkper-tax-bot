BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('BOT_KEY'));

/**
 * Trigger called upon transaction posted
 */
function onTransactionPosted(event: bkper.Event) {
  return new EventHandlerTransactionPosted().handleEvent(event);
}

/**
 * Trigger called upon transaction deleted
 */
function onTransactionDeleted(event: bkper.Event) {
  return new EventHandlerTransactionDeleted().handleEvent(event);
}

/**
 * Trigger called upon transaction posted
 */
function onTransactionRestored(event: bkper.Event) {
  //Call same POSTED event handler to repost tax transactions 
  return new EventHandlerTransactionPosted().handleEvent(event);
}