const TelegramBot = require('node-telegram-bot-api');
const { fetchSchedule, formatMessage } = require('./scraper');

let bot = null;

function initBot(token) {
  bot = new TelegramBot(token, { polling: true });

  // Komenda /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log(`📍 Chat ID: ${chatId}`);
    bot.sendMessage(chatId,
      `👋 Cześć! Jestem botem Emocje.TV.\n\n` +
      `Wysyłam codziennie program transmisji sportowych.\n\n` +
      `Komendy:\n` +
      `▶️ /dzisiaj - program na dziś\n` +
      `▶️ /jutro - program na jutro\n` +
      `▶️ /chatid - pokaż ID tego chatu\n\n` +
      `💡 Twoje Chat ID: \`${chatId}\`\n` +
      `(Wklej je do pliku .env jako TELEGRAM_CHAT_ID)`,
      { parse_mode: 'Markdown' }
    );
  });

  // Komenda /dzisiaj
  bot.onText(/\/dzisiaj/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(`📥 Komenda /dzisiaj od chat: ${chatId}`);
    
    try {
      const schedule = await fetchSchedule(0);
      const message = formatMessage(schedule);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('❌ Błąd:', error.message);
      await bot.sendMessage(chatId, '❌ Wystąpił błąd przy pobieraniu programu.');
    }
  });

  // Komenda /jutro
  bot.onText(/\/jutro/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(`📥 Komenda /jutro od chat: ${chatId}`);
    
    try {
      const schedule = await fetchSchedule(1);
      const message = formatMessage(schedule);
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('❌ Błąd:', error.message);
      await bot.sendMessage(chatId, '❌ Wystąpił błąd przy pobieraniu programu.');
    }
  });

  // Komenda /chatid
  bot.onText(/\/chatid/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `💡 Twoje Chat ID: \`${chatId}\``, { parse_mode: 'Markdown' });
  });

  console.log('🤖 Bot Telegram uruchomiony i nasłuchuje komend...');
  return bot;
}

// Wyślij wiadomość do konkretnego chatu
async function sendScheduleToChat(chatId, dayOffset = 0) {
  if (!bot) {
    throw new Error('Bot nie jest zainicjalizowany!');
  }

  const schedule = await fetchSchedule(dayOffset);
  const message = formatMessage(schedule);
  
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`✅ Wysłano program na ${schedule.date} do chatu ${chatId}`);
  } catch (error) {
    console.error(`❌ Błąd wysyłania do chatu ${chatId}:`, error.message);
  }
}

module.exports = { initBot, sendScheduleToChat };
