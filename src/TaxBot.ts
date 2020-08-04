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

  let fullIncludedTax = getFullTaxRate_(creditAccount, debitAccount, true);
  let fullNonIncludedTax = getFullTaxRate_(creditAccount, debitAccount, false);

  if (fullIncludedTax == 0 && fullNonIncludedTax == 0) {
    return false;
  }

  if (fullIncludedTax >= 100) {
    return `Cannot process more than 100% in total taxes. Sum of all taxes: ${fullIncludedTax}`;
  }
  
  let netAmount = transaction.amount - ((transaction.amount * fullIncludedTax) / (100 + fullIncludedTax));
  
  let records = new Array<string>();
  
  records = records.concat(getRecords_(netAmount, book, transaction, creditAccount));
  records = records.concat(getRecords_(netAmount, book, transaction, debitAccount));
  
  if (records.length > 0) {
    //Record with id to make it idempotent
    book.record(records.join("\n"));
    return records;
  } else {
    return false;
  }

}

function getFullTaxRate_(creditAccount: Bkper.Account, debitAccount: Bkper.Account, included: boolean): number {
  let totalTax = 0;
  totalTax += getFullTaxRateFromAccount_(creditAccount, included);
  totalTax += getFullTaxRateFromAccount_(debitAccount, included);
  return totalTax;
}

function getFullTaxRateFromAccount_(account: Bkper.Account, included: boolean): number {
  let totalTax = getTaxRateFromAccountOrGroup_(account, included);
  let groups = account.getGroups();
  if (groups != null) {
    for (var group of groups) {
      totalTax += getTaxRateFromAccountOrGroup_(group, included);      
    }
  }
  return totalTax;
}

function getTaxRateFromAccountOrGroup_(accountOrGroup: Bkper.Account|Bkper.Group, included: boolean): number {
  let taxTag = accountOrGroup.getProperty('tax_rate');
  if (taxTag == null || taxTag.trim() == '') { 
    return 0;
  }
  const tax = new Number(taxTag).valueOf();
  if (included && tax < 0) {
    return 0;
  }

  if (!included && tax > 0) {
    return 0;
  }

  return tax;
}

function getRecords_(netAmount: number, book: Bkper.Book, transaction: bkper.TransactionV2Payload, account: Bkper.Account): string[] {

  let records = new Array<string>();

  let record = getRecordText(netAmount, account, account.getName(), transaction, book);
  if (record != null) {
    records.push(record)
  }

  let groups = account.getGroups();
  if (groups != null) {
    for (var group of groups) {
      let groupRecord = getRecordText(netAmount, group, account.getName(), transaction, book);
      if (groupRecord != null) {
        records.push(groupRecord);
      }
    }
  }

  return records;
}


function getRecordText(netAmount: number, accountOrGroup: Bkper.Account|Bkper.Group, accountName: string, transaction: bkper.TransactionV2Payload, book: Bkper.Book) {
  let taxTag = accountOrGroup.getProperty('tax_rate');

  if (taxTag == null || taxTag.trim() == '') { 
    return null;
  }

  let tax = new Number(taxTag).valueOf();

  if (tax < 0) {
    tax *= -1;
  }

  let amount = netAmount * (tax/100);

  let tax_description = accountOrGroup.getProperty('tax_description');

  if (tax_description == null) {
    tax_description = '';
  }

  tax_description = tax_description.replace('${transaction.description}', transaction.description);
  tax_description = tax_description.replace('${account.name}', accountName);
  
  let id = `id:tax_${transaction.id}_${accountOrGroup.getId()}`

  return `${transaction.informedDateText} ${book.formatValue(amount)} ${tax_description} ${id}`;
}

