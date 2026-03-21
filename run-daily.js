require('dotenv').config();
const axios = require('axios');
const { formatDailyReport } = require('./src/scraper');

async function runStandalone() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('❌ Błąd: Brak TELEGRAM_BOT_TOKEN lub TELEGRAM_CHAT_ID w środowisku.');
    process.exit(1);
  }

  console.log(`🚀 Rozpoczynam generowanie raportu dla chatu: ${chatId}`);

  try {
    const message = await formatDailyReport();
    
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });

    console.log('✅ Raport wysłany pomyślnie!');
  } catch (error) {
    console.error('❌ Błąd podczas wysyłki:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runStandalone();
