
The Bkper Tax Bot is triggered upon the transaction posting event when either one of the accounts on the transaction has the property "tax_rate" set. It can also be triggered when one of the accounts is in a group with this property.  **Taxes** are calculated based on the transaction amount and the tax_rate property from the account (or group). With the data off the transaction and the tax_rate, the Tax Bot will record a new transaction with the entry for the taxes.  

<p align="center">
  <img src='https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot.gif' alt='Bkper Tax Bot in action'/>
</p>


### Tax on sale example
![Tax on sale example](https://docs.google.com/drawings/d/e/2PACX-1vSwYOxDA3k5U5I_jVsa2qzJOCXDiUWTLet_TY2VMFetrkGOwjKKNCZb6ygfSLz1V-bWrsDixVvSRRvX/pub?w=936&h=488)


### Tax on purchase example
![Tax on sale example](https://docs.google.com/drawings/d/e/2PACX-1vSQ5qwre1ivZZulAcKPRARYgpDiOyRdJ52LdaImkVPsCiYZOZGqqkUg-k4YgLhR4GHsOjwv7D5eLDQo/pub?w=936&h=488)
    

The examples use simplified cash basis for easy understanding. You can also set more complex tax flows involving accounts [payable](https://help.bkper.com/en/articles/2569171-accounts-payable) and [receivable](https://help.bkper.com/en/articles/2569170-accounts-receivable) instead of the direct Bank Account.


Learn more about sales taxes and bots on Bkper:

[Bkper Bots Installation](https://help.bkper.com/en/articles/3873607-bkper-bots-installation)    

[Sales taxes on Bkper](https://help.bkper.com/en/articles/2569187-sales-taxes-vat)  

[Tax Bot help](https://help.bkper.com/en/articles/4127778-tax-bot)    

<!-- ## Sponsors ❤

[<img src='https://storage.googleapis.com/bkper-public/logos/ppv-logo.png' height='50'>](http://ppv.com.uy/)
&nbsp;
[<img src='https://storage.googleapis.com/bkper-public/logos/brain-logo.webp' height='50'>](https://www.brain.uy/) -->

## Configuration

The Tax Bot is triggered on the **posting transaction event**. Once triggered it will check both accounts' their properties whether it has the **tax_rate** property and eventually the **tax_Description** property. When it finds these properties it will read the corresponding values from your book and apply the Tax Bot's logic. In this case it will calculate the tax and record another transaction with the available data.      
The Tax Bot uses the [book and account properties](https://help.bkper.com/en/articles/3666485-custom-properties-on-books-and-accounts) 
[Learn more...](https://help.bkper.com/en/articles/4127778-bkper-tax-bot).

### Accounts and/or Group properties

Set the following account properties on accounts (or group) that should trigger the Tax Bot.    

- ```tax_excluded```: The tax rate to apply, calculating the tax based on the transaction amount.
- ```tax_included```: The tax rate to apply, extracting the tax already included in the transaction amount.
- ```tax_description```: The description of the generated transaction


Generating addional 7% of income tax:
```yaml
tax_excluded: 7
tax_description: #incometax
```

Extracting 12.85% of VAT, already included in the transaction:
```yaml
tax_included: 12.85
tax_description: #vatin
```

#### Expressions

Expressions are like variables that allow you to dynamically use values from the posting event that triggered the Tax Bot, consisting of the **account name** and the **transaction description**. This allows you to complete accounts on the newly recorded transaction by the bot and to have a significant description that links to the original transaction. 

You can add these two expressions to the **tax_description** property of the account that has to trigger the tax bot to dynamically generate the new transaction.

- ```${account.name}```  
- ```${transaction.description}```

Example of the account property using these expressions:
``` yaml
tax_description: ${account.name} Input Tax #vatin ${transaction.description}
```
Where:
- ```${account.name}```  Is the account name of the account that triggered the Tax Bot.
- ```Input Tax``` Is the "constant" account name to complete the newly recorded tax transactions.  
- ```#vatin``` Is a sample of hashtag use.
- ```${transaction.description}``` Is the same description that comes from the posted transaction that triggered the tax bot.  


### Transaction properties

- ```tax_round```: The number of decimal digits to round the generated taxes. This should be lower than the books decimal digit.
- ```tax_amount```: The fixed tax amount to override the included taxes calculated based on Group or Account ```tax_rate``` definition

Example:
```yaml
tax_round: 1
```

See the [Tax Bot help article](https://help.bkper.com/en/articles/4127778-tax-bot) for a working example.
See the [Sales Taxes article](https://help.bkper.com/en/articles/2569187-sales-taxes-vat)to learn more about included and not included taxes. 
