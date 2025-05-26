# SillyTavern - Mathcros
This is a simple extension that adds a macro that allows you to perform additions and subtractions between variables and numbers without modifying the variables.
## Features
> ***var_name*** is replaced by the name of a global or local ST variable, you can put one or several names, as long as they are separated by a blank space. Variables can be arrays, strings of numbers, and numbers, both positive or negative (arrays within arrays will be ignored). `var_name0 var_name1`

> You can negate the final value of a variable inserting a hyphen at the beginning of the variable name. `var_name` is equal to `10`, but if you type `-var_name`, it will be negated to `-10` during the macro calculation **(it won't modify the original variable)**. This allows `{{sumvar::2 -var_name}}` or `{{mulvar::2 -var_name}}`

> ***number*** can be any positive or negative number, even with a dot **(commas not supported)**. `-1 0 1 2.5`

**SUM** ```{{sumvar::var_name0 number}} | {{sumvar::var_name0}}```
- It will sum all numbers and numeric variables declared inside the curly braces.
- Non-numeric values will be replaced by zero.

**MUL** ```{{mulvar::var_name0 number}} | {{mulvar::var_name0}}```
- It will calculate the product of multiplying all numbers and numeric variables declared inside the curly braces.
- Non-numeric values will be replaced by one.

**MOD** ```{{modvar::var_name0 number}} | {{modvar::var_name0}}```
- From left to right, it will apply the mod operation to all numbers and numeric variables declared inside the curly braces.
- Non-numeric values and zero will be ignored.

<image width="100%" src="https://github.com/user-attachments/assets/25db70d8-71a9-40bc-b047-5d8d37c6812f"/>

### Coming Soon
- Division
> I don't have a date to add those features, I just made the extension because I needed the addition and subtraction.
## Installation
Install the extension using this link: ```https://github.com/leandrojofre/SillyTavern-Mathcros.git```
### Usage
This extension is intended to be used on any text box that ends inside the prompt. In TC, the macro will only be replaced after ST combines the prompt, event_type: `GENERATE_AFTER_COMBINE_PROMPTS`, or before ST sends the raw prompt to the CC backend, event_type: `GENERATE_AFTER_DATA`.
### Compatibility
Tested: The extension supports lorebooks, databanks, character cards and writing in chat (not replaced visually, only in the prompt).
## Support and Contributions
- Thanks to city-unit for the [extension template](https://github.com/city-unit/st-extension-example/).
- Thanks to lenanderson, I had to watch [Len's extensions](https://lenanderson.github.io/SillyTavern/) in order to figure out how to handle some things in mine.
