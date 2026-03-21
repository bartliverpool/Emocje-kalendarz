const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { formatDailyReport } = require('./src/scraper');

const MESSAGES_FILE = path.join(__dirname, 'sent_messages.json');

// Wczytaj listę wysłanych wiadomości
function loadSentMessages() {
  if (fs.existsSync(MESSAGES_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

// Zapisz listę wysłanych wiadomości
function saveSentMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

async function runStandalone() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('❌ Błąd: Brak TELEGRAM_BOT_TOKEN lub TELEGRAM_CHAT_ID w środowisku.');
    process.exit(1);
  }

  const sentMessages = loadSentMessages();
  const now = Date.now();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

  // 1. Usuń stare wiadomości (starsze niż 48h)
  const remainingMessages = [];
  for (const msg of sentMessages) {
    if (now - msg.timestamp > FORTY_EIGHT_HOURS) {
      console.log(`🗑️ Usuwam starą wiadomość ID: ${msg.message_id}`);
      try {
        await axios.post(`https://api.telegram.org/bot${token}/deleteMessage`, {
          chat_id: chatId,
          message_id: msg.message_id
        });
      } catch (err) {
        console.error(`⚠️ Nie udało się usunąć wiadomości ${msg.message_id}:`, err.message);
        // Jeśli wiadomość już nie istnieje lub minęło >48h, Telegram zwróci błąd, ale idziemy dalej
      }
    } else {
      remainingMessages.push(msg);
    }
  }

  // 2. Wyślij nową wiadomość
  console.log(`🚀 Generuję nowy raport dla chatu: ${chatId}`);

  try {
    const reportMessage = await formatDailyReport();
    
    const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: reportMessage,
      parse_mode: 'Markdown'
    });

    const newMessageId = response.data.result.message_id;
    console.log(`✅ Nowy raport wysłany (ID: ${newMessageId})`);

    // 3. Zapisz nową wiadomość do listy
    remainingMessages.push({
      message_id: newMessageId,
      timestamp: now
    });

    saveSentMessages(remainingMessages);
    console.log('💾 Zaktualizowano listę wiadomości.');
  } catch (error) {
    console.error('❌ Błąd podczas wysyłki:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runStandalone();
