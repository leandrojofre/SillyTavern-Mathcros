import {extension_settings} from "../../../extensions.js";
import {saveSettingsDebounced, event_types, eventSource} from "../../../../script.js";
import {getLocalVariable, getGlobalVariable} from "../../../variables.js";

// * Extension variables

const extensionName = "SillyTavern-Mathcros";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
    enabled: true,
    debug: false
};

const context = SillyTavern.getContext();
const regexSum = /{{sumvar::((-?\w+)|(-?\d+(\.\d+)?))( ((-?\w+)|(-?\d+(\.\d+)?)))*}}/g;
const regexMul = /{{mulvar::((-?\w+)|(-?\d+(\.\d+)?))( ((-?\w+)|(-?\d+(\.\d+)?)))*}}/g;
const regexMod = /{{modvar::((-?\w+)|(-?\d+(\.\d+)?))( ((-?\w+)|(-?\d+(\.\d+)?)))*}}/g;

// * Debugs methods

const log = (...msg) => {
    if (!extensionSettings.enabled || !extensionSettings.debug) return;
    console.log("[" + extensionName + "]", ...msg);
};

// * Extension methods

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

// * Methods in charge of controlling the extension settings

const settingsCallbacks = {
    /**	Enables/Disables the extension */
    enabled: () => {
        // Nothing by the moment
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
    console.debug("[" + extensionName + "]", `Debug mode is ${extensionSettings.debug ? "active" : "not active"}`);
    console.debug("[" + extensionName + "]", structuredClone(extensionSettings));
}

/** Append settings menu on ST and set listeners. */
async function loadHTMLSettings() {
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

    $("#extensions_settings").append(settingsHtml);

    // Event Listeners for the extension HTML
    $("#mathcros-check-configuration").on("click", displaySettings);
    $("#mathcros-activate-debug").on("input", settingsBooleanButton);
    $("#mathcros-activate-extension").on("input", settingsBooleanButton);

    log("loadHTMLSettings");
}

/** Init setting values on the menu */
function setSettings() {
    $("#mathcros-activate-extension").prop("checked", extensionSettings.enabled).trigger("input");
    $("#mathcros-activate-debug").prop("checked", extensionSettings.debug).trigger("input");

    log("setSettings", extensionSettings);
}

// * Initialize Extension

(async function initExtension() {

    if (!context.extensionSettings[extensionName]) {
        context.extensionSettings[extensionName] = structuredClone(defaultSettings);
    }

    for (const key of Object.keys(defaultSettings)) {
        if (context.extensionSettings[extensionName][key] === undefined) {
            context.extensionSettings[extensionName][key] = defaultSettings[key];
        }
    }

    await loadHTMLSettings();
    setSettings();
})();
