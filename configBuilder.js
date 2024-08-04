const fs = require('fs');
const yaml = require('js-yaml');

function loadConfig(configFilePath) {
    if (!configFilePath) {
        console.error('No config file path provided.');
        process.exit(1);
    }

    if (!fs.existsSync(configFilePath)) {
        console.error('Config file not found. Please provide a valid config file path.');
        process.exit(1);
    }

    let config;
    try {
        const fileContents = fs.readFileSync(configFilePath, 'utf8');
        if (!fileContents) {
            console.error('Config file is empty.');
            process.exit(1);
        }
        config = yaml.load(fileContents);
    } catch (e) {
        console.error('Error reading config file:', e);
        process.exit(1);
    }

    if (!config) {
        console.error('Configuration is undefined or null after parsing.');
        process.exit(1);
    }

    // Log the loaded configuration
    console.log('Configuration loaded successfully:', JSON.stringify(config.rules, null, 2));

    const missingConfig = validateConfig(config);

    if (missingConfig.length > 0) {
        console.error(`Configuration errors:\n${missingConfig.join('\n')}`);
        process.exit(1);
    }

    return config;
}

function validateConfig(config) {
    let errors = [];

    if (!config.hasOwnProperty('overseerr_baseurl') || !config.overseerr_baseurl) {
        errors.push('Missing overseerr_baseurl in config file.');
    }

    if (!config.hasOwnProperty('overseerr_api_key') || !config.overseerr_api_key) {
        errors.push('Missing overseerr_api_key in config file.');
    }

    if (!config.hasOwnProperty('rules') || !Array.isArray(config.rules) || config.rules.length === 0) {
        errors.push('Missing or empty rules array in config file.');
    } else {
        errors = errors.concat(validateRules(config.rules));
    }

    return errors;
}


function validateRules(rules) {
    let errors = [];
    rules.forEach((rule, index) => {
        if (!rule.media_type) {
            errors.push(`rules[${index}].media_type is missing.`);
        }
        if (!rule.root_folder) {
            errors.push(`rules[${index}].root_folder is missing.`);
        }
        if (rule.server_id == null) {  // Check for both null and undefined
            errors.push(`rules[${index}].server_id is missing.`);
        }
        if (!rule.server_name) {
            errors.push(`rules[${index}].server_name is missing.`);
        }
    });
    return errors;
}

module.exports = { loadConfig };
