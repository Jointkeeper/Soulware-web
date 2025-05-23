require('dotenv').config(); // To load .env, .env.local, etc.
const fs = require('fs');
const path = require('path');

// interface RequiredEnv { // Not needed in JS
//   required: string[];
// }

const requiredEnvPath = path.join(__dirname, 'env-required.json');
let required = [];

try {
  const rawData = fs.readFileSync(requiredEnvPath, 'utf-8');
  const jsonData = JSON.parse(rawData); // jsonData will be an object, cast to RequiredEnv implicitly
  if (jsonData && Array.isArray(jsonData.required)) {
    required = jsonData.required;
  } else {
    console.error('Error: env-required.json is missing the "required" array or is malformed.');
    process.exit(1);
  }
} catch (error) {
  console.error(`Error reading or parsing env-required.json at ${requiredEnvPath}:`, error.message);
  process.exit(1);
}

if (required.length === 0) {
  console.warn('Warning: No environment variables listed as required in env-required.json. Skipping check.');
  process.exit(0);
}

const missing = required.filter(key => !(key in process.env) || process.env[key] === '');

if (missing.length > 0) {
  console.error('\x1b[31mError: Missing required environment variables:\x1b[0m');
  missing.forEach(key => console.error(`  - ${key}`));
  console.error('\nPlease ensure all required variables are set in your .env file or system environment.');
  process.exit(1);
} else {
  console.log('\x1b[32mEnvironment variables check passed. All required variables are set.\x1b[0m');
  process.exit(0);
} 