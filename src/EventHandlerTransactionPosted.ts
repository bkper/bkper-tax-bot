import { Account, Book, Group, Transaction, Amount } from "bkper";
import { ACCOUNT_NAME_EXP, TAX_AMOUNT_PROP, TAX_DESCRIPTION_PROP, TAX_EXCLUDED_PROP, TAX_INCLUDED_PROP, TAX_RATE_LEGACY, TAX_ROUND_PROP, TRANSACTION_DESCRIPTION_EXP } from "./constants";
import EventHandler from "./EventHandler";

export default class EventHandlerTransactionPosted extends EventHandler {

  protected async processTransaction(book: Book, transaction: bkper.Transaction): Promise<string[] | string | boolean> {

    if (transaction.agentId == 'sales-tax-bot') {
      console.log("Same payload agent. Preventing bot loop.");
      return false;
    }

    var creditAccount = await book.getAccount(transaction.creditAccount.id);
    var debitAccount = await book.getAccount(transaction.debitAccount.id);
    
    let fullNonIncludedTax = await this.getFullTaxRate_(book, creditAccount, debitAccount, false);
    let netAmount = new Amount(transaction.amount);

    let taxAmount = transaction.properties[TAX_AMOUNT_PROP] ? book.parseValue(transaction.properties[TAX_AMOUNT_PROP]) : null;

    //Ensure tax amount positive
    if (taxAmount) {
      taxAmount = taxAmount.abs();
    }

    let fullIncludedTax = await this.getFullTaxRate_(book, creditAccount, debitAccount, true);

    if (fullIncludedTax.eq(0) && fullNonIncludedTax.eq(0) && (taxAmount == null || taxAmount.eq(0))) {
      return false;
    }

    if (fullIncludedTax.gte(100)) {
      return `Cannot process more than 100% in total taxes. Sum of all taxes: ${fullIncludedTax}`;
    }

    if (fullIncludedTax.gt(0) && taxAmount == null) {
      // netAmount = +transaction.amount - ((+transaction.amount * fullIncludedTax) / (100 + fullIncludedTax));
      const includedTaxAmount = (fullIncludedTax.times(transaction.amount)).div(fullIncludedTax.plus(100));
      netAmount = new Amount(transaction.amount).minus(includedTaxAmount);
    } else if (taxAmount != null) {
      netAmount = new Amount(transaction.amount).minus(taxAmount);
    }

    let transactions: Transaction[] = [];

    transactions = transactions.concat(await this.getTaxTransactions(book, creditAccount, transaction, netAmount, taxAmount));
    transactions = transactions.concat(await this.getTaxTransactions(book, debitAccount, transaction, netAmount, taxAmount));

    if (transactions.length > 0) {
      transactions = await book.batchCreateTransactions(transactions);
      if (transactions.length > 0) {
        return transactions.map(tx => `POSTED: ${tx.getDateFormatted()} ${tx.getAmount()} ${tx.getDescription()}`);
      } else {
        return false;
      }
    } else {
      return false;
    }

  }


  private async getFullTaxRate_(book: Book, creditAccount: Account, debitAccount: Account, included: boolean): Promise<Amount> {
    let totalTax = new Amount('0')
    totalTax = totalTax.plus(await this.getFullTaxRateFromAccount_(book, creditAccount, included));
    totalTax = totalTax.plus(await this.getFullTaxRateFromAccount_(book, debitAccount, included));
    return totalTax;
  }

  private async getFullTaxRateFromAccount_(book: Book, account: Account, included: boolean): Promise<Amount> {
    let totalTax = this.getTaxRateFromAccountOrGroup_(book, account, included);
    let groups = await account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        totalTax = totalTax.plus(this.getTaxRateFromAccountOrGroup_(book, group, included));
      }
    }
    return totalTax;
  }

  private getTaxRateFromAccountOrGroup_(book: Book, accountOrGroup: Account | Group, included: boolean): Amount {

    let taxTag = accountOrGroup.getProperty(TAX_RATE_LEGACY);
    if (taxTag == null) {
      let taxIncluded = accountOrGroup.getProperty(TAX_INCLUDED_PROP);
      if (included && taxIncluded) {
        return book.parseValue(taxIncluded);
      }
      let taxExcluded = accountOrGroup.getProperty(TAX_EXCLUDED_PROP);
      if (!included && taxExcluded) {
        return book.parseValue(taxExcluded);
      }
      return new Amount(0);
      
    } else {
      const tax = book.parseValue(taxTag);
      if (included && tax.lt(0)) {
        return new Amount('0');
      }
  
      if (!included && tax.gt(0)) {
        return new Amount('0');
      }
  
      return tax;
    }
  }

  private async getTaxTransactions(book: Book, account: Account, transaction: bkper.Transaction, netAmount: Amount, taxAmount: Amount): Promise<Transaction[]> {

    let transactions: Transaction[] = [];
    this.addTaxTransactions(book, account, account, transaction, netAmount, taxAmount, transactions);

    let groups = await account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        this.addTaxTransactions(book, group, account, transaction, netAmount, taxAmount, transactions);
      }
    }

    return transactions;
  }



  private addTaxTransactions(book: Book, accountOrGroup: Account|Group, account: Account, transaction: bkper.Transaction, netAmount: Amount, taxAmount: Amount, transactions: Transaction[]) {
    let taxTags = [TAX_RATE_LEGACY, TAX_EXCLUDED_PROP, TAX_INCLUDED_PROP];
    for (const taxTag of taxTags) {
      let taxTx = this.createTaxTransaction(book, accountOrGroup, account.getName(), transaction, taxTag, netAmount, taxAmount);
      if (taxTx != null) {
        transactions.push(taxTx);
      }
    }
  }

  private createTaxTransaction(book: Book, accountOrGroup: Account | Group, accountName: string, transaction: bkper.Transaction, taxProperty: string, netAmount: Amount, taxAmount: Amount): Transaction {

    let taxPropertyValue = accountOrGroup.getProperty(taxProperty);

    if (taxPropertyValue == null || taxPropertyValue.trim() == '') {
      return null;
    }

    let tax = book.parseValue(taxPropertyValue);

    if (tax.eq(0) && (taxAmount == null || taxAmount.eq(0))) {
      return null;
    }

    let isIncluded = (taxProperty == TAX_INCLUDED_PROP || (taxProperty == TAX_RATE_LEGACY && tax.gt(0)));


    // Fixed tax_amount overrides included tax
    let amount: Amount = isIncluded && taxAmount ? taxAmount : netAmount.times(tax.div(100));

    amount = amount.abs();

    if (amount.eq(0)) {
      return null;
    }

    let tax_description = accountOrGroup.getProperty(TAX_DESCRIPTION_PROP);

    if (tax_description == null) {
      tax_description = '';
    }

    let tax_round = +transaction.properties[TAX_ROUND_PROP];
    if (tax_round != null && !isNaN(tax_round) && tax_round <= 8) {
      amount = amount.round(tax_round);
    }

    tax_description = tax_description.replace(TRANSACTION_DESCRIPTION_EXP, transaction.description);
    tax_description = tax_description.replace(ACCOUNT_NAME_EXP, accountName);

    let taxTag = taxProperty == TAX_RATE_LEGACY ? 'tax' : taxProperty;

    let id = `${super.getId(taxTag, transaction, accountOrGroup)}`

    let taxTransaction = book.newTransaction()
                          .addRemoteId(id)
                          .setDate(transaction.date)
                          .setAmount(amount)
                          .setDescription(tax_description);

    return taxTransaction;
  }

}