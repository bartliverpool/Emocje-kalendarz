const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'https://nowe.emocje.tv/api/products/ppvs';

// Stały identyfikator urządzenia (generowany raz)
const DEVICE_UID = crypto.randomBytes(16).toString('hex');

// Polskie nazwy dni tygodnia
const DAYS_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

// Emoji na podstawie kategorii sportu
function getSportEmoji(categories) {
  const categoryNames = categories.map(c => c.name.toLowerCase()).join(' ');
  
  if (categoryNames.includes('koszykówka') || categoryNames.includes('basket')) return '🏀';
  if (categoryNames.includes('piłka ręczna') || categoryNames.includes('superliga')) return '🤾';
  if (categoryNames.includes('piłka nożna') || categoryNames.includes('football')) return '⚽';
  if (categoryNames.includes('siatkówka') || categoryNames.includes('volley')) return '🏐';
  if (categoryNames.includes('tenis')) return '🎾';
  if (categoryNames.includes('żużel')) return '🏍️';
  if (categoryNames.includes('hokej')) return '🏒';
  return '🏆';
}

// Pobierz program na dany dzień (offset: 0 = dziś, 1 = jutro)
async function fetchSchedule(dayOffset = 0) {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + dayOffset);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');

  const since = `${year}-${month}-${day}T00:00+0100`;
  const till = `${year}-${month}-${day}T23:59+0100`;

  try {
    const correlationId = `client_${crypto.randomUUID()}`;
    
    const response = await axios.get(API_URL, {
      params: {
        firstResult: 0,
        maxResults: 100,
        'mainCategoryId[]': 2968,
        since: since,
        till: till,
        lang: 'POL',
        platform: 'BROWSER'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://nowe.emocje.tv/transmisje?dayOffset=0',
        'api-deviceuid': DEVICE_UID,
        'api-correlationid': correlationId
      }
    });

    const items = response.data.items || [];

    if (items.length === 0) {
      return { date: `${day}.${month}.${year}`, events: [] };
    }

    // Funkcja pomocnicza do wyciągania czasu meczu
    function getMatchTime(item) {
      if (item.displaySchedules && item.displaySchedules.length > 0) {
        const normalSchedule = item.displaySchedules.find(s => s.type === 'NORMAL');
        if (normalSchedule) return new Date(normalSchedule.since);
      }
      return new Date(item.since);
    }

    // Sortuj po godzinie meczu
    items.sort((a, b) => getMatchTime(a) - getMatchTime(b));

    const events = items.map(item => {
      // Prawdziwy czas meczu jest w displaySchedules z typem NORMAL
      let matchTime;
      if (item.displaySchedules && item.displaySchedules.length > 0) {
        const normalSchedule = item.displaySchedules.find(s => s.type === 'NORMAL');
        matchTime = normalSchedule ? new Date(normalSchedule.since) : new Date(item.since);
      } else {
        matchTime = new Date(item.since);
      }

      const hours = String(matchTime.getHours()).padStart(2, '0');
      const minutes = String(matchTime.getMinutes()).padStart(2, '0');

      // Liga/kategoria - bierz z lead lub z categories
      let league = item.lead || '';
      // Usuń informację o kolejce jeśli jest (np. ", 29. kolejka")
      if (league.includes(',')) {
        league = league.split(',')[0].trim();
      }

      const emoji = getSportEmoji(item.categories || []);

      return {
        time: `${hours}:${minutes}`,
        league: league,
        title: item.title,
        emoji: emoji
      };
    });

    const dayName = DAYS_PL[targetDate.getDay()];
    return { date: `${day}.${month}.${year}`, dayName, events };
  } catch (error) {
    console.error('❌ Błąd pobierania danych z Emocje.TV:', error.message);
    const dayName = DAYS_PL[targetDate.getDay()];
    return { date: `${day}.${month}.${year}`, dayName, events: [], error: error.message };
  }
}

// Formatuj wiadomość do wysłania na Telegram
function formatMessage(schedule) {
  const header = `${schedule.dayName}, ${schedule.date}`;

  if (schedule.error) {
    return `❌ Nie udało się pobrać programu na ${header}\nBłąd: ${schedule.error}`;
  }

  if (schedule.events.length === 0) {
    return `📺 *${header}*\n\n🚫 Brak transmisji na ten dzień.`;
  }

  let message = `📺 *${header}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Grupuj po lidze
  const byLeague = {};
  for (const event of schedule.events) {
    const key = event.league || 'Inne';
    if (!byLeague[key]) {
      byLeague[key] = [];
    }
    byLeague[key].push(event);
  }

  for (const [league, events] of Object.entries(byLeague)) {
    const emoji = events[0].emoji;
    message += `${emoji} *${league}*\n`;
    for (const event of events) {
      message += `   ⏰ ${event.time}  │  ${event.title}\n`;
    }
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📊 Łącznie: ${schedule.events.length} transmisji`;

  return message;
}

// Codzienny raport: dziś + jutro w jednej wiadomości
async function formatDailyReport() {
  const today = await fetchSchedule(0);
  const tomorrow = await fetchSchedule(1);

  const todayMsg = formatMessage(today);
  const tomorrowMsg = formatMessage(tomorrow);

  return `${todayMsg}\n\n\n${tomorrowMsg}`;
}

module.exports = { fetchSchedule, formatMessage, formatDailyReport };
