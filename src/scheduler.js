const cron = require('node-cron');
const { formatDailyReport } = require('./scraper');

function startScheduler(chatId, hour = '07', minute = '00', bot) {
  const cronExpression = `${minute} ${hour} * * *`;
  
  console.log(`⏰ Scheduler ustawiony na codziennie o ${hour}:${minute}`);
  console.log(`📬 Wiadomości będą wysyłane do chatu: ${chatId}`);

  const job = cron.schedule(cronExpression, async () => {
    console.log(`\n🔄 [${new Date().toLocaleString('pl-PL')}] Automatyczna wysyłka programu...`);
    
    try {
      const message = await formatDailyReport();
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      console.log(`✅ Wysłano program na dziś i jutro do chatu ${chatId}`);
    } catch (error) {
      console.error('❌ Błąd automatycznej wysyłki:', error.message);
    }
  }, {
    timezone: 'Europe/Warsaw'
  });

  return job;
}

module.exports = { startScheduler };
