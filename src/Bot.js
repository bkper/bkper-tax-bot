BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('BOT_KEY'));

/**
 * Trigger called upon transaction posted
 */
function onTransactionPosted(bookId, transaction) {

  var book = BkperApp.openById(bookId);

  let skippedAgents = book.getProperty('tax_skip', 'tax_skipped_bots');
  if (skippedAgents != null && skippedAgents.includes(transaction.agentId)) {
    //Skip bots from calculating taxes. 
    //Specially important when working alongside other bots to avoid infinite loop.
    return false;
  }

  var creditAccount = book.getAccount(transaction.creditAccId);

  var debitAccount = book.getAccount(transaction.debitAccId);


  var recordText = '';
  
  recordText += getRecordText_(book, transaction, creditAccount, true);
  recordText += getRecordText_(book, transaction, debitAccount, false);
  
  if (recordText.trim() != '') {
    //Record with id to make it idempotent
    book.record( `${recordText} id:tax_${transaction.id}`);
    return recordText;
  } else {
    return false;
  }

}

function getRecordText_(book, transaction, account, credit) {
    var taxTag = account.getProperty('tax_rate');
    if (!taxTag || taxTag == '') return '';
    
    // Only calculate tax for incoming transactions  / Avoid loop
    if (account.isCredit() != credit) return '';
    
    var tax = new Number(taxTag);
    var amount = (transaction.amount * tax) / (100 + tax);
    
    var tax_description = account.getProperty('tax_description');

    if (tax_description == null) {
      tax_description = '';
    }

    tax_description = tax_description.replace('${transaction.description}', transaction.description);
    tax_description = tax_description.replace('${account.name}', account.getName());
    
    return `${transaction.informedDateText} ${book.formatValue(amount)} ${tax_description}`;
}


