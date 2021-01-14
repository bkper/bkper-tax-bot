import { Account, Book, Group, Transaction } from "bkper";
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
    let netAmount = +transaction.amount;

    let taxAmount = transaction.properties['tax_amount'] ? book.parseValue(transaction.properties['tax_amount']) : null;

    //Ensure tax amount positive
    if (taxAmount && taxAmount < 0) {
      taxAmount *= -1;
    }

    let fullIncludedTax = await this.getFullTaxRate_(book, creditAccount, debitAccount, true);

    if (fullIncludedTax == 0 && fullNonIncludedTax == 0 && (taxAmount == null || taxAmount == 0)) {
      return false;
    }

    if (fullIncludedTax >= 100) {
      return `Cannot process more than 100% in total taxes. Sum of all taxes: ${fullIncludedTax}`;
    }

    if (fullIncludedTax > 0 && taxAmount == null) {
      netAmount = +transaction.amount - ((+transaction.amount * fullIncludedTax) / (100 + fullIncludedTax));
    } else if (taxAmount != null) {
      netAmount = +transaction.amount - taxAmount;
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


  private async getFullTaxRate_(book: Book, creditAccount: Account, debitAccount: Account, included: boolean): Promise<number> {
    let totalTax = 0;
    totalTax += await this.getFullTaxRateFromAccount_(book, creditAccount, included);
    totalTax += await this.getFullTaxRateFromAccount_(book, debitAccount, included);
    return totalTax;
  }

  private async getFullTaxRateFromAccount_(book: Book, account: Account, included: boolean): Promise<number> {
    let totalTax = this.getTaxRateFromAccountOrGroup_(book, account, included);
    let groups = await account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        totalTax += this.getTaxRateFromAccountOrGroup_(book, group, included);
      }
    }
    return totalTax;
  }

  private getTaxRateFromAccountOrGroup_(book: Book, accountOrGroup: Account | Group, included: boolean): number {
    let taxTag = accountOrGroup.getProperty('tax_rate');
    if (taxTag == null || taxTag.trim() == '') {
      return 0;
    }
    const tax = book.parseValue(taxTag);
    if (included && tax < 0) {
      return 0;
    }

    if (!included && tax > 0) {
      return 0;
    }

    return tax;
  }

  private async getTaxTransactions(book: Book, account: Account, transaction: bkper.Transaction, netAmount: number, taxAmount: number): Promise<Transaction[]> {

    let transactions: Transaction[] = [];

    let accountTransaction = this.createTaxTransaction(book, account, account.getName(), transaction, netAmount, taxAmount);
    if (accountTransaction != null) {
      transactions.push(accountTransaction)
    }

    let groups = await account.getGroups();
    if (groups != null) {
      for (var group of groups) {
        let groupTransaction = this.createTaxTransaction(book, group, account.getName(), transaction, netAmount, taxAmount);
        if (groupTransaction != null) {
          transactions.push(groupTransaction);
        }
      }
    }

    return transactions;
  }


  private createTaxTransaction(book: Book, accountOrGroup: Account | Group, accountName: string, transaction: bkper.Transaction, netAmount: number, taxAmount: number): Transaction {

    let taxTag = accountOrGroup.getProperty('tax_rate');

    if (taxTag == null || taxTag.trim() == '') {
      return null;
    }

    let tax = book.parseValue(taxTag);

    if (tax == 0 && (taxAmount == null || taxAmount == 0)) {
      return null;
    }

    // Fixed tax_amount overrides included tax
    let amount: number | string = taxAmount && taxAmount > 0 && tax > 0 ? taxAmount : netAmount * (tax / 100);
    
    if (amount < 0) {
      amount *= -1;
    }

    let tax_description = accountOrGroup.getProperty('tax_description');

    if (tax_description == null) {
      tax_description = '';
    }

    let tax_round = +transaction.properties['tax_round'];
    if (tax_round != null && !isNaN(tax_round) && tax_round <= 8) {
      amount = amount.toFixed(tax_round);
    }

    tax_description = tax_description.replace('${transaction.description}', transaction.description);
    tax_description = tax_description.replace('${account.name}', accountName);

    let id = `${super.getId(transaction, accountOrGroup)}`

    let taxTransaction = book.newTransaction()
                          .addRemoteId(id)
                          .setDate(transaction.date)
                          .setAmount(amount)
                          .setDescription(tax_description);

    return taxTransaction;
  }

}