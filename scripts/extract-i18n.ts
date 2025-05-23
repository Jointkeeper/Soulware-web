const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const TRANSLATION_KEY_REGEX = /t\(['"]([^'"]+)['"]\)/g;
const SRC_FILES_PATTERN = 'src/**/*.{ts,tsx}';
const LOCALES_DIR = path.join(process.cwd(), 'public/locales');
const LANGUAGES = ['en', 'ru'];
const TODO_TRANSLATE_VALUE = '<todo-translate>';

async function extractKeysFromSourceFiles(): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    glob(SRC_FILES_PATTERN, (err: Error | null, files: string[]) => {
      if (err) {
        return reject(err);
      }
      const keys = new Set<string>();
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = TRANSLATION_KEY_REGEX.exec(content)) !== null) {
          keys.add(match[1]);
        }
      }
      resolve(keys);
    });
  });
}

function readTranslationFile(lang: string): Record<string, string> {
  const filePath = path.join(LOCALES_DIR, lang, 'common.json');
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return {};
  }
}

function writeTranslationFile(lang: string, translations: Record<string, string>): void {
  const filePath = path.join(LOCALES_DIR, lang, 'common.json');
  const sortedTranslations: Record<string, string> = {};
  Object.keys(translations)
    .sort()
    .forEach(key => {
      sortedTranslations[key] = translations[key];
    });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(sortedTranslations, null, 2) + '\n');
}

async function main() {
  console.log('Starting i18n key extraction...');
  const extractedKeys = await extractKeysFromSourceFiles();
  console.log(`Found ${extractedKeys.size} unique keys in source files.`);

  for (const lang of LANGUAGES) {
    console.log(`Processing language: ${lang}`);
    const existingTranslations = readTranslationFile(lang);
    const updatedTranslations = { ...existingTranslations };
    let newKeysAdded = 0;

    extractedKeys.forEach(key => {
      if (!updatedTranslations[key]) {
        updatedTranslations[key] = TODO_TRANSLATE_VALUE;
        newKeysAdded++;
      }
    });
    
    // Preserve existing keys that are not in the source code for now
    // but ensure new keys are added.
    // A more sophisticated approach might remove unused keys, but that's not requested.

    if (newKeysAdded > 0) {
      console.log(`Added ${newKeysAdded} new keys to ${lang}/common.json`);
    } else {
      console.log(`No new keys to add to ${lang}/common.json`);
    }
    
    // Ensure all extracted keys exist in the file, even if they were already there (for sorting)
    extractedKeys.forEach(key => {
        if (!(key in updatedTranslations)) { // Should not happen with current logic but as a safeguard
             updatedTranslations[key] = TODO_TRANSLATE_VALUE;
        }
    });
    
    // Create a new object for sorting, including only keys present in extractedKeys or originally present
    const finalTranslations: Record<string,string> = {};
    const allKnownKeys = new Set([...Object.keys(existingTranslations), ...extractedKeys])
    
    allKnownKeys.forEach(key => {
        if (extractedKeys.has(key)) { // If key is from source code
            finalTranslations[key] = updatedTranslations[key] || TODO_TRANSLATE_VALUE;
        } else if (existingTranslations.hasOwnProperty(key)) { // If key was pre-existing and not in source
             finalTranslations[key] = existingTranslations[key];
        }
    });


    writeTranslationFile(lang, finalTranslations);
    console.log(`Successfully updated and sorted ${lang}/common.json`);
  }

  console.log('i18n key extraction finished.');
}

main().catch(error => {
  console.error('Error during i18n key extraction:', error);
  process.exit(1);
}); 