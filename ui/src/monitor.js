import Pocketbase, { LocalAuthStore } from 'pocketbase';

// Constants
const HOUR_MS = 3_600_000;
const DAY_MS = HOUR_MS * 24;
const DPR = window.devicePixelRatio || 1;

// Config
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL ?? '/';
const POCKETBASE_ADMIN_URL = POCKETBASE_URL + '_/';
const FONT_SIZE = 10;
const MARGIN = 40;
const PAGE_SIZE = 100;
const UPPER_BOUNDS_MS = 13_000;
const DATA_RANGE_DAYS = Math.min(7, (window.innerWidth - MARGIN * 2) / 100);

// Main canvas
/** @type {HTMLCanvasElement} */
const temporalCanvas = document.getElementById('temporal');
const temporalCssHeight = temporalCanvas.getBoundingClientRect().height;
const tCtx = temporalCanvas.getContext('2d');
if (!tCtx) throw new Error('Cannot get canvas 2d context');
const temporalCssWidth = updateCanvas();

function updateCanvas() {
  const temporalCssWidth = window.innerWidth;
  temporalCanvas.width = Math.round(temporalCssWidth * DPR);
  temporalCanvas.height = Math.round(temporalCssHeight * DPR);
  temporalCanvas.style.width = temporalCssWidth + 'px';
  temporalCanvas.style.height = temporalCssHeight + 'px';
  tCtx.scale(DPR, DPR);
  return temporalCssWidth;
}

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
const pb = new Pocketbase(POCKETBASE_URL, authStore);
if (!authStore.isValid) location.href = POCKETBASE_ADMIN_URL;

// Queries
const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Global State
/**@typedef {Object} DateRange
 * @property {Date} from
 * @property {Date} to
 */

class YCoord {
  /** @type {number} Max value in ms */
  #max;
  /** @type {number} Size of plot */
  #height;

  /** @type {number[] | null} */
  #labelsCache = null;
  /** @type {Map<number, number>} */
  #coordsCache = new Map();

  /**@param {number} max
   * @param {number} height
   */
  constructor(max, height) {
    this.#max = max;
    this.#height = height - MARGIN * 2;
    console.debug({
      event: 'new YCoord',
      max: this.#max,
      height: this.#height,
    });
  }

  get max() {
    return this.#max;
  }

  static TICKS = 9;

  /** @returns {number[]} */
  getLabels() {
    if (this.#labelsCache) return this.#labelsCache;
    const labels = [0];

    for (let i = 1; i <= YCoord.TICKS; i++) {
      labels.push(i * 0.1);
    }

    const totalSteps = Math.floor(Math.log10(this.#max));
    main: for (let i = 0; i <= totalSteps; i++) {
      const step = 10 ** i;
      for (let j = 1; j <= YCoord.TICKS; j++) {
        let label = j * step;
        if (label > this.#max) break main;
        labels.push(label);
      }
    }

    this.#labelsCache = labels;
    return labels;
  }

  /**@param {number} value
   * @returns {number} */
  getCoord(value) {
    if (value <= 0) return this.#height + MARGIN;
    if (this.#coordsCache.has(value)) return this.#coordsCache.get(value);

    // Use a small offset to avoid log(0)
    const minValue = 0.1;
    const maxLog = Math.log10(this.#max);
    const minLog = Math.log10(minValue);
    const valueLog = Math.log10(value);

    // Reserve small portion of scale for 0 to 0.1 range
    const zeroRange = this.#height * 0.05;
    const logRange = this.#height - zeroRange;

    if (value < minValue) {
      const ratio = value / minValue;
      const coordinate = this.#height + MARGIN - ratio * zeroRange;
      this.#coordsCache.set(value, coordinate);
      return coordinate;
    }

    const ratio = (valueLog - minLog) / (maxLog - minLog);
    const coordinate = this.#height + MARGIN - zeroRange - ratio * logRange;

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

  /** @type {Date[] | null} */
  #labelsCache = null;
  /** @type {WeakMap<Date, number>} */
  #coordsCache = new WeakMap();

  /**@param {DateRange} range
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

  /** @returns {Date[]} */
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

  /**@param {Date} value
   * @returns {number}
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

/**@typedef {Object} HSLColor
 * @property {number} h
 * @property {number} s
 * @property {number} l
 */
/**@typedef {Object} ColorCacheItem
 * @property {string} base
 * @property {string} create
 * @property {string} update
 * @property {string} delete
 * @property {string} view
 * @property {string} list
 */
class ColorGenerator {
  /** @type {Map<string, ColorCacheItem>} */
  #colorCache = new Map();

  /**@param {string} entry
   * @param {'base' | 'create' | 'update' | 'delete' | 'view' | 'list'} [variant]
   * @returns {string}
   */
  getColor(entry, variant = 'base') {
    let cache = this.#colorCache.get(entry);
    if (!cache) {
      cache = this.#generateUniqueColors(entry);
      this.#colorCache.set(entry, cache);
    }
    return cache[variant];
  }

  /**
   * Generate a stable hash using FNV-1a algorithm
   * @param {string} str
   * @returns {number} Hash value between 0 and 1
   */
  #stringToHash(str) {
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash *= 16777619; // FNV prime
      hash = hash >>> 0; // Convert to unsigned 32-bit
    }
    return hash / 4294967296; // Normalize to 0-1
  }

  /**
   * Generate stable values with different seeds for variety
   * @param {string} str
   * @param {number} seed
   * @returns {number}
   */
  #seededValue(str, seed) {
    return this.#stringToHash(str + ':' + seed);
  }

  /**
   * @param {string} entry
   * @returns {ColorCacheItem}
   */
  #generateUniqueColors(entry) {
    // Generate stable values based on the entry string
    const hue = Math.floor(this.#seededValue(entry, 'hue') * 360);
    const saturation = 45 + this.#seededValue(entry, 'sat') * 35; // 45-80%
    const lightness = 25 + this.#seededValue(entry, 'light') * 30; // 25-55%

    const baseColor = {
      h: hue,
      s: saturation,
      l: lightness,
    };

    return {
      base: this.#hslToHex(baseColor),
      create: this.#hslToHex({
        h: baseColor.h,
        s: Math.min(100, baseColor.s + 15),
        l: Math.min(70, baseColor.l + 10),
      }),
      update: this.#hslToHex({
        h: (baseColor.h + 30) % 360,
        s: baseColor.s,
        l: baseColor.l,
      }),
      delete: this.#hslToHex({
        h: baseColor.h,
        s: Math.max(30, baseColor.s - 10),
        l: Math.max(20, baseColor.l - 20),
      }),
      view: this.#hslToHex({
        h: baseColor.h,
        s: Math.max(20, baseColor.s - 20),
        l: Math.min(80, baseColor.l + 20),
      }),
      list: this.#hslToHex({
        h: baseColor.h,
        s: Math.max(15, baseColor.s - 30),
        l: Math.min(85, baseColor.l + 25),
      }),
    };
  }

  /**@param {HSLColor} color
   * @returns {string}
   */
  #hslToHex({ h, s, l }) {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const a = sNorm * Math.min(lNorm, 1 - lNorm);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
}

class CoordHinter {
  /** @type {number} */
  #width;
  /** @type {number} */
  #height;
  /** @type {number} */
  #gridWidth;
  /** @type {number} */
  #gridHeight;
  /** @type {Set<string>[]} */
  #lookupGrid;

  static GRID_SIZE_PX = 2;

  /**@param {number} height
   * @param {number} width
   */
  constructor(height, width) {
    this.#height = height;
    this.#width = width;
    this.#gridHeight = height / CoordHinter.GRID_SIZE_PX;
    this.#gridWidth = width / CoordHinter.GRID_SIZE_PX;
    this.#lookupGrid = new Array(this.#gridHeight * this.#gridWidth)
      .fill(0)
      .map(() => new Set());
  }

  /**@param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Grid cell index
   * @private
   */
  #getGridIndex(x, y) {
    const gridX = Math.floor(x / CoordHinter.GRID_SIZE_PX);
    const gridY = Math.floor(y / CoordHinter.GRID_SIZE_PX);
    return gridY * this.#gridWidth + gridX;
  }

  /**@param {number} x
   * @param {number} y
   * @param {string} entry
   */
  addItem(x, y, entry) {
    const gridI = this.#getGridIndex(x, y);
    // console.log({ x, y, gridI });
    if (0 <= gridI && gridI < this.#lookupGrid.length) {
      this.#lookupGrid[gridI].add(entry);
    } else {
      console.warn({
        label: 'CoordHinter:addItem:index out of bounds',
        x,
        y,
        gridI,
      });
    }
  }

  /**@param {number} x
   * @param {number} y
   * @param {number} [radius]
   * @returns {Set<string>}
   */
  getEntries(x, y, radius = 10) {
    let res = new Set();

    const minGridX = Math.max(0, Math.floor(x - radius));
    const maxGridX = Math.min(this.#width - 1, Math.floor(x + radius));
    const minGridY = Math.max(0, Math.floor(y - radius));
    const maxGridY = Math.min(this.#height - 1, Math.floor(y + radius));

    for (let gridY = minGridY; gridY <= maxGridY; gridY++) {
      for (let gridX = minGridX; gridX <= maxGridX; gridX++) {
        const gridI = this.#getGridIndex(gridX, gridY);
        const entry = this.#lookupGrid[gridI];
        res = res.union(entry);
      }
    }

    return res;
  }
}

/**@typedef {Object} LogItem
 * @property {string} id
 * @property {Date} ts
 * @property {number} execTime
 * @property {number} status
 * @property {LogPath} path
 * @property {string} color
 */

/**@typedef {Object} State
 * @property {boolean} isDark
 * @property {number} width
 * @property {number} width
 * @property {DateRange} range
 * @property {LogItem[]} items
 * @property {XCoord} xCoord
 * @property {YCoord} yCoord
 * @property {ColorGenerator} colors
 * @property {CoordHinter} coordHinter
 * @property {{x: number, y: number} | null} mouseCoord
 * @property {Map<string, import('pocketbase').CollectionModel} collections
 */

let state = newState(temporalCssHeight, temporalCssWidth);
logState();

function logState() {
  console.debug({ event: 'update state', ...state });
}

/**
 * @param {number} height
 * @param {number} width
 * @returns {State}
 */
function newState(height, width) {
  const range = {
    from: new Date(temporalFrom.value + 'Z'),
    to: new Date(temporalTo.value + 'Z'),
  };
  return {
    isDark: themeQuery.matches,
    items: [],
    height,
    width,
    range,
    xCoord: new XCoord(range, width),
    yCoord: new YCoord(UPPER_BOUNDS_MS, height),
    colors: new ColorGenerator(),
    coordHinter: new CoordHinter(height, width),
    mouseCoord: null,
    collections: new Map(),
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
    xCoord: new XCoord(range, state.width),
    yCoord: new YCoord(UPPER_BOUNDS_MS, state.height),
    coordHinter: new CoordHinter(state.height, state.width),
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

/**
 * @param {number} height
 * @param {number} width
 */
function updateStateCanvasSize(height, width) {
  state = {
    ...state,
    height,
    width,
    xCoord: new XCoord(state.range, width),
    yCoord: new YCoord(state.yCoord.max, height),
    coordHinter: new CoordHinter(height, width),
  };
  logState();
}

/**
 * @param {{x: number, y: number} | null} pos
 */
function updateStateMousePosition(pos) {
  state = {
    ...state,
    mouseCoord: pos,
  };
  logState();
}

/**
 * @param {LogItem[]} items
 */
function updateStatePushItems(items) {
  const max = items.reduce(
    (max, it) => Math.max(max, it.execTime),
    state.yCoord.max,
  );
  state = {
    ...state,
    items: [...state.items, ...items],
    yCoord:
      state.yCoord.max !== max ? new YCoord(max, state.height) : state.yCoord,
  };
  logState();
}

// Listeners
window.addEventListener('DOMContentLoaded', () => {
  console.debug({ event: 'DOMContentLoaded' });
  requestAnimationFrame(async () => {
    renderUI(state);
    await loadCollections();
    await loadEvents();
  });
});
window.addEventListener('resize', () => {
  console.debug({ event: 'resize' });
  const width = updateCanvas();
  updateStateCanvasSize(temporalCssHeight, width);
  requestAnimationFrame(() => renderUI(state));
});
temporalCanvas.addEventListener('mousemove', (e) => {
  const rect = temporalCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  updateStateMousePosition({ x, y });
  requestAnimationFrame(() => renderUI(state));
});
temporalCanvas.addEventListener('mouseleave', () => {
  updateStateMousePosition(null);
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
async function loadCollections() {
  const items = await pb.collections.getFullList();
  state.collections = items.reduce((map, it) => {
    map.set(it.id, it);
    map.set(it.name, it);
    return map;
  }, new Map());
}

async function loadEvents(page = 1) {
  console.debug({ event: 'loadEvents', page });
  const res = await pb.logs.getList(page, PAGE_SIZE, {
    filter: `data.auth != "_superusers" && data.type = "request" && created >= "${state.range.from.toISOString().replace('T', ' ')}" && created <= "${state.range.to.toISOString().replace('T', ' ')}"`,
  });
  const items = res.items
    .filter(
      (it) => it.data?.type == 'request' && typeof it.data.execTime == 'number',
    )
    .map((it) => {
      const path = urlFormatter(it.data.method, it.data.url);
      const color = state.colors.getColor(
        path.type == 'custom' ? path.url : path.collection,
        path.type == 'file'
          ? 'base'
          : path.type == 'collection'
            ? path.action
            : 'base',
      );
      /** @type {LogItem} */
      return {
        id: it.id,
        ts: new Date(it.created),
        execTime: it.data.execTime,
        status: it.data.status ?? 0,
        path,
        color,
      };
    });
  updateStatePushItems(items);
  requestAnimationFrame(() => {
    renderUI(state);
    const nextPage = page + 1;
    if (nextPage <= res.totalPages) {
      loadEvents(nextPage);
    }
  });
}

//UI rendering
/** @param {State} state */
function renderUI(state) {
  console.debug({ event: 'renderUI' });

  tCtx.clearRect(0, 0, state.width, state.height);

  const color = state.isDark ? '#ffffff' : '#000000';
  tCtx.fillStyle = color;
  tCtx.strokeStyle = color;
  tCtx.lineWidth = 1.5;
  tCtx.textRendering = 'optimizeLegibility';
  tCtx.font = `${FONT_SIZE}px sans-serif`;

  drawYAxis(state);
  drawXAxis(state);
  plotItems(state);
  drawHover(state);
}

/**@param {State} state
 * @returns {number} cursorSize
 */
function drawHoverCursor(state) {
  tCtx.globalAlpha = 0.2;
  const cursorSize = 20;
  const xCoord = state.mouseCoord.x - cursorSize / 2;
  const yCoord = state.mouseCoord.y - cursorSize / 2;
  tCtx.fillRect(xCoord, yCoord, cursorSize, cursorSize);
  tCtx.globalAlpha = 1;
  console.log({ label: 'drawHoverCursor', xCoord, yCoord });
  return cursorSize;
}

/**@param {State} state
 * @param {number} cursorSize
 */
function drawHoverInfo(state, cursorSize) {
  const savedFillStyle = tCtx.fillStyle;
  let entries = state.coordHinter.getEntries(
    state.mouseCoord.x,
    state.mouseCoord.y,
    cursorSize,
  );
  if (!entries.size) return;
  const texts = Array.from(entries.values());
  const textMeasurements = texts
    .map((v) => tCtx.measureText(v).width)
    .reduce((acc, it) => Math.max(acc, it));
  const xCoord = state.mouseCoord.x + cursorSize;
  const yCoord = state.mouseCoord.y - cursorSize;
  tCtx.beginPath();
  tCtx.fillStyle = '#000';
  tCtx.roundRect(
    xCoord,
    yCoord,
    Math.max(textMeasurements + 45, 130),
    (entries.size + 2) * (FONT_SIZE + 5),
    10,
  );
  tCtx.fill();
  tCtx.stroke();
  tCtx.fillStyle = savedFillStyle;
  texts.sort();
  texts.forEach((text, i) => {
    const xCoordText = xCoord + 25;
    const yCoordText = yCoord + 10 + (FONT_SIZE + 5) * (i + 1);

    const color = state.colors.getColor(text);
    if (color) {
      tCtx.fillStyle = state.colors.getColor(text);
    }
    tCtx.fillRect(xCoordText - 10, yCoordText - FONT_SIZE / 2, 5, 5);
    tCtx.fillStyle = savedFillStyle;
    tCtx.fillText(text, xCoordText, yCoordText, textMeasurements);
  });
}

/** @param {State} state */
function drawHover(state) {
  if (!state.mouseCoord) return;
  const cursorSize = drawHoverCursor(state);
  drawHoverInfo(state, cursorSize);
}

/** @param {State} state */
function plotItems(state) {
  console.debug({ label: 'plotItems' });

  const style = tCtx.fillStyle;
  for (let item of state.items) {
    const xCoord = state.xCoord.getCoord(item.ts);
    const yCoord = state.yCoord.getCoord(item.execTime);
    state.coordHinter.addItem(
      xCoord,
      yCoord,
      item.path.collection ?? item.path.url,
    );
    tCtx.beginPath();
    tCtx.arc(xCoord, yCoord, 0.5, 0, 2 * Math.PI);
    if (item.color) {
      tCtx.fillStyle = item.color;
    } else {
      tCtx.fillStyle = style;
    }
    tCtx.fill();
  }
  tCtx.fillStyle = style;
}

/** @param {State} state */
function drawYAxis(state) {
  const xCoord = MARGIN - tCtx.lineWidth / 2;
  const topY = MARGIN;
  const bottomY = state.height - MARGIN;
  console.debug({ label: 'drawYAxis', xCoord, topY, bottomY });

  tCtx.beginPath();
  tCtx.moveTo(xCoord, topY);
  tCtx.lineTo(xCoord, bottomY);
  tCtx.closePath();
  tCtx.fill();
  tCtx.stroke();

  const rectWidth = 8;
  const padRight = 4;
  const padTop = 2;
  const rectHeight = tCtx.lineWidth;
  let nextLabelAt = state.height;
  for (let labelMs of state.yCoord.getLabels()) {
    const yCoord = state.yCoord.getCoord(labelMs);
    tCtx.fillRect(
      xCoord - rectWidth,
      yCoord - rectHeight,
      rectWidth,
      rectHeight,
    );
    if (labelMs / 10 ** Math.floor(Math.log10(labelMs)) > 3) {
      continue;
    }
    const textText = formatMs(labelMs);
    const textMeasurements = tCtx.measureText(textText);
    const textHalfWidth = textMeasurements.ideographicBaseline;
    const textYCoord = Math.floor(yCoord - textHalfWidth);
    if (nextLabelAt < textYCoord) continue;
    nextLabelAt = textYCoord - FONT_SIZE - padTop;
    tCtx.fillText(
      textText,
      xCoord - rectWidth - Math.ceil(textMeasurements.width) - padRight,
      textYCoord,
      textMeasurements.width,
    );
  }
}

/** @param {State} state */
function drawXAxis(state) {
  const yCoord = state.height - MARGIN - tCtx.lineWidth / 2;
  const leftX = MARGIN - tCtx.lineWidth;
  const rightX = state.width - MARGIN;
  console.debug({ label: 'drawYAxis', yCoord, leftX, rightX });

  tCtx.beginPath();
  tCtx.moveTo(leftX, yCoord);
  tCtx.lineTo(rightX, yCoord);
  tCtx.closePath();
  tCtx.fill();
  tCtx.stroke();

  const rectHeight = 8;
  const rectWidth = tCtx.lineWidth;
  const padTop = 4;
  const step = state.xCoord.step;
  let nextLabelAt = 0;
  for (let labelDate of state.xCoord.getLabels()) {
    const xCoord = state.xCoord.getCoord(labelDate);
    tCtx.fillRect(xCoord, yCoord, rectWidth, rectHeight);
    switch (labelDate.getUTCHours()) {
      case 0: {
        const textText = '12:00AM';
        const textMeasurements = tCtx.measureText(textText);
        const textHalfWidth = textMeasurements.width / 2;
        const textXCoord = Math.floor(xCoord - textHalfWidth);
        if (textXCoord <= nextLabelAt) break;
        nextLabelAt = xCoord + textHalfWidth;
        tCtx.fillText(
          textText,
          textXCoord,
          yCoord +
            rectHeight +
            Math.ceil(textMeasurements.hangingBaseline) +
            padTop,
          textMeasurements.width,
        );

        const dateText = `[${labelDate.getUTCDate().toString().padStart(2, '0')}-${labelDate.getUTCMonth().toString().padStart(2, '0')}]`;
        const dateMeasurements = tCtx.measureText(dateText);
        tCtx.fillText(
          dateText,
          Math.floor(xCoord - dateMeasurements.width / 2),
          yCoord +
            rectHeight +
            Math.ceil(textMeasurements.hangingBaseline * 1.5) +
            Math.ceil(dateMeasurements.hangingBaseline) +
            padTop,

          dateMeasurements.width,
        );

        break;
      }
      case 12: {
        if (step < 50) break;
        const text = `12:00PM`;
        const textMeasurements = tCtx.measureText(text);
        const textHalfWidth = textMeasurements.width / 2;
        const textXCoord = Math.floor(xCoord - textHalfWidth);
        if (textXCoord <= nextLabelAt) break;
        nextLabelAt = xCoord + textHalfWidth;
        tCtx.fillText(
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

/**
 * @typedef {Object} LogPathCustom
 * @property {'custom'} type
 * @property {string} url
 * @property {string} method
 */
/**
 * @typedef {Object} LogPathCollection
 * @property {'collection'} type
 * @property {string} collection
 * @property {'list' | 'view' | 'create' | 'update' | 'delete' | 'base'} action
 */
/**
 * @typedef {Object} LogPathFile
 * @property {'file'} type
 * @property {string} collection
 */
/**
 * @typedef {LogPathFile | LogPathCollection | LogPathCustom} LogPath
 */
/**
 * @param {string} url
 * @returns {LogPath}
 */
function urlFormatter(method, url) {
  const parts = url.split('/').filter(Boolean);
  switch (parts[1]) {
    case 'collections': {
      /** @type {LogPathCollection['action']} */
      let action = 'base';
      switch (method) {
        case 'POST':
          action = 'create';
          break;
        case 'PUT':
        case 'PATCH':
          action = 'update';
          break;
        case 'DELETE':
          action = 'delete';
          break;
        case 'GET':
          action = parts.length > 4 ? 'view' : 'list';
          break;
      }
      return {
        type: 'collection',
        collection:
          state.collections.get(parts[2])?.name ?? parts[2] ?? 'unknown',
        action,
      };
    }
    case 'files':
      return {
        type: 'file',
        collection:
          state.collections.get(parts[2])?.name ?? parts[2] ?? 'unknown',
      };
    default:
      return {
        type: 'custom',
        url: url,
        method,
      };
  }
}

function formatMs(value) {
  if (value == 0) {
    return '0';
  }
  if (value < 1) {
    return value.toFixed(1);
  }
  if (Math.log10(value) >= 3) {
    return `${value / 1000}k`;
  }
  return value.toString();
}

// DEBUG
window.G = () => state;
window.renderUI = renderUI;
