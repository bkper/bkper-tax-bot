BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('BOT_KEY'));

/**
 * Trigger called upon transaction posted
 */
function onTransactionPosted(bookId: string, transaction: bkper.TransactionV2Payload) {

  var book = BkperApp.getBook(bookId);

  let skippedAgents = book.getProperty('tax_skip', 'tax_skipped_bots');
  if (skippedAgents != null && skippedAgents.includes(transaction.agentId)) {
    //Skip bots from calculating taxes. 
    //Specially important when working alongside other bots to avoid infinite loop.
    return false;
  }

  var creditAccount = book.getAccount(transaction.creditAccId);
  var debitAccount = book.getAccount(transaction.debitAccId);

  let records = new Array<string>();
  
  records = records.concat(getRecords_(book, transaction, creditAccount));
  records = records.concat(getRecords_(book, transaction, debitAccount));
  
  if (records.length > 0) {
    //Record with id to make it idempotent
    book.record(records.join("\n"));
    return records;
  } else {
    return false;
  }

}

function getRecords_(book: Bkper.Book, transaction: bkper.TransactionV2Payload, account: Bkper.Account): string[] {

  let records = new Array<string>();

  let record = getRecordText(account, account.getName(), transaction, book);
  if (record != null) {
    records.push(record)
  }

  let groups = account.getGroups();
  if (groups != null) {
    for (var group of groups) {
      let groupRecord = getRecordText(group, account.getName(), transaction, book);
      if (groupRecord != null) {
        records.push(groupRecord);
      }
    }
  }

  return records;
}


function getRecordText(accountOrGroup: Bkper.Account|Bkper.Group, accountName: string, transaction: bkper.TransactionV2Payload, book: Bkper.Book) {
  let taxTag = accountOrGroup.getProperty('tax_rate');

  if (taxTag == null || taxTag.trim() == '') { 
    return null;
  }

  let tax = new Number(taxTag).valueOf();
  let amount = (transaction.amount * tax) / (100 + tax);

  let tax_description = accountOrGroup.getProperty('tax_description');

  if (tax_description == null) {
    tax_description = '';
  }

  tax_description = tax_description.replace('${transaction.description}', transaction.description);
  tax_description = tax_description.replace('${account.name}', accountName);
  
  let id = `id:tax_${transaction.id}_${accountOrGroup.getId()}`

  return `${transaction.informedDateText} ${book.formatValue(amount)} ${tax_description} ${id}`;
}

