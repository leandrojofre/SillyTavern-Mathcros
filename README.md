# SillyTavern - Mathcros
This is a simple extension that adds macros that allow you to perform simple mathematical operations with variables, addition, subtraction, multiplication and division.

## Features

- ```{{sumvar::var_name0::number}} | {{sumvar::var_name0}}``` *var_nam* is replaced by the name of the variable to which you want to add a number, you can put one or several names, as long as they are separated by a blank space. Variables can be arrays, strings of numbers, and numbers (arrays within arrays will be ignored). ```var_name0 var_name1``` *number* can be any positive or negative number, even with a dot ```-1 0 1 2.5``` It must be a single number. The number is optional, you can just add variables without any problems.

<image width="100%" src="https://github.com/user-attachments/assets/94f804b9-52b0-42aa-a5a4-b45a4c2e2dee"/>

## Installation

Install the extension using this link: ```https://github.com/leandrojofre/SillyTavern-Mathcros.git```

### Usage

This extension is intended to be used on any text box that ends inside the prompt. The macro will only be replaced after ST combines the prompt, event_type: ```GENERATE_AFTER_COMBINE_PROMPTS```

## Support and Contributions

Thanks to city-unit for the [extension template](https://github.com/city-unit/st-extension-example/).
