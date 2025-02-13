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

// * Debugs methods

const log = (...msg) => {
	if (!extensionSettings.enabled || !extensionSettings.debug) return;
	console.log("[" + extensionName + "]", ...msg);
};

// * Extension methods

/**
     @param {String} prompt The full prompt string after it is combined
     @returns {String|void} The same prompt but with the mathcros replaced
*/
function sumVar(prompt) {
     if (!extensionSettings.enabled) return;

     const regex = /{{sumvar::\w+( \w+)*(::-{0,1}\d+(\.\d+)?){0,1}}}/gi;
     const matches = prompt.match(regex);
     const results = [];
     log(prompt, regex, matches)

     if (!matches || matches.length === 0)
          return log("No match found for {{sumvar}}");

     for (let i = 0; i < matches.length; i++) {
          const values = matches[i]
          .replace(/{{|}}|sumvar::/g, "")
          .split(/::/g);

          const vars = values[0]
          .split(/ /g)
          .map((val) => {
               const variable = String(getLocalVariable(val) === '' ? getGlobalVariable(val) : getLocalVariable(val));

               try {
                    const parsedValue = JSON.parse(variable);
                    if (Array.isArray(parsedValue))
                         return parsedValue
                         .filter((value) => !isNaN(Number(value)))
                         .reduce((acu, value) => acu + Number(value), 0);
               } catch {
                    // Nothing to do...
               }

               return isNaN(Number(variable)) ? 0 : Number(variable);
          })
          .reduce((acu, val) => acu + val, 0);

          const increment = Number(values[1] ?? "0");
          const result = vars + increment;
          results.push(result);
          log(`sumVar -- ${values[0]} + ${increment} = `, result);
     }
}

const macros = {
     sumvar: (prompt) => sumVar(prompt)
};


function runMacros(prompt) {
     for (const key in macros)
          prompt = macros[key](prompt);

     return prompt;
}

eventSource.on(event_types.GENERATE_AFTER_COMBINE_PROMPTS, (arg) => {
     log(event_types.GENERATE_AFTER_COMBINE_PROMPTS, arg);
     runMacros(arg.prompt);
})

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
