BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('BOT_KEY'));

/**
 * Trigger called upon transaction posted
 */
function onTransactionPosted(event: bkper.Event) {
  return new EventHandlerTransactionPosted().handleEvent(event);
}