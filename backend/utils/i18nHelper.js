const fs = require('fs');
const path = require('path');
const { parseTemplate } = require('./templateParser');

const locales = {};

// Preload locales
const localesDir = path.join(__dirname, '../locales/bot');
if (fs.existsSync(localesDir)) {
  fs.readdirSync(localesDir).forEach(file => {
    if (file.endsWith('.json')) {
      const lang = file.replace('.json', '');
      locales[lang] = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
    }
  });
}

function t(lang, key, data = {}) {
  const messages = locales[lang] || locales['en'] || {};
  const template = messages[key] || key;
  return parseTemplate(template, data);
}

module.exports = { t };
