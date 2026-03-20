import {MacroValueType} from "../../../macros/macro-system.js";
import {math} from "./public/bundle.min.js";

// * MARK:Extension variables

const context = () => SillyTavern.getContext();

const {
    macros,
    variables,
    extensionSettings: extension_settings,
    eventTypes: event_types,
    eventSource,
    saveSettingsDebounced,
    t
} = context();

const {
    local: localVaraibles,
    global: globalVariables
} = variables;

const {
    get: getLocalVariable
} = localVaraibles;

const {
    get: getGlobalVariable
} = globalVariables;

const extensionName = "SillyTavern-Mathcros";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
    enabled: true,
    experimentalEngine: false,
    debug: false
};

const regexSum = /{{sumvar::((-?\w+)|(-?\d+(\.\d+)?))( ((-?\w+)|(-?\d+(\.\d+)?)))*}}/g;
const regexMul = /{{mulvar::((-?\w+)|(-?\d+(\.\d+)?))( ((-?\w+)|(-?\d+(\.\d+)?)))*}}/g;
const regexMod = /{{modvar::((-?\w+)|(-?\d+(\.\d+)?))( ((-?\w+)|(-?\d+(\.\d+)?)))*}}/g;

// * MARK:Debugs methods

const log = (...msg) => {
    if (!extensionSettings.enabled || !extensionSettings.debug) return;
    console.log(`[${extensionName}-LOG]`, ...msg);
};

const error = (...msg) => {
    if (!extensionSettings.enabled || !extensionSettings.debug) return;
    console.error(`[${extensionName}-ERROR]`, ...msg);
};

// * MARK:Extension methods

/**
    @param {String} prompt - Raw prompt string
    @param {Array} matches - All the raw mathcros matches
    @param {Array} results - Results of doing the macro math
    @returns {String} Prompt with mathcros replaced
*/
function replacePrompt(prompt, matches, results) {
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const result = results[i];
        prompt = prompt.replace(match, String(result));
    }

    return prompt;
}

/**
    @param {String} prompt - Raw prompt after it is combined
    @returns {String} The same prompt but with the mathcros replaced
*/
function sumVar(prompt) {
    if (!extensionSettings.enabled) return prompt;

    const matches = prompt.match(regexSum);
    const results = [];

    for (const match of matches) {
        const values = match
        .replace(/{{|}}|sumvar::/g, "");

        const result = values
        .split(/ /g)
        .map((val) => {
            const isValNaN = isNaN(Number(val));
            if (!isValNaN) return Number(val);

            const negative = val[0].includes("-") ? -1 : 1;

            if (negative === -1) val = val.slice(1);

            const variable = String(getLocalVariable(val) === '' ? getGlobalVariable(val) : getLocalVariable(val));
            const isVarNaN = isNaN(Number(variable));
            const isVarEmpty = variable.trim() === "";

            if (isVarEmpty) return 0;

            try {
                const parsedValue = JSON.parse(variable);
                if (Array.isArray(parsedValue)) {
                    const finalValue = parsedValue
                        .filter((value) => !isNaN(Number(value)))
                        .reduce((acu, value) => acu + Number(value), 0);
                    return finalValue * negative;
                }
            } catch {
                // Nothing to do...
            }

            if (isVarNaN) return 0;
            return Number(variable) * negative;
        })
        .reduce((acu, val) => acu + val, 0);

        results.push(result);
        log(`sumVar -- ${match} = `, result);
    }

    return replacePrompt(prompt, matches, results);
}

/**
    @param {String} prompt - Raw prompt after it is combined
    @returns {String} The same prompt but with the mathcros replaced
*/
function mulVar(prompt) {
    if (!extensionSettings.enabled) return prompt;

    const matches = prompt.match(regexMul);
    const results = [];

    for (const match of matches) {
        const values = match
        .replace(/{{|}}|mulvar::/g, "");

        const result = values
        .split(/ /g)
        .map((val) => {
            const isValNaN = isNaN(Number(val));
            if (!isValNaN) return Number(val);

            const negative = val[0].includes("-") ? -1 : 1;

            if (negative === -1) val = val.slice(1);

            const variable = String(getLocalVariable(val) === '' ? getGlobalVariable(val) : getLocalVariable(val));
            const isVarNaN = isNaN(Number(variable));
            const isVarEmpty = variable.trim() === "";

            if (isVarEmpty) return 1;

            try {
                const parsedValue = JSON.parse(variable);
                if (Array.isArray(parsedValue)) {
                    const finalValue = parsedValue
                        .filter((value) => !isNaN(Number(value)))
                        .reduce((acu, value) => acu * Number(value), 1);
                    return finalValue * negative;
                }
            } catch {
                // Nothing to do...
            }

            if (isVarNaN) return 1;
            return Number(variable) * negative;
        })
        .reduce((acu, val) => acu * val, 1);

        results.push(result);
        log(`mulVar -- ${match} = `, result);
    }

    return replacePrompt(prompt, matches, results);
}

/**
    @param {String} prompt - Raw prompt after it is combined
    @returns {String} The same prompt but with the mathcros replaced
*/
function modVar(prompt) {
    if (!extensionSettings.enabled) return prompt;

    const matches = prompt.match(regexMod);
    const results = [];

    for (const match of matches) {
        const values = match
        .replace(/{{|}}|modvar::/g, "");

        const preResult = values
        .split(/ /g)
        .map((val) => {
            const isValNaN = isNaN(Number(val));

            if (!isValNaN) return Number(val) === 0 ? "skip" : Number(val);

            const negative = val[0].includes("-") ? -1 : 1;

            if (negative === -1) val = val.slice(1);

            const variable = String(getLocalVariable(val) === '' ? getGlobalVariable(val) : getLocalVariable(val));
            const isVarNaN = isNaN(Number(variable));
            const isVarEmpty = variable.trim() === "";

            if (isVarEmpty) return "skip";

            try {
                const parsedValue = JSON.parse(variable);
                if (Array.isArray(parsedValue)) {
                    const filteredArray = parsedValue
                        .filter((value) => !isNaN(Number(value)) && Number(value) !== 0);
                    const finalValue = filteredArray
                        .slice(1)
                        .reduce((acu, value) => acu % Number(value), filteredArray[0]);
                    return finalValue * negative;
                }
            } catch {
                // Nothing to do...
            }

            if (isVarNaN) return "skip";
            if (Number(variable) === 0) return "skip";
            return Number(variable) * negative;
        })
        .filter((value) => value !== "skip");

        const result = preResult
        .slice(1)
        .reduce((acu, val) => acu % val, preResult[0]);

        results.push(result ?? "MODVAR EMPTY");
        log(`modVar -- ${match} = `, result);
    }

    return replacePrompt(prompt, matches, results);
}

/** Trigger each macro present in the prompt.
    @param {String} prompt - Raw prompt
*/
function runMacros(prompt) {
    let match;

    while (match = [
        ...prompt.match(regexSum) ?? [],
        ...prompt.match(regexMul) ?? [],
        ...prompt.match(regexMod) ?? []
    ], match?.length) {
        if (match[0].includes("sumvar")) prompt = sumVar(prompt);
        if (match[0].includes("mulvar")) prompt = mulVar(prompt);
        if (match[0].includes("modvar")) prompt = modVar(prompt);
    }

    return prompt;
}

/** Made for the prompt generated by ST when models don't handle the prompt by themselves - mostly TC. Tested compatibility:
    - InfermaticAI (TC)
    - Openrouter (TC)
    - AI Horde
*/
eventSource.on(event_types.GENERATE_AFTER_COMBINE_PROMPTS, (arg) => {
    if (!extensionSettings.enabled) return;

    log(event_types.GENERATE_AFTER_COMBINE_PROMPTS, arg);

    arg.prompt = runMacros(arg.prompt);
});

/** Made for OAI based models or models that handle their own prompt - mostly CC. Tested compatibility:
    - Google AI Studio
    - Openrouter (CC)
*/
eventSource.on(event_types.GENERATE_AFTER_DATA, (arg) => {
    if (!extensionSettings.enabled) return;

    log(event_types.GENERATE_AFTER_DATA, arg);

    if (Array.isArray(arg.prompt)) {
        for (const item of arg.prompt)
            item.content = runMacros(item.content);
    } else
        arg.prompt = runMacros(arg.prompt);
});

// * MARK:New Macro Engine

const regexVarName = /[a-zA-Z][\w]*[\w]/g;
const excludedNames = [
    'INVALID',
    'and',
    'or'
];

/**
 * @returns {null|number}
 */
function chooseNeutral(parent, child) {
    if (!parent) return null;
    const type = parent.type;

    if (type === 'OperatorNode') {
        const op = parent.op;
        const args = parent.args || [];

        if (op === '+' || op === '-') return 0;
        if (op === '*') return 1;

        if (op === '/') {
            if (args[1] === child) return 1;
            return null;
        }

        if (op === '^') {
            if (args[1] === child) return 1;
            return null;
        }
    }

    return null;
}

/**
 * @param {string} expr
 * @param {Object} scope
 * @returns {Object & {ok: boolean, value: number|Array}}
 */
function safeEvaluate(expr, scope = {}) {
    const node = math.parse(expr);
    const problems = [];

    function tryNeutral(parent, n, path, reason) {
        const neutral = chooseNeutral(parent, n);

        if (neutral !== null) return math.parse(String(neutral));

        problems.push({ node: n, reason, parentType: parent ? parent.type : null, path });
        return null;
    }

    const transformed = node.transform(function (n, path, parent) {
        if (n.isSymbolNode && n.name === 'INVALID') {
            const replaced = tryNeutral(parent, n, path, 'explicit INVALID');
            return replaced ?? n;
        }

        if (n.isSymbolNode) {
            const name = n.name;
            const replaced = tryNeutral(parent, n, path, `missing_or_invalid_symbol:${name}`);
            return replaced ?? n;
        }

        if (n.isConstantNode) {
            const val = n.value;

            if (typeof val === 'number' && !isNaN(val)) return n;

            if (typeof val === 'string') {
                const t = val.trim();

                if (t !== '' && !isNaN(Number(t))) return math.parse(String(Number(t)));

                const replaced = tryNeutral(parent, n, path, 'string_not_numeric');
                return replaced ?? n;
            }

            const isBoolOrNull = typeof val === 'boolean' || val === null;
            const replaced = tryNeutral(parent, n, path, isBoolOrNull ? 'boolean_or_null' : 'unsupported_constant');
            return replaced ?? n;
        }

        if (n.isArrayNode || n.isObjectNode) {
            const replaced = tryNeutral(parent, n, path, n.isArrayNode ? 'array_literal' : 'object_literal');
            return replaced ?? n;
        }

        return n;
    });

    if (problems.length) return { ok: false, problems };

    const compiled = transformed.compile();
    const value = compiled.evaluate(scope);
    return { ok: true, value };
}

function loadExtensionMacros() {
    if (!extensionSettings.experimentalEngine) return;

    macros.register('math', {
        description: 'Resolve mathematical operations using numbers and/or variables without modifying the value of the variable or using scripts.',
        category: macros.category.UTILITY,
        returnType: MacroValueType.NUMBER,
        unnamedArgs: [{
            name: 'operation',
            description: 'The mathematical operation to resolve',
            type: MacroValueType.STRING,
            optional: false
        }, {
            name: 'precision',
            description: 'Limits the max amount of decimal digits to show',
            type: MacroValueType.INTEGER,
            optional: true,
            defaultValue: '0'
        }],
        handler: (macroContext) => {
            const precision = Math.round(Number(macroContext.args[1] ?? 0));
            const operationRaw = macroContext.args[0];
            const operation = operationRaw
                .replaceAll(regexVarName, function (substring) {
                    if (excludedNames.includes(substring)) return substring;

                    const localVar = getLocalVariable(substring);
                    const variable = String(localVar === '' ? getGlobalVariable(substring) : localVar);
                    const isVarNaN = isNaN(Number(variable));
                    const isVarEmpty = variable.trim() === '';

                    if (isVarEmpty) return 'INVALID';

                    try {
                        const parsedValue = JSON.parse(variable);
                        if (Array.isArray(parsedValue)) return 'INVALID';
                    } catch {
                        // Nothing to do, isVarNaN will nuke it...
                    }

                    if (isVarNaN) return 'INVALID';

                    return variable;
                })
                .replaceAll(/\s/g, '');

            const mathEvaluation = safeEvaluate(operation);

            if (!mathEvaluation.ok) {
                toastr.error('Mathcros: One of your math operations is using wrong syntax or a variable containing an invalid value');
                log(operationRaw, operation);
                error(mathEvaluation);
                return operationRaw;
            }

            log(operationRaw, operation, mathEvaluation.value);

            if (precision < 1) return Math.round(mathEvaluation.value);

            return math
                .format(mathEvaluation.value, { notation: 'fixed', precision: precision })
                .replace(/\.?0+$/,'');
        },
    });
}

// * MARK:Settings Controls

const settingsCallbacks = {
    /**	Enables/Disables the extension */
    enabled: () => {
        // Nothing by the moment
    },

    experimentalEngine: () => {
        const isMathRegistered = macros.registry.hasMacro('math');

        if (extensionSettings.experimentalEngine && !isMathRegistered)
            return toastr.warning(t`Refresh the tab to use the new engine`);

        if (!extensionSettings.experimentalEngine && isMathRegistered)
            return toastr.warning(t`Refresh the tab to stop using the new engine`);
    }
}

/** Changes a setting value and triggers a callback if there's any on settingsCallbacks. */
function settingsBooleanButton(event) {
    const target = event.target;
    const value = Boolean($(target).prop("checked"));
    const setting = target.getAttribute("mathcros-setting");
    const callback = settingsCallbacks[setting];

    extensionSettings[setting] = value;

    if (callback) callback();

    log("toggleSetting " + setting, value);
    saveSettingsDebounced();
}

/**	Logs setting's values. */
function displaySettings() {
    console.debug("[" + extensionName + "]", `The extension is ${extensionSettings.enabled ? "active" : "not active"}`);
    console.debug("[" + extensionName + "]", `Experimental engine mode is ${extensionSettings.experimentalEngine ? "active" : "not active"}`);
    console.debug("[" + extensionName + "]", `Debug mode is ${extensionSettings.debug ? "active" : "not active"}`);
    console.debug("[" + extensionName + "]", structuredClone(extensionSettings));
}

/** Append settings menu on ST and set listeners. */
async function loadHTMLSettings() {
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

    $("#extensions_settings").append(settingsHtml);

    // Event Listeners for the extension HTML
    $("#mathcros-activate-extension").on("input", settingsBooleanButton);
    $("#mathcros-experimetal-engine").on("input", settingsBooleanButton);
    $("#mathcros-activate-debug").on("input", settingsBooleanButton);
    
    $("#mathcros-check-configuration").on("click", displaySettings);
    log("loadHTMLSettings");
}

/** Init setting values on the menu */
function setSettings() {
    $("#mathcros-activate-extension").prop("checked", extensionSettings.enabled).trigger("input");
    $("#mathcros-experimetal-engine").prop("checked", extensionSettings.experimentalEngine).trigger("input");
    $("#mathcros-activate-debug").prop("checked", extensionSettings.debug).trigger("input");

    log("setSettings", extensionSettings);
}

// * Initialize Extension

$(async function () {

    if (!context().extensionSettings[extensionName]) {
        context().extensionSettings[extensionName] = structuredClone(defaultSettings);
    }

    for (const key of Object.keys(defaultSettings)) {
        if (context().extensionSettings[extensionName][key] === undefined) {
            context().extensionSettings[extensionName][key] = defaultSettings[key];
        }
    }

    await loadHTMLSettings();
    loadExtensionMacros();
    setSettings();
});
