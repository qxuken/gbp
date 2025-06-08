import Pocketbase, { LocalAuthStore } from 'pocketbase';

// Constants
const HOUR_MS = 3_600_000;
const DAY_MS = HOUR_MS * 24;

// Config
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL ?? '/';
const POCKETBASE_ADMIN_URL = POCKETBASE_URL + '_/';
const FONT_SIZE = 16;
const MARGIN = 50;
const PAGE_SIZE = 100;
const DATA_RANGE_DAYS = Math.min(7, (window.innerWidth - MARGIN * 2) / 100);

// Main canvas
/** @type {HTMLCanvasElement} */
const temporalCanvas = document.getElementById('temporal');
temporalCanvas.width = window.innerWidth;

// Temporal controls
/** @type {HTMLInputElement} */
const temporalFrom = document.getElementById('temporal-from');
if (!temporalFrom.value)
  setDateValue(temporalFrom, subDays(new Date(), DATA_RANGE_DAYS));
/** @type {HTMLInputElement} */
const temporalTo = document.getElementById('temporal-to');
if (!temporalTo.value) setDateValue(temporalTo, new Date());
/** @type {HTMLButtonElement} */
const temporalLoad = document.getElementById('temporal-load');

// PocketBase client
const authStore = new LocalAuthStore('__pb_superuser_auth__');
const pbClient = new Pocketbase(POCKETBASE_URL, authStore);
if (!authStore.isValid) location.href = POCKETBASE_ADMIN_URL;

// Queries
const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Global State
/**
 * @typedef {Object} DateRange
 * @property {Date} from
 * @property {Date} to
 */

class YCoord {
  /** @type {number} Min value in ms */
  #min;
  /** @type {number} Max value in ms */
  #max;
  /** @type {number} Size of plot */
  #height;

  /**
   * @type {number[] | null}
   */
  #labelsCache = null;
  /**
   * @type {WeakMap<number, number>}
   */
  #coordsCache = new WeakMap();

  /**
   * Takes range and calculates coordinate on a graph
   * @param {number} min
   * @param {number} max
   * @param {number} height
   */
  constructor(min, max, height) {
    this.#min = min;
    this.#max = max;
    this.#height = height - MARGIN * 2;
    console.debug({
      event: 'new YCoord',
      height: this.#height,
    });
  }

  /**
   * @returns {number[]}
   */
  getLabels() {
    if (this.#labelsCache) return this.#labelsCache;

    const labels = [];

    this.#labelsCache = labels;
    return labels;
  }

  /**
   * @param {Date} value
   * @returns {number} x coordinate
   */
  getCoord(value) {
    if (this.#coordsCache.has(value)) return this.#coordsCache.get(value);

    const coordinate = MARGIN;

    this.#coordsCache.set(value, coordinate);
    return coordinate;
  }
}

class XCoord {
  static STEP_HOURS = 12;
  static STEP_MS = XCoord.STEP_HOURS * HOUR_MS;

  /** @type {DateRange} Plot range */
  #range;
  /** @type {number} Range in ms */
  #totalMs;
  /** @type {number} Size of plot */
  #width;
  /** @type {number} Pixels per step */
  #step;
  /** @type {number} */
  #totalSteps;

  /**
   * @type {Date[] | null}
   */
  #labelsCache = null;
  /**
   * @type {WeakMap<Date, number>}
   */
  #coordsCache = new WeakMap();

  /**
   * Takes range and calculates coordinate on a graph
   * @param {DateRange} range
   * @param {number} width
   */
  constructor(range, width) {
    this.#range = range;
    this.#width = width - MARGIN * 2;
    this.#totalMs = range.to.getTime() - range.from.getTime();
    if (this.#totalMs <= 0) throw Error('Wrong range supplied');
    this.#totalSteps = Math.floor(this.#totalMs / XCoord.STEP_MS);
    this.#step = Math.floor(this.#width / this.#totalSteps);
    console.debug({
      event: 'new XCoord',
      width: this.#width,
      totalSteps: this.#totalSteps,
      step: this.#step,
    });
  }

  get step() {
    return this.#step;
  }

  /**
   * @returns {Date[]}
   */
  getLabels() {
    if (this.#labelsCache) return this.#labelsCache;

    const labels = [];
    if (this.#totalSteps <= 0) return labels;

    const current = new Date(this.#range.from);
    current.setUTCHours(
      current.getUTCHours() +
        XCoord.STEP_HOURS -
        (current.getUTCHours() % XCoord.STEP_HOURS),
      0,
      0,
      0,
    );

    while (current <= this.#range.to) {
      labels.push(new Date(current));
      current.setTime(current.getTime() + XCoord.STEP_MS);
    }
    this.#labelsCache = labels;
    return labels;
  }

  /**
   * @param {Date} value
   * @returns {number} x coordinate
   */
  getCoord(value) {
    if (this.#coordsCache.has(value)) return this.#coordsCache.get(value);

    if (this.#totalMs === 0) return 0;

    const valueMs = value.getTime() - this.#range.from.getTime();
    const ratio = valueMs / this.#totalMs;
    const coordinate = MARGIN + ratio * this.#width;

    this.#coordsCache.set(value, coordinate);
    return coordinate;
  }
}

/**
 * @typedef {Object} State
 * @property {boolean} isDark
 * @property {DateRange} range
 * @property {Array} items
 * @property {XCoord} xCoord
 */

let state = newState();
logState();

function logState() {
  console.debug({ event: 'update state', ...state });
}

/** @returns {State} */
function newState() {
  const range = {
    from: new Date(temporalFrom.value + 'Z'),
    to: new Date(temporalTo.value + 'Z'),
  };
  return {
    isDark: themeQuery.matches,
    items: [],
    range,
    xCoord: new XCoord(range, temporalCanvas.width),
  };
}

function updateStateRange() {
  const range = {
    from: new Date(temporalFrom.value + 'Z'),
    to: new Date(temporalTo.value + 'Z'),
  };
  state = {
    ...state,
    items: [],
    range: range,
    xCoord: new XCoord(range, temporalCanvas.width),
  };
  logState();
}

function updateStateTheme() {
  state = {
    ...state,
    isDark: themeQuery.matches,
  };
  logState();
}

function updateStateCanvasSize() {
  state = {
    ...state,
    xCoord: new XCoord(state.range, temporalCanvas.width),
  };
  logState();
}

// Listeners
window.addEventListener('DOMContentLoaded', () => {
  console.debug({ event: 'DOMContentLoaded' });
  requestAnimationFrame(() => {
    renderUI(state);
    loadEvents();
  });
});
window.addEventListener('resize', () => {
  console.debug({ event: 'resize' });
  temporalCanvas.width = window.innerWidth;
  updateStateCanvasSize();
  requestAnimationFrame(() => renderUI(state));
});
temporalLoad.addEventListener('click', () => {
  console.debug({ event: 'temporalLoad click' });
  updateStateRange();
  requestAnimationFrame(() => {
    renderUI(state);
    loadEvents();
  });
});
themeQuery.addEventListener('change', () => {
  console.debug({ event: 'themeQuery change' });
  updateStateTheme();
  requestAnimationFrame(() => renderUI(state));
});

// Data loading
async function loadEvents(page = 1) {
  console.debug({ event: 'loadEvents', page });
  const res = await pbClient.logs.getList(page, PAGE_SIZE, {
    filter: `data.auth != "_superusers" && created >= "${temporalFrom.value.replace('T', ' ')}Z" && created <= "${temporalTo.value.replace('T', ' ')}Z"`,
  });
  state = {
    ...state,
    items: [...state.items, ...res.items],
  };
  requestAnimationFrame(() => {
    renderUI(state);
    if (page < res.totalPages) {
      loadEvents(page + 1);
    }
  });
}

// UI rendering
/*
 * @param {State} state
 */
function renderUI(state) {
  console.debug({ event: 'renderUI' });
  const ctx = temporalCanvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas 2d context');

  ctx.clearRect(0, 0, temporalCanvas.width, temporalCanvas.height);

  const color = state.isDark ? '#ffffff' : '#000000';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.textRendering = 'optimizeLegibility';
  ctx.font = `${FONT_SIZE}px`;

  // draw y axis
  ctx.beginPath();
  ctx.moveTo(MARGIN, MARGIN);
  ctx.lineTo(MARGIN, temporalCanvas.height - MARGIN);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawXAxis(state, ctx);
}

/**
 * @param {State} state
 * @param {CanvasRenderingContext2D} ctx
 */
function drawXAxis(state, ctx) {
  const yCoord = temporalCanvas.height - MARGIN;
  const leftX = MARGIN;
  const rightX = temporalCanvas.width - MARGIN;

  ctx.beginPath();
  ctx.moveTo(leftX, yCoord);
  ctx.lineTo(rightX, yCoord);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const step = state.xCoord.step;
  const padTop = 2;
  let nextLabelAt = 0;
  for (let labelDate of state.xCoord.getLabels()) {
    const xCoord = state.xCoord.getCoord(labelDate);
    const rectHeight = 7;
    ctx.fillRect(xCoord, yCoord, 2, rectHeight);
    switch (labelDate.getUTCHours()) {
      case 0: {
        const textText = '12:00AM';
        const textMeasurements = ctx.measureText(textText);
        const textHalfWidth = textMeasurements.width / 2;
        const textXCoord = Math.floor(xCoord - textHalfWidth);
        if (textXCoord <= nextLabelAt) break;
        nextLabelAt = xCoord + textHalfWidth;
        ctx.fillText(
          textText,
          textXCoord,
          yCoord +
            rectHeight +
            Math.ceil(textMeasurements.hangingBaseline) +
            padTop,
          textMeasurements.width,
        );

        const dateText = `[${labelDate.getUTCDate().toString().padStart(2, '0')}-${labelDate.getUTCMonth().toString().padStart(2, '0')}]`;
        const dateMeasurements = ctx.measureText(dateText);
        ctx.fillText(
          dateText,
          Math.floor(xCoord - dateMeasurements.width / 2),
          yCoord +
            rectHeight +
            Math.ceil(textMeasurements.hangingBaseline) +
            Math.ceil(dateMeasurements.hangingBaseline) +
            padTop * 2,

          dateMeasurements.width,
        );

        break;
      }
      case 12: {
        if (step < 50) break;
        const text = `12:00PM`;
        const textMeasurements = ctx.measureText(text);
        const textHalfWidth = textMeasurements.width / 2;
        const textXCoord = Math.floor(xCoord - textHalfWidth);
        if (textXCoord <= nextLabelAt) break;
        nextLabelAt = xCoord + textHalfWidth;
        ctx.fillText(
          text,
          textXCoord,
          yCoord +
            rectHeight +
            Math.ceil(textMeasurements.hangingBaseline) +
            padTop,
          textMeasurements.width,
        );
        break;
      }
    }
  }
}

// Utils
/**
 * @param {Date} date
 * @param {number} days - Days to subtruct
 * @returns {Date} New date
 */
function subDays(date, days) {
  let d = new Date(date);
  d.setTime(d.getTime() - days * DAY_MS);
  return d;
}

/**
 * @param {HTMLInputElement} element
 * @param {Date} date
 */
function setDateValue(element, date) {
  const isoString = date.toISOString();
  element.value = isoString.substring(0, isoString.indexOf('T') + 6);
}

// DEBUG
window.POCKETBASE_URL = POCKETBASE_URL;
window.POCKETBASE_ADMIN_URL = POCKETBASE_ADMIN_URL;
window.FONT_SIZE = FONT_SIZE;
window.MARGIN = MARGIN;
window.PAGE_SIZE = PAGE_SIZE;
window.DATA_RANGE_DAYS = DATA_RANGE_DAYS;
window.G = state;
window.XCoord = XCoord;
window.renderUI = renderUI;
window.subDays = subDays;
window.setDateValue = setDateValue;
