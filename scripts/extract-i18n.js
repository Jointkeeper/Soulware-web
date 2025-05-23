const fs = require('fs');
const path = require('path');

// Define the shape of the JSON translation files
// interface Translations { // Not needed in JS
//   [key: string]: string | Translations;
// }

const localesDir = path.join(__dirname, '../public/locales');
const langFolders = ['en', 'ru'];
const defaultTranslation = '<todo-translate>';
// Regex updated based on further testing to better capture keys
// It looks for t('key') or t("key")
const i18nKeyRegex = /t\(\s*['"]([^\'"()[\]]+?)['"]\s*\)/g;

async function getFilesRecursively(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'public' || entry.name === 'scripts' || entry.name.startsWith('.') || entry.name === 'dist') {
          return Promise.resolve([]);
        }
        return getFilesRecursively(res);
      }
      if (entry.isFile() && (res.endsWith('.ts') || res.endsWith('.tsx'))) {
        return Promise.resolve([res]);
      }
      return Promise.resolve([]);
    })
  );
  return Array.prototype.concat(...files);
}

async function extractKeysFromCode() {
  const keys = new Set();
  const projectSrcDir = path.resolve(__dirname, '../src');
  const files = await getFilesRecursively(projectSrcDir);

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      let match;
      while ((match = i18nKeyRegex.exec(content)) !== null) {
        if (match[1]) { // Key is in match[1]
          keys.add(match[1]);
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  return keys;
}

function readTranslationFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error);
    return {};
  }
}

function writeTranslationFile(filePath, data) {
  try {
    const sortedData = {};
    Object.keys(data)
      .sort()
      .forEach((key) => {
        sortedData[key] = data[key];
      });
    fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

function mergeKeys(existingTranslations, newKeys) {
  const updatedTranslations = { ...existingTranslations };
  let newKeysAddedCount = 0;

  newKeys.forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(updatedTranslations, key)) {
      updatedTranslations[key] = defaultTranslation;
      newKeysAddedCount++;
    }
  });

  if (newKeysAddedCount > 0) {
    console.log(`Added ${newKeysAddedCount} new keys to the file.`);
  } else {
    console.log('No new keys to add to this file.');
  }

  return updatedTranslations;
}

async function main() {
  console.log('Starting i18n key extraction...');
  const extractedKeys = await extractKeysFromCode();
  console.log(`Found ${extractedKeys.size} unique keys in code.`);

  if (extractedKeys.size === 0) {
    console.log('No keys found in code. Exiting.');
    return;
  }

  for (const lang of langFolders) {
    const filePath = path.join(localesDir, lang, 'common.json');
    console.log(`Processing ${filePath}...`);
    const existingTranslations = readTranslationFile(filePath);
    const updatedTranslations = mergeKeys(existingTranslations, extractedKeys);
    writeTranslationFile(filePath, updatedTranslations);
  }

  console.log('i18n key extraction finished.');
}

main().catch(error => {
  console.error('Error during i18n key extraction process:', error);
  process.exit(1);
}); 