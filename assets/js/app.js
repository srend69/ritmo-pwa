/* Ritmo — interface, interações e PWA */
import {
  APP_VERSION,
  COLORS,
  MAX_NAME_LENGTH,
  RING_CIRCUMFERENCE,
  VALID_THEMES,
  WEEKDAY_FULL,
  WEEKDAY_LETTER,
  WEEKDAY_SHORT,
  addDays,
  bestStreak,
  capitalize,
  cleanEmoji,
  cleanName,
  clearStoredHabits,
  createDemoHabits,
  currentStreak,
  dateKey,
  daySummary,
  formatLongDate,
  formatShortDate,
  getWeekDays,
  habitCompletion,
  habitStreak,
  isOnboarded,
  loadStoredHabits,
  loadStoredSettings,
  markOnboarded,
  normalizeDays,
  normalizeHabit,
  parseDateKey,
  saveStoredHabits,
  saveStoredSettings,
  scheduleLabel,
  scheduledHabits,
  toggleHabitRecord,
  todayDate,
  todayKey,
  totalCheckins,
  uid,
} from "./core.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const VIEWS = ["hoje", "progresso", "ajustes"];
const VIEW_TITLES = {
  hoje: "Hoje",
  progresso: "Progresso",
  ajustes: "Ajustes",
};

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const standaloneQuery = window.matchMedia("(display-mode: standalone)");

const state = {
  habits: [],
  settings: { theme: "system" },
  activeView: null,
  editingHabitId: null,
  optionsHabitId: null,
  pendingConfirm: null,
  deferredPrompt: null,
  swRegistration: null,
  swReady: false,
  installedThisSession: false,
  reloadingForUpdate: false,
  pendingNewHabit: false,
  lastDayKey: todayKey(),
  toastTimer: null,
};

const dom = {};

/* ---------- Cache de elementos ---------- */
function cacheDom() {
  dom.html = document.documentElement;
  dom.themeToggle = $("#theme-toggle");
  dom.themeIconUse = $("#theme-icon-use");
  dom.installTop = $("#install-top");
  dom.offlineBanner = $("#offline-banner");
  dom.main = $("#main");
  dom.views = {
    hoje: $("#view-hoje"),
    progresso: $("#view-progresso"),
    ajustes: $("#view-ajustes"),
  };
  dom.navItems = $$(".nav-item");
  dom.fab = $("#fab");

  dom.greeting = $("#greeting");
  dom.todayDate = $("#today-date");
  dom.hero = $("#hero");
  dom.heroKicker = $("#hero-kicker");
  dom.heroTitle = $("#hero-title");
  dom.heroCopy = $("#hero-copy");
  dom.streakChip = $("#streak-chip");
  dom.streakIcon = $("#streak-icon");
  dom.streakText = $("#streak-text");
  dom.ring = $("#ring");
  dom.ringValue = $("#ring-value");
  dom.ringCount = $("#ring-count");
  dom.ringCaption = $("#ring-caption");
  dom.todayCountPill = $("#today-count-pill");
  dom.todayList = $("#today-list");
  dom.todayEmpty = $("#today-empty");
  dom.emptyCreate = $("#empty-create");
  dom.emptySample = $("#empty-sample");
  dom.restState = $("#rest-state");
  dom.restCreate = $("#rest-create");
  dom.weekHint = $("#week-hint");
  dom.habitTemplate = $("#habit-template");

  dom.statRate = $("#stat-rate");
  dom.statRateBar = $("#stat-rate-bar");
  dom.statStreak = $("#stat-streak");
  dom.statCheckins = $("#stat-checkins");
  dom.statBest = $("#stat-best");
  dom.weekAverage = $("#week-average");
  dom.weekChart = $("#week-chart");
  dom.heatmapCaption = $("#heatmap-caption");
  dom.heatmap = $("#heatmap");
  dom.breakdown = $("#breakdown");
  dom.progressEmpty = $("#progress-empty");
  dom.progressCreate = $("#progress-create");

  dom.themeOptions = $$("[data-theme-choice]");
  dom.installTitle = $("#install-title");
  dom.installCopy = $("#install-copy");
  dom.installSettings = $("#install-settings");
  dom.installStatus = $("#install-status");
  dom.offlineTitle = $("#offline-title");
  dom.offlineCopy = $("#offline-copy");
  dom.offlinePill = $("#offline-pill");
  dom.exportBtn = $("#export-btn");
  dom.importBtn = $("#import-btn");
  dom.importFile = $("#import-file");
  dom.resetBtn = $("#reset-btn");
  dom.appVersion = $("#app-version");

  dom.habitDialog = $("#habit-dialog");
  dom.habitForm = $("#habit-form");
  dom.habitDialogEyebrow = $("#habit-dialog-eyebrow");
  dom.habitDialogTitle = $("#habit-dialog-title");
  dom.habitName = $("#habit-name");
  dom.nameCount = $("#name-count");
  dom.nameError = $("#name-error");
  dom.nameField = dom.habitName.closest(".field");
  dom.habitEmoji = $("#habit-emoji");
  dom.emojiRow = $(".emoji-row", dom.habitForm);
  dom.emojiButtons = $$(".emoji-option", dom.habitForm);
  dom.colorInputs = $$('input[name="color"]', dom.habitForm);
  dom.daysRow = $("#days-row");
  dom.daysField = dom.daysRow.closest(".field");
  dom.dayButtons = $$(".day-toggle", dom.habitForm);
  dom.daysError = $("#days-error");
  dom.quickDays = $(".quick-days", dom.habitForm);
  dom.saveHabitBtn = $("#save-habit-btn");

  dom.optionsDialog = $("#options-dialog");
  dom.optionsEmoji = $("#options-emoji");
  dom.optionsTitle = $("#options-title");
  dom.editHabitBtn = $("#edit-habit-btn");
  dom.deleteHabitBtn = $("#delete-habit-btn");

  dom.confirmDialog = $("#confirm-dialog");
  dom.confirmIcon = $("#confirm-icon");
  dom.confirmTitle = $("#confirm-title");
  dom.confirmMessage = $("#confirm-message");
  dom.confirmAction = $("#confirm-action");

  dom.installDialog = $("#install-dialog");
  dom.welcomeDialog = $("#welcome-dialog");
  dom.welcomeStart = $("#welcome-start");
  dom.welcomeDemo = $("#welcome-demo");

  dom.updateBanner = $("#update-banner");
  dom.updateButton = $("#update-button");
  dom.toast = $("#toast");
  dom.confettiLayer = $("#confetti-layer");
  dom.dialogs = $$("dialog.sheet");

  dom.ringValue.style.strokeDasharray = String(RING_CIRCUMFERENCE);
  dom.ringValue.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
}

/* ---------- Tema ---------- */
function effectiveTheme() {
  if (state.settings.theme === "dark") return "dark";
  if (state.settings.theme === "light") return "light";
  return systemTheme.matches ? "dark" : "light";
}

function updateThemeUI() {
  const theme = dom.html.dataset.theme === "dark" ? "dark" : "light";
  const isDark = theme === "dark";
  dom.themeOptions.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.themeChoice === state.settings.theme)
    );
  });
  dom.themeIconUse.setAttribute("href", isDark ? "#i-sun" : "#i-moon");
  dom.themeToggle.setAttribute(
    "aria-label",
    isDark ? "Mudar para o tema claro" : "Mudar para o tema escuro"
  );
  dom.themeToggle.title = isDark ? "Mudar para o tema claro" : "Mudar para o tema escuro";
}

function applyTheme(preference, { persist = false } = {}) {
  const theme = VALID_THEMES.includes(preference) ? preference : "system";
  state.settings.theme = theme;
  const resolved = effectiveTheme();
  dom.html.dataset.theme = resolved;
  dom.html.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#100e18" : "#f6f4fb");
  }
  updateThemeUI();
  if (persist) saveStoredSettings(state.settings);
}

function watchSystemTheme() {
  const handler = () => {
    if (state.settings.theme === "system") applyTheme("system");
  };
  if (typeof systemTheme.addEventListener === "function") {
    systemTheme.addEventListener("change", handler);
  } else if (typeof systemTheme.addListener === "function") {
    systemTheme.addListener(handler);
  }
}

/* ---------- Toast ---------- */
function showToast(message, { duration = 2800 } = {}) {
  if (!message) return;
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, duration);
}

/* ---------- Diálogos ---------- */
function syncModalState() {
  document.body.classList.toggle(
    "modal-open",
    Boolean(document.querySelector("dialog[open]"))
  );
}

function openDialog(dialog) {
  if (!dialog || dialog.open) return false;
  try {
    dialog.showModal();
    syncModalState();
    return true;
  } catch (error) {
    console.warn("Ritmo: não foi possível abrir o diálogo.", error);
    return false;
  }
}

function closeDialog(dialog) {
  if (dialog && dialog.open) dialog.close();
}

/* ---------- Instalação ---------- */
function isStandalone() {
  return (
    standaloneQuery.matches ||
    window.navigator.standalone === true ||
    state.installedThisSession
  );
}

function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
}

function updateInstallUI() {
  const installed = isStandalone();
  const canPrompt = Boolean(state.deferredPrompt);
  const ios = isIOS();

  dom.installTop.hidden = installed || (!canPrompt && !ios);
  dom.installTop.setAttribute(
    "aria-label",
    canPrompt ? "Instalar o Ritmo" : "Como instalar o Ritmo"
  );

  if (installed) {
    dom.installTitle.textContent = "Aplicativo instalado";
    dom.installCopy.textContent = "Você está usando o Ritmo em tela cheia.";
    dom.installSettings.hidden = true;
    dom.installStatus.hidden = false;
    return;
  }

  dom.installStatus.hidden = true;
  dom.installSettings.hidden = false;
  dom.installSettings.textContent = canPrompt ? "Instalar" : "Como instalar";
  dom.installTitle.textContent = "Instalar o Ritmo";
  if (canPrompt) {
    dom.installCopy.textContent = "Abra como um app, em tela cheia e offline.";
  } else if (ios) {
    dom.installCopy.textContent = "No Safari, adicione à Tela de Início.";
  } else {
    dom.installCopy.textContent = "Use o menu do navegador para instalar.";
  }
}

async function handleInstallClick() {
  if (isStandalone()) {
    showToast("O Ritmo já está instalado neste dispositivo.");
    return;
  }
  if (state.deferredPrompt) {
    const promptEvent = state.deferredPrompt;
    state.deferredPrompt = null;
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        state.installedThisSession = true;
        showToast("Ritmo instalado! Procure o ícone na tela inicial. 🎉");
      } else {
        showToast("Tudo bem! Você pode instalar depois em Ajustes.");
      }
    } catch (error) {
      console.warn("Ritmo: instalação não concluída.", error);
      showToast("Não foi possível instalar automaticamente. Use o menu do navegador.");
    }
    updateInstallUI();
    return;
  }
  openDialog(dom.installDialog);
}

/* ---------- Online / offline ---------- */
function updateOnlineUI() {
  const online = navigator.onLine;
  const supported = "serviceWorker" in navigator;
  dom.offlineBanner.hidden = online;

  let title;
  let copy;
  let pill;
  let warning = false;

  if (!online) {
    title = "Modo offline ativo";
    copy = "O Ritmo continua funcionando normalmente.";
    pill = "Offline";
    warning = true;
  } else if (state.swReady) {
    title = "Pronto para usar offline";
    copy = "Seus dados ficam salvos apenas neste dispositivo.";
    pill = "Ativo";
  } else if (!supported) {
    title = "Modo offline indisponível";
    copy = "Este navegador não oferece suporte a service workers.";
    pill = "—";
    warning = true;
  } else {
    title = "Preparando modo offline";
    copy = "O Ritmo ficará disponível mesmo sem internet.";
    pill = "Preparando";
    warning = true;
  }

  dom.offlineTitle.textContent = title;
  dom.offlineCopy.textContent = copy;
  dom.offlinePill.textContent = pill;
  dom.offlinePill.classList.toggle("is-offline", warning);
}

/* ---------- Utilidades de interface ---------- */
function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function viewFromHash() {
  const name = window.location.hash.replace(/^#/, "").split("?")[0];
  return VIEWS.includes(name) ? name : "hoje";
}

function greetingForHour(hour) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function updateDateHeader() {
  const now = new Date();
  dom.greeting.textContent = greetingForHour(now.getHours());
  dom.todayDate.textContent = capitalize(formatLongDate(now));
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/* ---------- Tela Hoje ---------- */
function refreshDataViews({ focusHabitId = null, focusDate = null } = {}) {
  renderToday({ focusHabitId, focusDate });
  if (state.activeView === "progresso") renderProgress();
  if (state.activeView === "ajustes") renderSettingsState();
}

function focusHabitControl(habitId, date = null) {
  const card = [...dom.todayList.children].find(
    (child) => child.dataset.habitId === habitId
  );
  if (!card) return;
  const target = date
    ? [...card.querySelectorAll("button.week-day")].find(
        (button) => button.dataset.date === date
      )
    : card.querySelector(".habit-check");
  if (target) target.focus({ preventScroll: true });
}

function renderToday({ focusHabitId = null, focusDate = null } = {}) {
  const today = todayDate();
  const key = dateKey(today);
  const summary = daySummary(state.habits, today);
  const scheduled = scheduledHabits(state.habits, today);
  const hasHabits = state.habits.length > 0;

  updateDateHeader();
  renderHero(summary);

  if (!hasHabits) {
    dom.todayCountPill.textContent = "Comece aqui";
  } else if (summary.total === 0) {
    dom.todayCountPill.textContent = "Dia de descanso";
  } else {
    dom.todayCountPill.textContent = `${summary.done}/${summary.total} feitos`;
  }

  dom.todayEmpty.hidden = hasHabits;
  dom.restState.hidden = !(hasHabits && summary.total === 0);
  dom.weekHint.hidden = scheduled.length === 0;
  dom.todayList.hidden = scheduled.length === 0;

  if (scheduled.length === 0) {
    dom.todayList.replaceChildren();
  } else {
    const fragment = document.createDocumentFragment();
    for (const habit of scheduled) {
      fragment.append(createHabitCard(habit, today, key));
    }
    dom.todayList.replaceChildren(fragment);
  }

  if (focusHabitId) focusHabitControl(focusHabitId, focusDate);
}

function renderHero(summary) {
  const hasHabits = state.habits.length > 0;
  const total = summary.total;
  const done = summary.done;
  const complete = total > 0 && done === total;

  dom.hero.classList.toggle("is-rest", hasHabits && total === 0);
  dom.hero.classList.toggle("is-complete", complete);

  let progress = 0;
  let count = `${done}/${total}`;
  let caption = "feitos";
  let aria = `${done} de ${total} ${
    total === 1 ? "hábito concluído" : "hábitos concluídos"
  } hoje`;

  if (!hasHabits) {
    dom.heroKicker.textContent = "Primeiro passo";
    dom.heroTitle.textContent = "Crie seu primeiro hábito";
    dom.heroCopy.textContent = "Todo ritmo começa com uma escolha pequena.";
    count = "0/0";
    caption = "feitos";
    aria = "Nenhum hábito criado ainda";
  } else if (total === 0) {
    dom.heroKicker.textContent = "Dia de descanso";
    dom.heroTitle.textContent = "Respire, hoje é leve.";
    dom.heroCopy.textContent =
      "Nenhum hábito agendado para hoje. O descanso também faz parte do ritmo.";
    progress = 1;
    count = "—";
    caption = "livre";
    aria = "Nenhum hábito agendado para hoje";
  } else if (complete) {
    dom.heroKicker.textContent = "Dia completo";
    dom.heroTitle.textContent = "Dia completo!";
    dom.heroCopy.textContent =
      "Você fechou o dia com tudo. Respire e celebre essa pequena vitória.";
    progress = 1;
  } else {
    dom.heroKicker.textContent = "Seu dia";
    progress = done / total;
    const remaining = total - done;

    if (done === 0) {
      dom.heroTitle.textContent = "Um passo de cada vez.";
      dom.heroCopy.textContent =
        total === 1
          ? "Comece pelo seu hábito de hoje. Você consegue."
          : `${pluralize(total, "hábito espera", "hábitos esperam")} por você. Comece pelo mais fácil.`;
    } else if (progress >= 0.5) {
      dom.heroTitle.textContent = "Você está quase lá!";
      dom.heroCopy.textContent =
        remaining === 1
          ? "Falta só 1 hábito para fechar o dia."
          : `Faltam ${remaining} hábitos para fechar o dia.`;
    } else {
      dom.heroTitle.textContent = "Bom começo!";
      dom.heroCopy.textContent =
        remaining === 1
          ? "Falta só 1 hábito para fechar o dia."
          : `Faltam ${remaining} hábitos para fechar o dia.`;
    }
  }

  dom.ringCount.textContent = count;
  dom.ringCaption.textContent = caption;
  dom.ring.setAttribute("aria-label", aria);
  dom.ringValue.style.strokeDashoffset = String(
    RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)))
  );

  const streak = currentStreak(state.habits);
  if (streak > 0 && hasHabits) {
    dom.streakChip.hidden = false;
    dom.streakIcon.textContent = "🔥";
    dom.streakText.textContent = `${pluralize(streak, "dia completo", "dias completos")}`;
  } else {
    dom.streakChip.hidden = true;
  }
}

function createHabitCard(habit, today, todayKeyValue) {
  const card = dom.habitTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.habitId = habit.id;
  card.style.setProperty("--habit-color", COLORS[habit.color].hex);

  const done = Boolean(habit.records[todayKeyValue]);
  card.classList.toggle("is-done", done);

  const check = $(".habit-check", card);
  check.setAttribute("aria-checked", String(done));
  check.setAttribute(
    "aria-label",
    `${done ? "Desmarcar" : "Marcar"} ${habit.name} como concluído hoje`
  );

  $(".habit-emoji", card).textContent = habit.emoji;
  $(".habit-name", card).textContent = habit.name;
  $(".habit-schedule", card).textContent = scheduleLabel(habit.days);

  const streak = habitStreak(habit);
  const streakElement = $(".habit-streak", card);
  if (streak > 0) {
    streakElement.textContent = pluralize(streak, "dia seguido", "dias seguidos");
  } else {
    streakElement.hidden = true;
    $(".meta-sep", card).hidden = true;
  }

  const menu = $(".habit-menu", card);
  menu.setAttribute("aria-label", `Opções de ${habit.name}`);

  const strip = $(".week-strip", card);
  strip.setAttribute("aria-label", `Semana atual de ${habit.name}`);

  const todayKeyNow = todayKey();
  for (const day of getWeekDays(today)) {
    const key = dateKey(day);
    const scheduled =
      habit.days.includes(day.getDay()) && key >= habit.createdAt;
    const isDone = Boolean(habit.records[key]);
    const isToday = key === todayKeyNow;
    const isFuture = key > todayKeyNow;
    const canToggle = scheduled && !isFuture;

    let cell;
    if (canToggle) {
      cell = document.createElement("button");
      cell.type = "button";
      cell.className = "week-day";
      cell.dataset.date = key;
      cell.setAttribute("aria-pressed", String(isDone));
      cell.setAttribute(
        "aria-label",
        `${WEEKDAY_FULL[day.getDay()]}, ${formatShortDate(day)} — ${
          isDone ? "concluído" : "não concluído"
        }. Toque para ${isDone ? "desmarcar" : "marcar"}.`
      );
      cell.title = `${WEEKDAY_FULL[day.getDay()]}, ${formatShortDate(day)}`;
    } else {
      cell = document.createElement("span");
      cell.className = "week-day";
      cell.setAttribute("aria-hidden", "true");
    }

    cell.classList.toggle("is-scheduled", scheduled);
    cell.classList.toggle("is-done", isDone);
    cell.classList.toggle("is-today", isToday);
    cell.classList.toggle("is-off", !scheduled);
    cell.classList.toggle("is-future", isFuture);
    cell.append(
      createElement("span", "week-day-letter", WEEKDAY_LETTER[day.getDay()]),
      createElement("span", "week-day-dot")
    );
    strip.append(cell);
  }

  check.addEventListener("click", () => {
    toggleHabitDay(habit.id, todayKeyValue);
  });

  menu.addEventListener("click", () => openOptions(habit.id));

  strip.addEventListener("click", (event) => {
    const button = event.target.closest("button.week-day");
    if (!button) return;
    toggleHabitDay(habit.id, button.dataset.date, {
      focusDate: button.dataset.date,
    });
  });

  return card;
}

function toggleHabitDay(habitId, key, { focusDate = null } = {}) {
  const habit = state.habits.find((item) => item.id === habitId);
  const date = parseDateKey(key);
  if (!habit || !date) return;
  if (key > todayKey()) return;
  if (!habit.days.includes(date.getDay()) || key < habit.createdAt) return;

  const today = todayDate();
  const todayKeyValue = todayKey();
  const wasAllDone =
    key === todayKeyValue ? daySummary(state.habits, today).all : false;

  const completed = toggleHabitRecord(habit, key);
  const saved = saveStoredHabits(state.habits);
  if (!saved) {
    showToast("Não foi possível salvar. Verifique o armazenamento do navegador.");
  }

  const isAllDone =
    key === todayKeyValue ? daySummary(state.habits, today).all : false;

  renderToday({ focusHabitId: habitId, focusDate });

  if (state.activeView === "progresso") renderProgress();
  if (state.activeView === "ajustes") renderSettingsState();

  try {
    if (navigator.vibrate) navigator.vibrate(completed ? 12 : 8);
  } catch (error) {
    /* vibração é opcional */
  }

  if (completed && key === todayKeyValue && isAllDone && !wasAllDone) {
    celebrate();
    return;
  }

  const when =
    key === todayKeyValue
      ? "hoje"
      : `em ${WEEKDAY_SHORT[date.getDay()]}, ${formatShortDate(date)}`;
  showToast(
    completed
      ? `${habit.name} concluído ${when}.`
      : `${habit.name} desmarcado ${when}.`
  );
}

function celebrate() {
  showToast("Dia completo! Todos os hábitos de hoje foram feitos. 🎉", {
    duration: 3600,
  });

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (reducedMotion) return;

  try {
    if (navigator.vibrate) navigator.vibrate([12, 40, 12]);
  } catch (error) {
    /* opcional */
  }

  const colors = ["#6c5ce7", "#3ddc97", "#ffb020", "#ff6b8a", "#4ea8ff", "#ffd166"];
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 26; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${8 + Math.random() * 84}%`;
    piece.style.setProperty("--w", `${5 + Math.random() * 6}px`);
    piece.style.setProperty("--h", `${8 + Math.random() * 7}px`);
    piece.style.setProperty("--c", colors[index % colors.length]);
    piece.style.setProperty("--dur", `${1.6 + Math.random() * 1.1}s`);
    piece.style.setProperty("--delay", `${Math.random() * 0.25}s`);
    piece.style.setProperty("--drift", `${-70 + Math.random() * 140}px`);
    piece.style.setProperty("--spin", `${360 + Math.random() * 720}deg`);
    fragment.append(piece);
  }
  dom.confettiLayer.replaceChildren(fragment);
  window.setTimeout(() => dom.confettiLayer.replaceChildren(), 3000);
}

/* ---------- Tela Progresso ---------- */
function renderProgress() {
  const today = todayDate();
  const start = addDays(today, -29);
  let totalScheduled = 0;
  let totalDone = 0;

  for (const habit of state.habits) {
    const stats = habitCompletion(habit, start, today);
    totalScheduled += stats.total;
    totalDone += stats.done;
  }

  const rate = totalScheduled
    ? Math.round((totalDone / totalScheduled) * 100)
    : 0;

  dom.statRate.textContent = String(rate);
  dom.statRateBar.style.width = `${rate}%`;
  dom.statStreak.textContent = String(currentStreak(state.habits));
  dom.statBest.textContent = String(bestStreak(state.habits));
  dom.statCheckins.textContent = totalCheckins(state.habits).toLocaleString(
    "pt-BR"
  );

  renderWeekChart(today);
  renderHeatmap(today);
  renderBreakdown(start, today);
  dom.progressEmpty.hidden = state.habits.length > 0;
}

function renderWeekChart(today) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const fragment = document.createDocumentFragment();
  const ariaParts = [];
  let totalScheduled = 0;
  let totalDone = 0;
  const todayKeyValue = todayKey();

  for (const day of days) {
    const key = dateKey(day);
    const info = daySummary(state.habits, day);
    totalScheduled += info.total;
    totalDone += info.done;
    const percent = info.total
      ? Math.round((info.done / info.total) * 100)
      : null;
    const isToday = key === todayKeyValue;

    const column = createElement(
      "div",
      `chart-col${isToday ? " is-today" : ""}`
    );
    const value = createElement(
      "span",
      "chart-value",
      percent === null ? "—" : `${percent}%`
    );

    const wrap = createElement("div", "chart-bar-wrap");
    const bar = createElement("div", "chart-bar");
    if (percent === null || percent === 0) bar.classList.add("chart-bar--zero");
    if (isToday && percent !== null) bar.classList.add("chart-bar--today");
    bar.style.height = percent ? `${percent}%` : "3px";
    bar.title =
      percent === null
        ? "Sem hábitos agendados"
        : `${info.done} de ${info.total} hábitos concluídos`;
    wrap.append(bar);

    const dayLabel = createElement("div", "chart-day");
    const dayName = createElement("strong", "", WEEKDAY_SHORT[day.getDay()]);
    const dayNumber = createElement("span", "", String(day.getDate()));
    dayLabel.append(dayName, dayNumber);
    column.append(value, wrap, dayLabel);
    fragment.append(column);

    ariaParts.push(
      `${WEEKDAY_FULL[day.getDay()]}, ${formatShortDate(day)}: ${
        percent === null
          ? "sem hábitos agendados"
          : `${info.done} de ${info.total} concluídos`
      }`
    );
  }

  dom.weekChart.replaceChildren(fragment);
  dom.weekChart.setAttribute(
    "aria-label",
    `Gráfico dos últimos sete dias. ${ariaParts.join("; ")}.`
  );

  const average = totalScheduled
    ? Math.round((totalDone / totalScheduled) * 100)
    : null;
  dom.weekAverage.textContent = average === null ? "—" : `${average}%`;
  dom.weekAverage.title = "Média de conclusão dos últimos 7 dias";
  dom.weekAverage.setAttribute(
    "aria-label",
    average === null
      ? "Sem hábitos agendados nos últimos 7 dias"
      : `Média de ${average}% de conclusão nos últimos 7 dias`
  );
}

function renderHeatmap(today) {
  const mondayThisWeek = getWeekDays(today)[0];
  const start = addDays(mondayThisWeek, -21);
  const todayKeyValue = todayKey();
  const fragment = document.createDocumentFragment();
  let activeDays = 0;
  let possible = 0;
  let completed = 0;

  for (let index = 0; index < 28; index += 1) {
    const day = addDays(start, index);
    const key = dateKey(day);
    const isFuture = key > todayKeyValue;
    const info = daySummary(state.habits, day);
    const cell = createElement("div", "heat-cell");

    if (!isFuture) {
      possible += info.total;
      completed += info.done;
      if (info.done > 0) activeDays += 1;
    }

    if (isFuture) {
      cell.classList.add("is-future");
      cell.title = `${formatShortDate(day)} — ainda por vir`;
    } else if (info.total === 0) {
      cell.classList.add("is-rest");
      cell.title = `${formatShortDate(day)} — dia de descanso`;
    } else {
      const level =
        info.done === 0
          ? 0
          : Math.min(4, Math.max(1, Math.ceil((info.done / info.total) * 4)));
      cell.dataset.level = String(level);
      cell.title = `${formatShortDate(day)} — ${info.done} de ${info.total} ${
        info.total === 1 ? "hábito" : "hábitos"
      }`;
    }

    if (key === todayKeyValue) cell.classList.add("is-today");
    cell.setAttribute("aria-hidden", "true");
    fragment.append(cell);
  }

  dom.heatmap.replaceChildren(fragment);
  dom.heatmap.setAttribute(
    "aria-label",
    state.habits.length
      ? `Mapa de calor das últimas quatro semanas: ${pluralize(
          activeDays,
          "dia com hábitos concluídos",
          "dias com hábitos concluídos"
        )} e ${completed} de ${possible} conclusões possíveis.`
      : "Mapa de calor vazio. Crie um hábito para começar."
  );
  dom.heatmapCaption.textContent = activeDays
    ? pluralize(activeDays, "dia ativo", "dias ativos")
    : "Comece hoje";
}

function renderBreakdown(start, today) {
  const fragment = document.createDocumentFragment();
  dom.breakdown.setAttribute("role", "list");

  for (const habit of state.habits) {
    const stats = habitCompletion(habit, start, today);
    const checkins = Object.keys(habit.records).length;
    const row = createElement("div", "breakdown-row");
    row.setAttribute("role", "listitem");
    row.style.setProperty("--row-color", COLORS[habit.color].hex);

    const head = createElement("div", "breakdown-head");
    head.append(createElement("span", "breakdown-emoji", habit.emoji));

    const info = createElement("div", "breakdown-info");
    info.append(
      createElement("p", "breakdown-name", habit.name),
      createElement(
        "p",
        "breakdown-meta",
        `${scheduleLabel(habit.days)} · ${pluralize(
          checkins,
          "check-in",
          "check-ins"
        )}`
      )
    );

    head.append(
      info,
      createElement(
        "span",
        "breakdown-pct",
        stats.rate === null ? "—" : `${stats.rate}%`
      )
    );

    const bar = createElement("div", "breakdown-bar");
    if (stats.rate !== null) {
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-valuenow", String(stats.rate));
      bar.setAttribute(
        "aria-label",
        `Conclusão de ${habit.name} nos últimos 30 dias`
      );
    } else {
      bar.setAttribute(
        "aria-label",
        `${habit.name} não tinha dias agendados nos últimos 30 dias`
      );
    }
    const fill = document.createElement("span");
    fill.style.width = `${stats.rate || 0}%`;
    bar.append(fill);
    row.append(head, bar);
    fragment.append(row);
  }

  dom.breakdown.replaceChildren(fragment);
}

/* ---------- Navegação e configurações ---------- */
function renderSettingsState() {
  dom.appVersion.textContent = `v${APP_VERSION}`;
  updateThemeUI();
  updateInstallUI();
  updateOnlineUI();
}

function showView(name, { initial = false } = {}) {
  const view = VIEWS.includes(name) ? name : "hoje";
  const changed = state.activeView !== view;
  state.activeView = view;

  for (const key of VIEWS) {
    dom.views[key].hidden = key !== view;
  }
  dom.navItems.forEach((item) => {
    if (item.dataset.nav === view) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
  dom.fab.hidden = view !== "hoje";

  if (view === "hoje") renderToday();
  else if (view === "progresso") renderProgress();
  else renderSettingsState();

  document.title = `${VIEW_TITLES[view]} · Ritmo`;
  if (changed && !initial) window.scrollTo({ top: 0, behavior: "auto" });
}

/* ---------- Formulário de hábito ---------- */
function setSelectedDays(days) {
  const selected = new Set(normalizeDays(days));
  dom.dayButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(selected.has(Number(button.dataset.day)))
    );
  });
  clearDaysError();
}

function getSelectedDays() {
  return normalizeDays(
    dom.dayButtons
      .filter((button) => button.getAttribute("aria-pressed") === "true")
      .map((button) => Number(button.dataset.day))
  );
}

function setColor(color) {
  const target =
    dom.colorInputs.find((input) => input.value === color) ||
    dom.colorInputs[0];
  if (target) target.checked = true;
}

function updateEmojiSelection(value) {
  dom.emojiButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.emoji === value)
    );
  });
}

function updateNameCounter() {
  dom.nameCount.textContent = `${dom.habitName.value.length}/${MAX_NAME_LENGTH}`;
}

function showNameError(message) {
  dom.nameField.classList.add("has-error");
  dom.nameError.textContent = message;
  dom.nameError.hidden = false;
}

function clearNameError() {
  dom.nameField.classList.remove("has-error");
  dom.nameError.hidden = true;
}

function showDaysError(message) {
  dom.daysField.classList.add("has-error");
  dom.daysError.textContent = message;
  dom.daysError.hidden = false;
}

function clearDaysError() {
  dom.daysField.classList.remove("has-error");
  dom.daysError.hidden = true;
}

function clearFormErrors() {
  clearNameError();
  clearDaysError();
}

function openHabitDialog({ habit = null, days = null } = {}) {
  state.editingHabitId = habit ? habit.id : null;
  dom.habitForm.reset();

  const selectedDays =
    habit && Array.isArray(habit.days) && habit.days.length
      ? habit.days
      : Array.isArray(days) && days.length
        ? days
        : [0, 1, 2, 3, 4, 5, 6];
  setSelectedDays(selectedDays);

  const emoji = habit ? habit.emoji : "💧";
  dom.habitEmoji.value = emoji;
  updateEmojiSelection(emoji);
  setColor(habit ? habit.color : "violet");
  dom.habitName.value = habit ? habit.name : "";
  updateNameCounter();
  clearFormErrors();

  dom.habitDialogEyebrow.textContent = habit ? "Editar hábito" : "Novo hábito";
  dom.habitDialogTitle.textContent = habit
    ? "Ajuste seu hábito"
    : "O que quer cultivar?";
  dom.saveHabitBtn.textContent = habit ? "Salvar alterações" : "Criar hábito";

  openDialog(dom.habitDialog);

  if (window.matchMedia("(pointer: fine)").matches) {
    window.setTimeout(() => {
      dom.habitName.focus();
      dom.habitName.select();
    }, 80);
  }
}

function submitHabitForm(event) {
  event.preventDefault();

  const name = cleanName(dom.habitName.value);
  const days = getSelectedDays();
  let valid = true;

  if (!name) {
    showNameError("Dê um nome ao seu hábito.");
    valid = false;
  } else {
    clearNameError();
  }

  if (!days.length) {
    showDaysError("Escolha pelo menos um dia da semana.");
    valid = false;
  } else {
    clearDaysError();
  }

  if (!valid) {
    if (!name) dom.habitName.focus();
    return;
  }

  const checkedColor = dom.colorInputs.find((input) => input.checked);
  const color =
    checkedColor && COLORS[checkedColor.value] ? checkedColor.value : "violet";
  const emoji = cleanEmoji(dom.habitEmoji.value, "⭐");
  const editingId = state.editingHabitId;
  const existing = editingId
    ? state.habits.find((habit) => habit.id === editingId)
    : null;

  if (existing) {
    existing.name = name;
    existing.emoji = emoji;
    existing.color = color;
    existing.days = days;
  } else {
    state.habits.push({
      id: uid(),
      name,
      emoji,
      color,
      days,
      createdAt: todayKey(),
      records: {},
    });
  }

  const saved = saveStoredHabits(state.habits);
  closeDialog(dom.habitDialog);
  refreshDataViews();
  showToast(
    saved
      ? existing
        ? "Hábito atualizado."
        : "Hábito criado! Um passo de cada vez."
      : "Hábito atualizado nesta sessão, mas não foi possível salvar."
  );
}

/* ---------- Opções do hábito ---------- */
function openOptions(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;
  state.optionsHabitId = habit.id;
  dom.optionsEmoji.textContent = habit.emoji;
  dom.optionsTitle.textContent = habit.name;
  dom.optionsTitle.title = habit.name;
  openDialog(dom.optionsDialog);
}

function askDeleteHabit() {
  const habit = state.habits.find((item) => item.id === state.optionsHabitId);
  if (!habit) return;
  closeDialog(dom.optionsDialog);
  openConfirm({
    title: `Excluir “${habit.name}”?`,
    message:
      "Todo o histórico deste hábito será removido. Essa ação não pode ser desfeita.",
    confirmLabel: "Excluir hábito",
    danger: true,
    onConfirm: () => {
      state.habits = state.habits.filter((item) => item.id !== habit.id);
      saveStoredHabits(state.habits);
      refreshDataViews();
      showToast("Hábito excluído.");
    },
  });
}

/* ---------- Confirmação ---------- */
function openConfirm({
  title,
  message,
  confirmLabel = "Confirmar",
  danger = true,
  onConfirm = null,
}) {
  dom.confirmTitle.textContent = title;
  dom.confirmMessage.textContent = message;
  dom.confirmAction.textContent = confirmLabel;
  dom.confirmAction.classList.toggle("btn-danger", danger);
  dom.confirmAction.classList.toggle("btn-primary", !danger);
  dom.confirmIcon.classList.toggle("is-info", !danger);
  dom.confirmIcon.textContent = danger ? "!" : "?";
  state.pendingConfirm = typeof onConfirm === "function" ? onConfirm : null;
  openDialog(dom.confirmDialog);
}

/* ---------- Boas-vindas e dados ---------- */
function openWelcomeIfNeeded(wantsNewHabit = false) {
  if (state.habits.length > 0) return false;
  if (isOnboarded()) return false;
  if (viewFromHash() !== "hoje") return false;

  state.pendingNewHabit = wantsNewHabit;
  window.setTimeout(() => {
    if (state.habits.length > 0) return;
    if (document.querySelector("dialog[open]")) return;
    openDialog(dom.welcomeDialog);
  }, 420);
  return true;
}

function startEmpty() {
  const wantsNewHabit = state.pendingNewHabit;
  closeDialog(dom.welcomeDialog);
  markOnboarded();
  if (wantsNewHabit) {
    window.setTimeout(() => openHabitDialog(), 160);
  }
}

function startWithExamples() {
  state.pendingNewHabit = false;
  closeDialog(dom.welcomeDialog);
  markOnboarded();
  if (state.habits.length > 0) return;
  state.habits = createDemoHabits();
  saveStoredHabits(state.habits);
  refreshDataViews();
  showToast(
    "Hábitos de exemplo criados. Edite ou exclua quando quiser.",
    { duration: 3600 }
  );
}

function exportBackup() {
  const payload = {
    app: "ritmo",
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: state.habits,
    settings: state.settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ritmo-backup-${todayKey()}.json`;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  showToast("Backup exportado.");
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    if (typeof file.text === "function") {
      file.text().then(resolve, reject);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Falha ao ler o arquivo."));
    reader.readAsText(file);
  });
}

async function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) return;

  if (file.size > 1_500_000) {
    showToast("Esse arquivo é muito grande para importar.");
    return;
  }

  try {
    const text = await readFileText(file);
    const payload = JSON.parse(text);
    const rawHabits = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.habits)
        ? payload.habits
        : null;
    if (!rawHabits) throw new Error("Formato de backup inválido.");

    if (rawHabits.length > 300) {
      showToast("O backup contém hábitos demais.");
      return;
    }

    const habits = rawHabits
      .map((item) => normalizeHabit(item, { regenerateId: true }))
      .filter(Boolean);
    if (!habits.length) {
      showToast("Nenhum hábito válido foi encontrado nesse backup.");
      return;
    }

    const theme = VALID_THEMES.includes(payload?.settings?.theme)
      ? payload.settings.theme
      : null;
    const currentCount = state.habits.length;
    const replacing = currentCount > 0;
    const validLabel = pluralize(
      habits.length,
      "hábito válido",
      "hábitos válidos"
    );
    const importMessage = replacing
      ? `${validLabel} ${habits.length === 1 ? "vai" : "vão"} substituir ${pluralize(
          currentCount,
          "hábito atual",
          "hábitos atuais"
        )}. O histórico do arquivo será restaurado.`
      : `${validLabel} ${
          habits.length === 1 ? "será adicionado" : "serão adicionados"
        }. O histórico do arquivo será restaurado.`;

    openConfirm({
      title: replacing ? "Substituir seus dados?" : "Importar backup?",
      message: importMessage,
      confirmLabel: "Importar backup",
      danger: replacing,
      onConfirm: () => {
        state.habits = habits;
        saveStoredHabits(state.habits);
        if (theme) {
          applyTheme(theme, { persist: true });
        }
        refreshDataViews();
        showToast("Backup importado com sucesso!");
      },
    });
  } catch (error) {
    console.warn("Ritmo: backup inválido.", error);
    showToast("Não foi possível ler esse backup. Verifique o arquivo.");
  }
}

function resetAllData() {
  openConfirm({
    title: "Apagar todos os dados?",
    message: `Isso vai remover ${pluralize(
      state.habits.length,
      "hábito",
      "hábitos"
    )} e todo o histórico deste dispositivo. Não dá para desfazer.`,
    confirmLabel: "Apagar tudo",
    danger: true,
    onConfirm: () => {
      state.habits = [];
      clearStoredHabits();
      refreshDataViews();
      showToast("Seus dados foram apagados.");
    },
  });
}

/* ---------- PWA / atualizações ---------- */
function showUpdateBanner() {
  dom.updateBanner.hidden = false;
}

function applyUpdate() {
  const waiting = state.swRegistration?.waiting;
  dom.updateBanner.hidden = true;

  if (!waiting) {
    window.location.reload();
    return;
  }

  state.reloadingForUpdate = true;
  waiting.postMessage({ type: "SKIP_WAITING" });
  window.setTimeout(() => {
    if (state.reloadingForUpdate) window.location.reload();
  }, 3000);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    state.swReady = false;
    updateOnlineUI();
    return;
  }

  navigator.serviceWorker
    .register("./sw.js")
    .then((registration) => {
      state.swRegistration = registration;

      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateBanner();
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdateBanner();
          }
        });
      });

      navigator.serviceWorker.ready
        .then(() => {
          state.swReady = true;
          updateOnlineUI();
        })
        .catch(() => {
          state.swReady = false;
          updateOnlineUI();
        });
    })
    .catch((error) => {
      console.warn("Ritmo: service worker não registrado.", error);
      state.swReady = false;
      updateOnlineUI();
    });
}

/* ---------- Eventos ---------- */
function setupStaticEvents() {
  dom.themeToggle.addEventListener("click", () => {
    const next = dom.html.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next, { persist: true });
  });

  dom.themeOptions.forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.themeChoice;
      if (VALID_THEMES.includes(choice)) applyTheme(choice, { persist: true });
    });
  });

  window.addEventListener("hashchange", () => {
    showView(viewFromHash());
  });

  dom.fab.addEventListener("click", () => openHabitDialog());
  dom.emptyCreate.addEventListener("click", () => openHabitDialog());
  dom.emptySample.addEventListener("click", startWithExamples);
  dom.restCreate.addEventListener("click", () =>
    openHabitDialog({ days: [todayDate().getDay()] })
  );
  dom.progressCreate.addEventListener("click", () => openHabitDialog());

  dom.exportBtn.addEventListener("click", exportBackup);
  dom.importBtn.addEventListener("click", () => dom.importFile.click());
  dom.importFile.addEventListener("change", handleImportFile);
  dom.resetBtn.addEventListener("click", resetAllData);

  dom.installTop.addEventListener("click", handleInstallClick);
  dom.installSettings.addEventListener("click", handleInstallClick);
  dom.updateButton.addEventListener("click", applyUpdate);

  dom.welcomeStart.addEventListener("click", startEmpty);
  dom.welcomeDemo.addEventListener("click", startWithExamples);

  dom.habitForm.addEventListener("submit", submitHabitForm);
  dom.habitName.addEventListener("input", () => {
    updateNameCounter();
    if (cleanName(dom.habitName.value)) clearNameError();
  });

  dom.dayButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(next));
      clearDaysError();
    });
  });

  dom.quickDays.addEventListener("click", (event) => {
    const target = event.target.closest("[data-days-preset]");
    if (!target) return;
    if (target.dataset.daysPreset === "weekdays") {
      setSelectedDays([1, 2, 3, 4, 5]);
    } else {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    }
  });

  dom.emojiButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const emoji = button.dataset.emoji;
      dom.habitEmoji.value = emoji;
      updateEmojiSelection(emoji);
    });
  });

  dom.habitEmoji.addEventListener("input", () => {
    updateEmojiSelection(dom.habitEmoji.value.trim());
  });

  dom.habitEmoji.addEventListener("blur", () => {
    const emoji = cleanEmoji(dom.habitEmoji.value);
    if (emoji) {
      dom.habitEmoji.value = emoji;
      updateEmojiSelection(emoji);
    }
  });

  dom.editHabitBtn.addEventListener("click", () => {
    const habit = state.habits.find(
      (item) => item.id === state.optionsHabitId
    );
    closeDialog(dom.optionsDialog);
    if (habit) openHabitDialog({ habit });
  });

  dom.deleteHabitBtn.addEventListener("click", askDeleteHabit);

  dom.confirmAction.addEventListener("click", () => {
    const action = state.pendingConfirm;
    state.pendingConfirm = null;
    closeDialog(dom.confirmDialog);
    if (typeof action === "function") {
      try {
        action();
      } catch (error) {
        console.warn("Ritmo: ação não concluída.", error);
        showToast("Algo deu errado. Tente novamente.");
      }
    }
  });

  document.addEventListener("click", (event) => {
    const closer = event.target.closest("[data-close-dialog]");
    if (!closer) return;
    const dialog = closer.closest("dialog");
    if (dialog) closeDialog(dialog);
  });

  dom.dialogs.forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });

    dialog.addEventListener("close", () => {
      syncModalState();
      if (!dialog.open) {
        if (dialog === dom.confirmDialog) state.pendingConfirm = null;
        if (dialog === dom.habitDialog) state.editingHabitId = null;
        if (dialog === dom.optionsDialog) state.optionsHabitId = null;
        if (dialog === dom.welcomeDialog) state.pendingNewHabit = false;
      }
    });
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    updateInstallUI();
  });

  window.addEventListener("appinstalled", () => {
    state.deferredPrompt = null;
    state.installedThisSession = true;
    updateInstallUI();
    showToast("Ritmo instalado! Procure o ícone na tela inicial. 🎉");
  });

  window.addEventListener("online", () => {
    updateOnlineUI();
    showToast("Conexão restaurada. O Ritmo continua com você.");
  });

  window.addEventListener("offline", () => {
    updateOnlineUI();
    showToast("Sem internet? Sem problema. O Ritmo segue funcionando.");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const key = todayKey();
    if (key === state.lastDayKey) return;
    state.lastDayKey = key;
    updateDateHeader();
    refreshDataViews();
    showToast("Novo dia, novo ritmo. Bom te ver por aqui!");
  });

  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (state.reloadingForUpdate) window.location.reload();
  });

  registerServiceWorker();
}

/* ---------- Início ---------- */
function wantsNewHabitFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("action") === "new";
  } catch (error) {
    return false;
  }
}

function clearActionFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("action")) return;
    params.delete("action");
    const query = params.toString();
    const cleanUrl = `${window.location.pathname}${query ? `?${query}` : ""}${
      window.location.hash
    }`;
    window.history.replaceState(null, "", cleanUrl);
  } catch (error) {
    /* a URL não é essencial para o app funcionar */
  }
}

function init() {
  cacheDom();
  state.habits = loadStoredHabits();
  state.settings = loadStoredSettings();
  state.lastDayKey = todayKey();

  applyTheme(state.settings.theme);
  watchSystemTheme();
  setupStaticEvents();
  updateInstallUI();
  updateOnlineUI();

  const wantsNewHabit = wantsNewHabitFromUrl();
  if (wantsNewHabit) clearActionFromUrl();

  showView(viewFromHash(), { initial: true });

  const welcomeWillOpen = openWelcomeIfNeeded(wantsNewHabit);
  if (wantsNewHabit && !welcomeWillOpen) {
    window.setTimeout(() => {
      if (document.querySelector("dialog[open]")) {
        state.pendingNewHabit = true;
        return;
      }
      openHabitDialog();
    }, 180);
  }
}

init();




