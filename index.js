require('dotenv').config();
const { initBot } = require('./src/bot');
const { startScheduler } = require('./src/scheduler');

// ===== Konfiguracja =====
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SEND_HOUR = process.env.DAILY_SEND_HOUR || '07';
const SEND_MINUTE = process.env.DAILY_SEND_MINUTE || '00';

// Sprawdzenie konfiguracji
if (!BOT_TOKEN || BOT_TOKEN === 'tutaj_wklej_token') {
  console.error('❌ Brak tokena bota!');
  console.error('   1. Otwórz Telegram i napisz do @BotFather');
  console.error('   2. Wyślij /newbot i postępuj zgodnie z instrukcjami');
  console.error('   3. Skopiuj token i wklej do pliku .env jako TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

if (!CHAT_ID || CHAT_ID === 'tutaj_wklej_chat_id') {
  console.warn('⚠️  Brak Chat ID w pliku .env');
  console.warn('   Bot uruchomiony, ale codzienna automatyczna wysyłka nie będzie działać.');
  console.warn('   Napisz /start do bota na Telegramie, żeby poznać swoje Chat ID.');
  console.warn('   Potem wklej je do pliku .env jako TELEGRAM_CHAT_ID\n');
}

// ===== Uruchomienie =====
console.log('');
console.log('╔══════════════════════════════════════╗');
console.log('║   📺  Bot Emocje.TV - Program TV     ║');
console.log('╚══════════════════════════════════════╝');
console.log('');

// Uruchom bota Telegram
const bot = initBot(BOT_TOKEN);

// Uruchom scheduler (jeśli jest Chat ID)
if (CHAT_ID && CHAT_ID !== 'tutaj_wklej_chat_id') {
  startScheduler(CHAT_ID, SEND_HOUR, SEND_MINUTE, bot);
} else {
  console.log('⏸️  Scheduler wyłączony - ustaw TELEGRAM_CHAT_ID w .env');
}

console.log('');
console.log('💡 Komendy bota:');
console.log('   /start   - informacje o bocie');
console.log('   /dzisiaj - program na dziś');
console.log('   /jutro   - program na jutro');
console.log('   /chatid  - pokaż Chat ID');
console.log('');
console.log('🟢 Bot działa. Naciśnij Ctrl+C aby zatrzymać.\n');
