
**Taxes** are calculated based on the transaction amount and some properties set in the account or group, specifying the rates to apply. Here is a quick intro video:


They can be **included** in overall transaction amount, such as VAT, or **excluded** such as income taxes. Here is [an article that better explain it](https://octobat.zendesk.com/hc/en-150/articles/360009913159-What-is-the-difference-between-tax-included-vs-tax-excluded-).

Once the taxes calculated, the Tax Bot will record one or more transactions with the entry for the taxes.

<p align="center">
  <img src='https://bkper.com/images/bots/bkper-tax-bot/bkper-tax-bot.gif' alt='Bkper Tax Bot in action'/>
</p>


### Included tax on sale example
![Tax on sale example](https://docs.google.com/drawings/d/e/2PACX-1vSwYOxDA3k5U5I_jVsa2qzJOCXDiUWTLet_TY2VMFetrkGOwjKKNCZb6ygfSLz1V-bWrsDixVvSRRvX/pub?w=936&h=488)


### Included tax on purchase example
![Tax on sale example](https://docs.google.com/drawings/d/e/2PACX-1vSQ5qwre1ivZZulAcKPRARYgpDiOyRdJ52LdaImkVPsCiYZOZGqqkUg-k4YgLhR4GHsOjwv7D5eLDQo/pub?w=936&h=488)
    

The examples use simplified cash basis for easy understanding. You can also set more complex tax flows involving accounts [payable](https://help.bkper.com/en/articles/2569171-accounts-payable) and [receivable](https://help.bkper.com/en/articles/2569170-accounts-receivable) instead of the direct Bank Account.


#### Learn more about sales taxes and bots on Bkper:

[Tax Bot quick intro video](https://www.youtube-nocookie.com/embed/HLtw8ODVPwU)

[Bkper Bots Installation](https://help.bkper.com/en/articles/3873607-bkper-bots-installation)    

[Sales taxes on Bkper](https://help.bkper.com/en/articles/2569187-sales-taxes-vat)  

[Tax Bot help](https://help.bkper.com/en/articles/4127778-tax-bot)    

<!-- ## Sponsors ❤

[<img src='https://storage.googleapis.com/bkper-public/logos/ppv-logo.png' height='50'>](http://ppv.com.uy/)
&nbsp;
[<img src='https://storage.googleapis.com/bkper-public/logos/brain-logo.webp' height='50'>](https://www.brain.uy/) -->

## Configuration

The Tax Bot is triggered on the ```TRANSACTION_POSTED``` event. Once triggered it will check [group and account properties](https://help.bkper.com/en/articles/3666485-custom-properties-on-books-and-accounts) if it has the ```tax_included_rate``` or ```tax_excluded_rate``` properties. When it finds these properties it will read the corresponding values from your book and apply the Tax Bot's logic. In this case it will calculate the tax and record another transaction with the available data.      

[Learn more...](https://help.bkper.com/en/articles/4127778-bkper-tax-bot).


### Accounts and/or Group properties

Set the following account properties on accounts (or group) that should trigger the Tax Bot.    

- ```tax_excluded_rate```: The tax rate to apply, calculating the tax based on the transaction amount.
- ```tax_included_rate```: The tax rate to apply, extracting the tax already included in the transaction amount.
- ```tax_description```: The description of the generated transaction


Generating addional 7% of income tax:
```yaml
tax_excluded_rate: 7
tax_description: #incometax
```

Extracting 12.85% of VAT, already included in the transaction:
```yaml
tax_included_rate: 12.85
tax_description: #vatin
```

#### Expressions

Expressions are like variables that allow you to dynamically use values from the posting event that triggered the Tax Bot, consisting of the **account name** and the **transaction description**. This allows you to complete accounts on the newly recorded transaction by the bot and to have a significant description that links to the original transaction. 

You can add these expressions to the **tax_description** property of the account that has to trigger the tax bot to dynamically generate the new transaction.

- ```${account.name}```: The account name of the account that triggered the Tax Bot.
- ```${account.name.origin}```: The account name when participates as origin in the transaction. Empty otherwise.
- ```${account.name.destinaton}```: The account name when participates as destination in the transaction. Empty otherwise.
- ```${account.contra.name}```: The contra account name of the account that triggered the Tax Bot.
- ```${account.contra.name.origin}```: The contra account name when participates as origin in the transaction. Empty otherwise.
- ```${account.contra.name.destinaton}```: The contra account name when participates as destination in the transaction. Empty otherwise.
- ```${transaction.description}```: The same description that comes from the posted transaction that triggered the Tax Bot. 

Example of the account property using these expressions:
``` yaml
tax_description: ${account.name} Input Tax #vatin ${transaction.description}
```


### Transaction properties

- ```tax_round```: The number of decimal digits to round the taxes. This should be lower than the books decimal digits settings.
- ```tax_included_amount```: The fixed tax amount to override the included taxes calculated based on Group or Account ```tax_included_rate``` definition
- ```tax_excluded_amount```: The fixed tax amount to override the excluded taxes calculated based on Group or Account ```tax_excluded_rate``` definition

Example:
```yaml
tax_round: 1
```

### Book property

- ```tax_copy_properties```: The properties the Tax Bot should copy from the source to the generated tax transaction, splitted by space.



See the [Tax Bot help article](https://help.bkper.com/en/articles/4127778-tax-bot) for a working example.
See the [Sales Taxes article](https://help.bkper.com/en/articles/2569187-sales-taxes-vat) to learn more about included and not included taxes. 
