const hi = require('./hi');
const en = require('./en');

const HINDI_KEYWORDS = [
  'नमस्ते', 'नमस्कार', 'हैलो', 'हाय', 'बुक', 'अपॉइंटमेंट', 'डॉक्टर',
  'हाँ', 'नहीं', 'कल', 'परसों', 'समय', 'तारीख', 'धन्यवाद', 'ठीक',
  'नमस्ते', 'बुक', 'अपॉइंटमेंट', 'डॉक्टर', 'हाँ', 'नहीं', 'कल', 'परसों',
  'समय', 'तारीख', 'धन्यवाद', 'ठीक', 'हैलो', 'नमस्कार', 'चाहिए', 'करना',
  'बात', 'कैसे', 'क्या', 'कौन', 'कहाँ', 'कब', 'मैं', 'मुझे', 'आप',
  'हम', 'वो', 'ये', 'कोई', 'सब', 'बहुत', 'थोड़ा', 'अच्छा', 'बुरा',
];

const HINGLISH_KEYWORDS = [
  'namaste', 'namaskar', 'kya', 'kaise', 'kahan', 'kab', 'kaun', 'kyu',
  'mera', 'mujhe', 'apka', 'aapka', 'hindi', 'appointment', 'doctor',
  'hai', 'ho', 'hain', 'hum', 'tum', 'aap', 'main', 'nahi', 'haan', 'theek',
  'accha', 'chahiye', 'saktay', 'sakte', 'sakta', 'kar', 'karo', 'karein',
  'thik', 'namaste', 'namaskar', 'kaise', 'kya', 'kaun', 'kab', 'kahan',
  'kyu', 'kyon', 'mera', 'mujhe', 'tera', 'tujhe', 'apna', 'aapna',
];

function containsHindiScript(text) {
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text);
}

function containsHinglish(text) {
  const lower = text.toLowerCase().trim();
  const words = lower.split(/\s+/);
  const matchCount = words.filter(w => HINGLISH_KEYWORDS.includes(w)).length;
  return matchCount >= 2;
}

function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';
  if (containsHindiScript(text)) return 'hi';
  if (containsHinglish(text)) return 'hi';
  return 'en';
}

function isHindiGreeting(text) {
  const lower = text.toLowerCase().trim();
  const hindiGreetings = ['नमस्ते', 'नमस्कार', 'हैलो', 'हाय', 'नमस्ते'];
  const hinglishGreetings = ['namaste', 'namaskar', 'namste', 'hii', 'hello'];
  return hindiGreetings.some(g => lower.includes(g)) || hinglishGreetings.some(g => lower.includes(g));
}

function isHindiBooking(text) {
  const lower = text.toLowerCase().trim();
  const bookingWords = ['बुक', 'अपॉइंटमेंट', 'बुकिंग', 'book', 'appointment', 'booking', 'apointment'];
  return bookingWords.some(w => lower.includes(w));
}

module.exports = { detectLanguage, containsHindiScript, containsHinglish, isHindiGreeting, isHindiBooking, HINGLISH_KEYWORDS, HINDI_KEYWORDS };
