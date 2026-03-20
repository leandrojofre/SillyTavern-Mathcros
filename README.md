# Mathcros

A simple extension that allows to do inline math operations in your prompts using SillyTavern's [macros](https://docs.sillytavern.app/usage/core-concepts/macros/).

## Macros

This extension adds the macro `{{math}}`, this macro allows to parse and resolve any mathematical operation, returning the value of the operation. The operations are be resolved using the library [math.js](https://mathjs.org/), check their [documentation](https://mathjs.org/docs/expressions/syntax.html) for a full breakdown of the syntax and capabilities.

The parameters `math` accepts are `{{math::operation::precision}}`.

`operation` can be any math operation supported by `mathjs`, examples are `5 + 10 ^ 4`, `100 / (5 + 5)`, or `yearLength - currentDay`.
- The same as the old macros, if you input a string that matches a variable name (local takes priority), it will be replaced by its value.
- If the value of a variable name is non-numeric, the extension will try to replace it with a value that will not affect the operation result. If such thing can't be done, the macro will not be processed and you'll receive a warning.
- Variable names can't contain a `-`; I know that character is supported by SillyTavern's variable names, but from the macro, there's no way of distinguishing it from a negative sign. If you want to use a varaible with that name, use `{{getvar::var-name}}` inside the macro, the new SillyTavern's macro engine supports nesting macros: `{{math::{{.year-length}} - day}}`.
- Decimal numbers must be written with a period `.`, commas `,` are not allowed.

`precision` is an _optional_ argument that limits the max amount of decimal digits to return, it is `0` by default.

Unlike the old macros, `math` can be used anywhere in SillyTavern that supports macros, that includes slash commands, inside other macros, and any textbox that transforms macros.

## Legacy macros

WARNING: These macros use pure regex to work, they have not been updated yet and do not support the new SillyTavern's macro engine features like scopes and nested macros (only supports nesting these macros, other macros won't work).

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

In TC, the macro will only be replaced after ST combines the prompt, event_type: `GENERATE_AFTER_COMBINE_PROMPTS`, or before ST sends the raw prompt to the CC backend, event_type: `GENERATE_AFTER_DATA`.

## Installation

Install the extension using this link: ```https://github.com/leandrojofre/SillyTavern-Mathcros.git```

## Compatibility

If you use SillyTavern's new macro engine, it will work on any field that accepts macros. Make sure the engine is active by toggling on `Experimental Macro Engine` from your SillyTavern's User Settings.
If you don't use SillyTavern's new macro engine, there are a few places the legacy macros work. Tested: The extension supports lorebooks, databanks, character cards and writing in chat (not replaced visually, only in the prompt).

## Support and Contributions

- Thanks to city-unit for the [extension template](https://github.com/city-unit/st-extension-example/).
- Thanks to lenanderson, I had to watch [Len's extensions](https://lenanderson.github.io/SillyTavern/) in order to figure out how to handle some things in mine.
