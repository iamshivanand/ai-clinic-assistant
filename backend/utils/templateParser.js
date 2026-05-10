/**
 * Replaces {{variable}} placeholders in a string with values from a data object.
 * @param {string} template - The template string with {{var}} placeholders.
 * @param {object} data - Object containing variables to replace.
 * @returns {string} - The parsed string.
 */
const parseTemplate = (template, data) => {
  if (!template) return '';
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
};

module.exports = { parseTemplate };
