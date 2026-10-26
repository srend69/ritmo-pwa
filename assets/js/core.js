/* Ritmo — núcleo de dados, datas e estatísticas */

export const APP_VERSION = "1.0.0";
export const DATA_KEY = "ritmo.data.v1";
export const SETTINGS_KEY = "ritmo.settings.v1";
export const ONBOARDED_KEY = "ritmo.onboarded.v1";
export const MAX_NAME_LENGTH = 40;
export const RING_CIRCUMFERENCE = 2 * Math.PI * 50;

export const VALID_THEMES = ["system", "light", "dark"];

export const COLORS = Object.freeze({
  violet: { hex: "#6c5ce7", label: "Violeta" },
  mint: { hex: "#0e9f6e", label: "Verde" },
  blue: { hex: "#2f80ed", label: "Azul" },
  coral: { hex: "#e84a5f", label: "Coral" },
  pink: { hex: "#d63384", label: "Rosa" },
  amber: { hex: "#b7791f", label: "Âmbar" },
});

/* 0 = domingo … 6 = sábado */
export const WEEKDAY_FULL = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];
export const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const WEEKDAY_MEDIUM = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const WEEKDAY_LETTER = ["D", "S", "T", "Q", "Q", "S", "S"];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(key) {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function normalizeDateKey(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]|$)/);
  if (!match) return null;
  return parseDateKey(match[1]) ? match[1] : null;
}

export function todayDate() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

export function todayKey() {
  return dateKey(todayDate());
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  next.setHours(12, 0, 0, 0);
  return next;
}

export function startOfWeekMonday(date) {
  const monday = new Date(date);
  monday.setHours(12, 0, 0, 0);
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return monday;
}

export function getWeekDays(date = todayDate()) {
  const monday = startOfWeekMonday(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function isHabitActiveOn(habit, date) {
  return Boolean(habit && habit.createdAt <= dateKey(date));
}

export function scheduledHabits(habits, date) {
  return habits.filter(
    (habit) => isHabitActiveOn(habit, date) && habit.days.includes(date.getDay())
  );
}

export function daySummary(habits, date) {
  const key = dateKey(date);
  let total = 0;
  let done = 0;
  for (const habit of habits) {
    if (!isHabitActiveOn(habit, date)) continue;
    if (!habit.days.includes(date.getDay())) continue;
    total += 1;
    if (habit.records[key]) done += 1;
  }
  return { total, done, all: total > 0 && done === total };
}

export function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatLongDate(date) {
  const options = { weekday: "long", day: "numeric", month: "long" };
  if (date.getFullYear() !== new Date().getFullYear()) options.year = "numeric";
  return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

export function uid() {
  try {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
  } catch (error) {
    /* fallback abaixo */
  }
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function cleanName(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

let graphemeSegmenter = null;
try {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    graphemeSegmenter = new Intl.Segmenter("pt", { granularity: "grapheme" });
  }
} catch (error) {
  graphemeSegmenter = null;
}

export function firstGrapheme(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (graphemeSegmenter) {
    const iterator = graphemeSegmenter.segment(text)[Symbol.iterator]();
    const first = iterator.next();
    if (!first.done) return first.value.segment;
  }
  return Array.from(text)[0] || "";
}

export function cleanEmoji(value, fallback = "") {
  return firstGrapheme(value) || fallback;
}

export function normalizeDays(input) {
  if (!Array.isArray(input)) return [];
  const days = input
    .map((day) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return [...new Set(days)].sort((a, b) => a - b);
}

export function scheduleLabel(days) {
  const set = new Set(normalizeDays(days));
  if (set.size === 7) return "Todos os dias";
  if (set.size === 5 && [1, 2, 3, 4, 5].every((day) => set.has(day))) {
    return "Dias úteis";
  }
  if (set.size === 2 && set.has(0) && set.has(6)) return "Fins de semana";
  if (set.size === 0) return "Nenhum dia";
  return WEEK_ORDER.filter((day) => set.has(day))
    .map((day) => WEEKDAY_MEDIUM[day])
    .join(", ");
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function normalizeHabit(raw, { regenerateId = false } = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const name = cleanName(raw.name);
  if (!name) return null;

  const days = normalizeDays(raw.days);
  if (!days.length) return null;

  const color = hasOwn(COLORS, raw.color) ? raw.color : "violet";
  const emoji = cleanEmoji(raw.emoji, "⭐");

  const records = {};
  if (
    raw.records &&
    typeof raw.records === "object" &&
    !Array.isArray(raw.records)
  ) {
    for (const [rawKey, value] of Object.entries(raw.records)) {
      if (!value) continue;
      const key = normalizeDateKey(rawKey);
      if (key) records[key] = true;
    }
  }

  const createdAt =
    normalizeDateKey(raw.createdAt) ||
    Object.keys(records).sort()[0] ||
    todayKey();

  const rawId =
    typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "";
  const id = regenerateId || !rawId ? uid() : rawId;

  return { id, name, emoji, color, days, createdAt, records };
}

/* ---------- Persistência ---------- */

export function loadStoredHabits() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.habits)
        ? parsed.habits
        : [];
    const seen = new Set();
    const habits = [];
    for (const item of list) {
      const habit = normalizeHabit(item);
      if (!habit) continue;
      if (seen.has(habit.id)) habit.id = uid();
      seen.add(habit.id);
      habits.push(habit);
    }
    return habits;
  } catch (error) {
    console.warn("Ritmo: não foi possível carregar os hábitos.", error);
    return [];
  }
}

export function saveStoredHabits(habits) {
  try {
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({ version: 1, habits })
    );
    return true;
  } catch (error) {
    console.warn("Ritmo: não foi possível salvar os hábitos.", error);
    return false;
  }
}

export function clearStoredHabits() {
  try {
    localStorage.removeItem(DATA_KEY);
  } catch (error) {
    /* ignora */
  }
}

export function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { theme: "system" };
    const parsed = JSON.parse(raw);
    return {
      theme: VALID_THEMES.includes(parsed?.theme) ? parsed.theme : "system",
    };
  } catch (error) {
    return { theme: "system" };
  }
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        theme: VALID_THEMES.includes(settings?.theme)
          ? settings.theme
          : "system",
      })
    );
  } catch (error) {
    /* preferências são leves; ignora falhas de armazenamento */
  }
}

export function isOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch (error) {
    return false;
  }
}

export function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch (error) {
    /* ignora */
  }
}

/* ---------- Dados de exemplo ---------- */

export function createDemoHabits() {
  const today = todayDate();
  const createdAt = dateKey(addDays(today, -27));
  const pattern = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1];
  const specs = [
    {
      name: "Beber 2L de água",
      emoji: "💧",
      color: "blue",
      days: [0, 1, 2, 3, 4, 5, 6],
      todayDone: true,
    },
    {
      name: "Ler 10 páginas",
      emoji: "📚",
      color: "amber",
      days: [0, 1, 2, 3, 4, 5, 6],
      todayDone: true,
    },
    {
      name: "Caminhar 20 min",
      emoji: "🚶",
      color: "mint",
      days: [1, 3, 5],
      todayDone: false,
    },
  ];

  return specs.map((spec, index) => {
    const records = {};
    for (let offset = 1; offset <= 27; offset += 1) {
      const date = addDays(today, -offset);
      if (!spec.days.includes(date.getDay())) continue;
      if (offset <= 4) {
        records[dateKey(date)] = true;
        continue;
      }
      if (pattern[(offset + index * 4) % pattern.length]) {
        records[dateKey(date)] = true;
      }
    }
    if (spec.todayDone && spec.days.includes(today.getDay())) {
      records[todayKey()] = true;
    }
    return {
      id: uid(),
      name: spec.name,
      emoji: spec.emoji,
      color: spec.color,
      days: normalizeDays(spec.days),
      createdAt,
      records,
    };
  });
}

/* ---------- Estatísticas ---------- */

export function currentStreak(habits, endDate = todayDate()) {
  if (!habits.length) return 0;
  const earliest = habits
    .map((habit) => habit.createdAt)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];

  let date = new Date(endDate);
  const today = daySummary(habits, date);
  if (today.total > 0 && !today.all) date = addDays(date, -1);

  let streak = 0;
  for (let guard = 0; guard < 4000; guard += 1) {
    if (dateKey(date) < earliest) break;
    const info = daySummary(habits, date);
    if (info.total === 0) {
      date = addDays(date, -1);
      continue;
    }
    if (!info.all) break;
    streak += 1;
    date = addDays(date, -1);
  }
  return streak;
}

export function bestStreak(habits) {
  if (!habits.length) return 0;
  const earliest = habits
    .map((habit) => habit.createdAt)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
  let date = parseDateKey(earliest) || todayDate();
  const end = todayDate();
  let best = 0;
  let current = 0;

  for (let guard = 0; guard < 4000 && date <= end; guard += 1) {
    const info = daySummary(habits, date);
    if (info.total > 0) {
      if (info.all) {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    date = addDays(date, 1);
  }
  return best;
}

export function habitStreak(habit, endDate = todayDate()) {
  const created = parseDateKey(habit.createdAt);
  let date = new Date(endDate);
  if (habit.days.includes(date.getDay()) && !habit.records[dateKey(date)]) {
    date = addDays(date, -1);
  }

  let streak = 0;
  for (let guard = 0; guard < 4000; guard += 1) {
    if (created && date < created) break;
    if (habit.days.includes(date.getDay())) {
      if (habit.records[dateKey(date)]) streak += 1;
      else break;
    }
    date = addDays(date, -1);
  }
  return streak;
}

export function habitCompletion(habit, start, end = todayDate()) {
  const created = parseDateKey(habit.createdAt);
  let date = new Date(start);
  if (created && created > date) date = new Date(created);

  let total = 0;
  let done = 0;
  for (let guard = 0; guard < 4000 && date <= end; guard += 1) {
    if (habit.days.includes(date.getDay())) {
      total += 1;
      if (habit.records[dateKey(date)]) done += 1;
    }
    date = addDays(date, 1);
  }
  return {
    total,
    done,
    rate: total ? Math.round((done / total) * 100) : null,
  };
}

export function totalCheckins(habits) {
  return habits.reduce(
    (sum, habit) => sum + Object.keys(habit.records).length,
    0
  );
}

export function toggleHabitRecord(habit, key) {
  if (habit.records[key]) {
    delete habit.records[key];
    return false;
  }
  habit.records[key] = true;
  return true;
}
