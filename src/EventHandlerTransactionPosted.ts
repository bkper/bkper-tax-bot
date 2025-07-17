import { Amount, Book, Transaction } from "bkper-js";
import { ACCOUNT_CONTRA_NAME_DESTINATION_EXP, ACCOUNT_CONTRA_NAME_EXP, ACCOUNT_CONTRA_NAME_ORIGIN_EXP, ACCOUNT_NAME_DESTINATION_EXP, ACCOUNT_NAME_EXP, ACCOUNT_NAME_ORIGIN_EXP, EXC_AMOUNT_PROP, EXC_CODE_PROP, EXC_DATE_PROP, EXC_RATE_PROP, TAX_DESCRIPTION_PROP, TAX_EXCLUDED_LEGACY_PROP, TAX_EXCLUDED_RATE_PROP, TAX_INCLUDED_AMOUNT_PROP, TAX_EXCLUDED_AMOUNT_PROP, TAX_INCLUDED_LEGACY_PROP, TAX_INCLUDED_RATE_PROP, TAX_RATE_LEGACY_PROP, TAX_ROUND_PROP, TRANSACTION_DESCRIPTION_EXP } from "./constants.js";
import EventHandler from "./EventHandler.js";

export default class EventHandlerTransactionPosted extends EventHandler {

  protected async processTransaction(book: Book, transaction: bkper.Transaction): Promise<string[] | string | boolean> {

    if (transaction.agentId == 'sales-tax-bot') {
      console.log("Same payload agent. Preventing bot loop.");
      return false;
    }

    var creditAccount = transaction.creditAccount;
    var debitAccount = transaction.debitAccount;

    let fullNonIncludedTax = await this.getFullTaxRate_(book, creditAccount, debitAccount, false);

    let netAmount = new Amount(transaction.amount);

    let fullIncludedAmount = await this.getFullTaxAmount_(book, creditAccount, debitAccount, true, transaction);
    let fullNonIncludedAmount = await this.getFullTaxAmount_(book, creditAccount, debitAccount, false, transaction);

    let fullIncludedTax = await this.getFullTaxRate_(book, creditAccount, debitAccount, true);

    if (fullIncludedTax.eq(0) && fullNonIncludedTax.eq(0) && fullIncludedAmount.eq(0) && fullNonIncludedAmount.eq(0)) {
      return false;
    }

    if (fullIncludedTax.gte(100)) {
      return `Cannot process more than 100% in total taxes. Sum of all taxes: ${fullIncludedTax}`;
    }

    if (fullIncludedTax.gt(0) && fullIncludedAmount.eq(0)) {
      // netAmount = +transaction.amount - ((+transaction.amount * fullIncludedTax) / (100 + fullIncludedTax));
      const includedTaxAmount = (fullIncludedTax.times(transaction.amount)).div(fullIncludedTax.plus(100));
      netAmount = new Amount(transaction.amount).minus(includedTaxAmount);
    } else if (fullIncludedAmount.gt(0)) {
      netAmount = new Amount(transaction.amount).minus(fullIncludedAmount);
    }

    let transactions: Transaction[] = [];

    transactions = transactions.concat(this.getTaxTransactions(book, creditAccount, debitAccount, transaction, netAmount));
    transactions = transactions.concat(this.getTaxTransactions(book, debitAccount, creditAccount, transaction, netAmount));

    if (transactions.length > 0) {
      transactions = await book.batchCreateTransactions(transactions);
      if (transactions.length > 0) {
        return transactions.map(tx => `POSTED: ${tx.getDateFormatted()} ${book.formatValue(tx.getAmount())} ${tx.getDescription()}`);
      } else {
        return false;
      }
    } else {
      return false;
    }

  }

  private async getFullTaxRate_(book: Book, creditAccount: bkper.Account, debitAccount: bkper.Account, included: boolean): Promise<Amount> {
    let totalTax = new Amount('0')
    totalTax = totalTax.plus(this.getFullTaxRateFromAccount_(book, creditAccount, included));
    totalTax = totalTax.plus(this.getFullTaxRateFromAccount_(book, debitAccount, included));
    return totalTax;
  }

  private getFullTaxRateFromAccount_(book: Book, account: bkper.Account, included: boolean): Amount {
    let totalTax = this.getTaxRateFromAccountOrGroup_(book, account, included);
    let groups = account.groups;
    if (groups != null) {
      for (var group of groups) {
        totalTax = totalTax.plus(this.getTaxRateFromAccountOrGroup_(book, group, included));
      }
    }
    return totalTax;
  }

  private getTaxRateFromAccountOrGroup_(book: Book, accountOrGroup: bkper.Account | bkper.Group, included: boolean): Amount {

    let taxTag = accountOrGroup.properties[TAX_RATE_LEGACY_PROP];
    if (taxTag == null) {
      let taxIncluded = accountOrGroup.properties[TAX_INCLUDED_RATE_PROP] || accountOrGroup.properties[TAX_INCLUDED_LEGACY_PROP];
      let taxExcluded = accountOrGroup.properties[TAX_EXCLUDED_RATE_PROP] || accountOrGroup.properties[TAX_EXCLUDED_LEGACY_PROP];

      let tax: Amount = null;
      if (included && taxIncluded) {
        tax = book.parseValue(taxIncluded);
      } else if (!included && taxExcluded) {
        tax = book.parseValue(taxExcluded);
      }
      if (!tax) {
        tax = new Amount('0');
      }
      return tax;

    } else {
      const tax = book.parseValue(taxTag);

      if (!tax) {
        return new Amount('0');
      }

      if (included && tax.lt(0)) {
        return new Amount('0');
      }

      if (!included && tax.gt(0)) {
        return new Amount('0');
      }

      return tax;
    }
  }

  private async getFullTaxAmount_(book: Book, creditAccount: bkper.Account, debitAccount: bkper.Account, included: boolean, transaction: bkper.Transaction): Promise<Amount> {
    let totalAmount = new Amount('0')
    totalAmount = totalAmount.plus(this.getFullTaxAmountFromAccount_(book, creditAccount, included, transaction));
    totalAmount = totalAmount.plus(this.getFullTaxAmountFromAccount_(book, debitAccount, included, transaction));
    return totalAmount
  }

  private getFullTaxAmountFromAccount_(book: Book, account: bkper.Account, included: boolean, transaction: bkper.Transaction): Amount {
    let totalAmount = this.getTaxAmountFromAccountOrGroup_(book, account, included, transaction);
    let groups = account.groups;
    if (groups != null) {
      for (const group of groups) {
        totalAmount = totalAmount.plus(this.getTaxAmountFromAccountOrGroup_(book, group, included, transaction));
      }
    }
    return totalAmount;
  }

  private getTaxAmountFromAccountOrGroup_(book: Book, accountOrGroup: bkper.Account | bkper.Group, included: boolean, transaction: bkper.Transaction): Amount {
    let includedAmount = transaction.properties[TAX_INCLUDED_AMOUNT_PROP];
    let excludedAmount = transaction.properties[TAX_EXCLUDED_AMOUNT_PROP];
    let amount: Amount = null;

    if (accountOrGroup.properties[TAX_RATE_LEGACY_PROP] || accountOrGroup.properties[TAX_INCLUDED_RATE_PROP] || accountOrGroup.properties[TAX_INCLUDED_LEGACY_PROP]) {
      if (included && includedAmount) {
        amount = book.parseValue(includedAmount);
      }
    }

    if (accountOrGroup.properties[TAX_EXCLUDED_RATE_PROP] || accountOrGroup.properties[TAX_EXCLUDED_LEGACY_PROP]) {
      if (!included && excludedAmount) {
        amount = book.parseValue(excludedAmount);
      }
    }

    if (!amount) {
      amount = new Amount('0');
    }
    //Ensure tax amount positive
    amount = amount.abs();
    return amount;
  }


  private getTaxTransactions(book: Book, account: bkper.Account, contraAccount: bkper.Account, transaction: bkper.Transaction, netAmount: Amount): Transaction[] {

    let transactions: Transaction[] = [];
    this.addTaxTransactions(book, account, account, contraAccount, transaction, netAmount, transactions);

    let groups = account.groups;
    if (groups != null) {
      for (var group of groups) {
        this.addTaxTransactions(book, group, account, contraAccount, transaction, netAmount, transactions);
      }
    }

    return transactions;
  }

  private addTaxTransactions(book: Book, accountOrGroup: bkper.Account | bkper.Group, account: bkper.Account, contraAccount: bkper.Account, transaction: bkper.Transaction, netAmount: Amount, transactions: Transaction[]) {
    let taxTags = [TAX_RATE_LEGACY_PROP, TAX_INCLUDED_RATE_PROP, TAX_INCLUDED_LEGACY_PROP, TAX_EXCLUDED_RATE_PROP, TAX_EXCLUDED_LEGACY_PROP];
    for (const taxTag of taxTags) {
      let taxTx = this.createTaxTransaction(book, accountOrGroup, account.name, contraAccount.name, transaction, taxTag, netAmount);
      if (taxTx != null) {
        transactions.push(taxTx);
      }
    }
  }

  private createTaxTransaction(book: Book, accountOrGroup: bkper.Account | bkper.Group, accountName: string, contraAccountName: string, transaction: bkper.Transaction, taxProperty: string, netAmount: Amount): Transaction {

    let taxPropertyValue = accountOrGroup.properties[taxProperty];

    if (taxPropertyValue == null || taxPropertyValue.trim() == '') {
      return null;
    }

    let tax = book.parseValue(taxPropertyValue);

    let includedAmount = book.parseValue(transaction.properties[TAX_INCLUDED_AMOUNT_PROP]);
    let excludedAmount = book.parseValue(transaction.properties[TAX_EXCLUDED_AMOUNT_PROP]);
    let taxAmount: Amount = null;

    if (taxProperty == TAX_INCLUDED_RATE_PROP || taxProperty == TAX_INCLUDED_LEGACY_PROP || (taxProperty == TAX_RATE_LEGACY_PROP && tax.gt(0))) {
      taxAmount = includedAmount;
    } else if (taxProperty == TAX_EXCLUDED_RATE_PROP || taxProperty == TAX_EXCLUDED_LEGACY_PROP) {
      taxAmount = excludedAmount;
    }

    if ((tax == null || tax.eq(0)) && (taxAmount == null || taxAmount.eq(0))) {
      return null;
    }

    // Fixed tax_xxxx_amount overrides amount
    let amount: Amount = taxAmount ? taxAmount : netAmount.times(tax.div(100));

    amount = amount.abs();

    if (amount.eq(0)) {
      return null;
    }

    let tax_description = accountOrGroup.properties[TAX_DESCRIPTION_PROP];

    if (tax_description == null) {
      tax_description = '';
    }

    let tax_round = +transaction.properties[TAX_ROUND_PROP];
    if (tax_round != null && !isNaN(tax_round) && tax_round <= 8) {
      amount = amount.round(tax_round);
    } else {
      amount = amount.round(book.getFractionDigits())
    }

    tax_description = tax_description.replace(TRANSACTION_DESCRIPTION_EXP, transaction.description);
    tax_description = tax_description.replace(ACCOUNT_NAME_EXP, accountName);
    tax_description = tax_description.replace(ACCOUNT_CONTRA_NAME_EXP, contraAccountName);

    if (accountName == transaction.creditAccount.name) {
      tax_description = tax_description.replace(ACCOUNT_NAME_ORIGIN_EXP, accountName);
      tax_description = tax_description.replace(ACCOUNT_NAME_DESTINATION_EXP, "");
    }
    if (accountName == transaction.debitAccount.name) {
      tax_description = tax_description.replace(ACCOUNT_NAME_ORIGIN_EXP, "");
      tax_description = tax_description.replace(ACCOUNT_NAME_DESTINATION_EXP, accountName);
    }

    if (contraAccountName == transaction.creditAccount.name) {
      tax_description = tax_description.replace(ACCOUNT_CONTRA_NAME_ORIGIN_EXP, contraAccountName);
      tax_description = tax_description.replace(ACCOUNT_CONTRA_NAME_DESTINATION_EXP, "");
    }
    if (contraAccountName == transaction.debitAccount.name) {
      tax_description = tax_description.replace(ACCOUNT_CONTRA_NAME_ORIGIN_EXP, "");
      tax_description = tax_description.replace(ACCOUNT_CONTRA_NAME_DESTINATION_EXP, contraAccountName);
    }

    let taxTag = taxProperty == TAX_RATE_LEGACY_PROP ? 'tax' : taxProperty;

    let id = `${super.getId(taxTag, transaction, accountOrGroup)}`

    let taxTransaction = new Transaction(book)
      .addRemoteId(id)
      .setDate(transaction.date)
      .setAmount(amount)
      .setDescription(tax_description)
      .setProperty(EXC_CODE_PROP, transaction.properties[EXC_CODE_PROP])
      .setProperty(EXC_DATE_PROP, transaction.properties[EXC_DATE_PROP])
      ;

    let txExcRate = transaction.properties[EXC_RATE_PROP];
    let txExcAmount = transaction.properties[EXC_AMOUNT_PROP];

    if (txExcRate) {
      taxTransaction.setProperty(EXC_RATE_PROP, txExcRate)
    } if (txExcAmount) {
      const amount = book.parseValue(txExcAmount);
      const rate = amount.div(transaction.amount)
      taxTransaction.setProperty(EXC_RATE_PROP, rate.toString())
    }

    //Fallback
    if (txExcAmount) {
      const amount = book.parseValue(txExcAmount);
      if (amount.round(8).eq(0)) {
        // Avoid mirror exchange transaction
        taxTransaction.setProperty(EXC_AMOUNT_PROP, '0')
        taxTransaction.deleteProperty(EXC_RATE_PROP)
      }
    }

    for (const [key, value] of Object.entries(transaction.properties)) {
      if (key != EXC_RATE_PROP && key != EXC_AMOUNT_PROP && key != EXC_CODE_PROP && key != EXC_DATE_PROP && key != TAX_ROUND_PROP && key != TAX_INCLUDED_AMOUNT_PROP && key != TAX_EXCLUDED_AMOUNT_PROP) {
        taxTransaction.setProperty(key, value)
      }
    }

    return taxTransaction;
  }

}