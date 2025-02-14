# SillyTavern - Mathcros
This is a simple extension that adds a macro that allows you to perform additions and subtractions between variables and numbers without modifying the variables.
## Features
- ```{{sumvar::var_name0::number}} | {{sumvar::var_name0}}``` ***var_name*** is replaced by the name of the variable to which you want to add a number, you can put one or several names, as long as they are separated by a blank space. Variables can be arrays, strings of numbers, and numbers, both positive or negative (arrays within arrays will be ignored). ```var_name0 var_name1``` ***number*** can be any positive or negative number, even with a dot. It must be a single number. The number is optional, you can just add variables without any problems. ```-1 0 1 2.5``` Non-numeric values will be replaced by zero.
<image width="100%" src="https://github.com/user-attachments/assets/94f804b9-52b0-42aa-a5a4-b45a4c2e2dee"/>

### Coming Soon
- Multiplications
- Divisions
- Maybe modules
> I don't have a date to add those features, I just made the extension because I needed the addition and subtraction.
## Installation
Install the extension using this link: ```https://github.com/leandrojofre/SillyTavern-Mathcros.git```
### Usage
This extension is intended to be used on any text box that ends inside the prompt. The macro will only be replaced after ST combines the prompt, event_type: ```GENERATE_AFTER_COMBINE_PROMPTS```
### Compatibility
Tested: The extension supports lorebooks, databanks, character cards and writing in chat (not replaced visually, only in the prompt).
## Support and Contributions
Thanks to city-unit for the [extension template](https://github.com/city-unit/st-extension-example/).
