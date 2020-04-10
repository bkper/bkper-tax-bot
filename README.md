
The Bkper Sales Tax Bot is triggered upon transaction posting and calculate **taxes** based on its amount, such as **VAT**, **GST** and the like, recording a new transaction with that information. 

<p align="center">
  <img src='https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot.gif' alt='Bkper Sales Tax Bot in action'/>
</p>


### Tax on sale example
![Tax on sale example](https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot-sale-example.png)


### Tax on purchase example
![Tax on sale example](https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot-purchase-example.png)
    

The examples use simplified cash basis for easy understanding. You can also set more complex tax flows involving accounts [payable](https://help.bkper.com/en/articles/2569171-accounts-payable) and [receivable](https://help.bkper.com/en/articles/2569170-accounts-receivable) instead of the direct Bank Account.


Learn more about sales taxes and bots on Bkper:

[Sales taxes on Bkper](https://help.bkper.com/en/articles/2569187-sales-taxes-vat)    

[Bkper Bots Installation](https://help.bkper.com/en/articles/3873607-bkper-bots-installation)    


## Configuration

### Configuring tax rate

Add the **tax_rate** [property](https://help.bkper.com/en/articles/3666485-custom-properties-on-books-and-accounts) to the accounts you want to generate the tax:

```yml
tax_rate: 12.85
```
> The accounts are usually of **Incoming** or **Outgoing** types.

### Configuring tax description

Optionally, add **tax_description** property to the account, so, the description will be appended to the new transaction, leveraging the [Bookbot](https://help.bkper.com/en/articles/2569152-bkper-bookbot) discovery process:

```yml
tax_description: #vatin
```

#### Expressions

Expressions allow to dynamically insert values from the current **account** and the **transaction** being posted.

The following expressions can be used in the **tax_description**:

- ```${account.name}```
- ```${transaction.description}```

Example:
```yml
tax_description: ${account.name} Input Tax #vatin ${transaction.description}
```


### Working example 

You manufacture **Product A** from the **Materials A** and **Materials B**. On Product sales register 7.25% Sales Tax and on the Materials purchases you register respectivelly 7.25% and 8.5%.  

#### Tax on sales 

Create an **Output tax** (liability) account.

Create a **Product A** (incoming) account.  

Set the **tax_rate** property to the Product A account.
Set the **tax_description** to the Product A account. 

![Tax rate on sales working example](https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot-incoming.png)



#### Tax on purchases

Create an **Input tax** (asset) account.

Create a **Materials A** and a **Materials B** account (outgoing).

Set the **tax_rate** property to both Materials accounts.
Set the **tax_description** to both Materials accounts.

![Tax rate on purchase working example](https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot-outgoing.png)




Record purchase and sales entries with the taxes included so the Bkper Sales Tax Bot can calculate and record it on the respective asset or liability account. 
![Tax transactions working example](https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot-transactions.png)


> Notice the transactions recorded by the Bkper Sales Tax Bot on the right. 

           
Closing the Sales Tax period: Balance Tax in with Tax out to calculate the due (or receivable) amount.
![Tax transactions working example](https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot-closing-period.png)

