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
const CURSOR_SIZE = 25;

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
  static LABELED_TICKS_FIRST = 3;
  static TICKS = 9;

  /** @type {number} Max value in ms */
  #max;
  /** @type {number} Size of plot */
  #height;
  /** @type {{ label: string; width: string; yCoord: number }[]} */
  #labels;
  /** @type {Map<number, number>} */
  #coordsCache = new Map();

  /**@param {number} max
   * @param {number} height
   */
  constructor(max, height) {
    this.#max = max;
    this.#height = height - MARGIN * 2;

    const labels = [];
    for (let i = 1; i <= YCoord.TICKS; i++) {
      const value = i * 0.1;
      const yCoord = this.getCoord(value);
      labels.push({ value, label: '', width: 0, yCoord });
    }
    const totalSteps = Math.floor(Math.log10(this.#max));
    main: for (let i = 0; i <= totalSteps; i++) {
      const step = 10 ** i;
      for (let j = 1; j <= YCoord.TICKS; j++) {
        let value = j * step;
        if (value > this.#max) break main;
        const yCoord = this.getCoord(value);
        const label = j <= YCoord.LABELED_TICKS_FIRST ? formatMs(value) : '';
        const width = label.length > 0 ? tCtx.measureText(label).width : 0;
        labels.push({ value, label, width, yCoord });
      }
    }
    this.#labels = labels;
    console.debug({
      event: 'new YCoord',
      max: this.#max,
      height: this.#height,
    });
  }

  get max() {
    return this.#max;
  }

  get labels() {
    return this.#labels;
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

  /** @type {{ value: number; labels: string[]; widths:number[], maxWidth: string; xCoord: number }[]} */
  #labels;
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

    const totalSteps = Math.floor(this.#totalMs / XCoord.STEP_MS);
    const step = Math.floor(this.#width / totalSteps);
    const labels = [];

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
      const value = new Date(current);
      const xCoord = this.getCoord(value);

      switch (value.getUTCHours()) {
        case 0: {
          const timeText = '12:00AM';
          const timeWidth = tCtx.measureText(timeText).width;

          const dateText = `[${value.getUTCDate().toString().padStart(2, '0')}-${value.getUTCMonth().toString().padStart(2, '0')}]`;
          const dateWidth = tCtx.measureText(dateText).width;

          labels.push({
            labels: [timeText, dateText],
            widths: [timeWidth, dateWidth],
            maxWidth: Math.max(timeWidth, dateWidth),
            xCoord,
          });
          break;
        }
        case 12: {
          if (step < 50) {
            labels.push({
              labels: [],
              widths: [],
              maxWidth: 0,
              xCoord,
            });
            break;
          }
          const timeText = '12:00PM';
          const timeWidth = tCtx.measureText(timeText).width;
          labels.push({
            labels: [timeText],
            widths: [timeWidth],
            maxWidth: timeWidth,
            xCoord,
          });
          break;
        }
      }
      current.setTime(current.getTime() + XCoord.STEP_MS);
    }
    this.#labels = labels;

    console.debug({
      event: 'new XCoord',
      width: this.#width,
      totalSteps,
      labels,
    });
  }

  get labels() {
    return this.#labels;
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
    return cache[variant] ?? cache.base;
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

/** @typedef {{ label: string; width: number; color: string }} CoordHinterItem */

class CoordHinter {
  /** @type {number} */
  #width;
  /** @type {number} */
  #height;
  /** @type {number} */
  #gridWidth;
  /** @type {number} */
  #gridHeight;
  /** @type {LogItem[][]} */
  #lookupGrid;

  static GRID_SIZE_PX = 2;

  /**@param {number} height
   * @param {number} width
   */
  constructor(height, width) {
    this.#height = height;
    this.#width = width;
    this.#gridHeight = Math.ceil(height / CoordHinter.GRID_SIZE_PX);
    this.#gridWidth = Math.ceil(width / CoordHinter.GRID_SIZE_PX);
    console.debug({
      label: 'new CoordHinter',
      height,
      width,
      gridHeight: this.#gridHeight,
      gridWidth: this.#gridWidth,
    });
    this.#lookupGrid = new Array(this.#gridHeight * this.#gridWidth)
      .fill(0)
      .map(() => []);
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
   * @param {LogItem} entry
   */
  addItem(x, y, entry) {
    const gridI = this.#getGridIndex(x, y);
    if (0 <= gridI && gridI < this.#lookupGrid.length) {
      this.#lookupGrid[gridI].push(entry);
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
   * @returns {CoordHinterItem[]}
   */
  getEntries(x, y, radius = 10) {
    let res = [];

    const minGridX = Math.max(0, Math.floor(x - radius));
    const maxGridX = Math.min(this.#width - 1, Math.floor(x + radius));
    const minGridY = Math.max(0, Math.floor(y - radius));
    const maxGridY = Math.min(this.#height - 1, Math.floor(y + radius));

    for (let gridY = minGridY; gridY <= maxGridY; gridY++) {
      for (let gridX = minGridX; gridX <= maxGridX; gridX++) {
        const gridI = this.#getGridIndex(gridX, gridY);
        const entry = this.#lookupGrid[gridI];
        res.push(...entry);
      }
    }

    const toStr = (it) => {
      switch (it.path.type) {
        case 'file':
          return `@${it.path.collection} (file)`;
        case 'collection':
          return `@${it.path.collection} (${it.path.action})`;
        case 'custom':
          return it.path.url;
      }
    };

    const uniqWithTimings = (arr, predStr) => {
      const timings = new Map();

      return [
        arr.filter((it) => {
          let str = predStr(it);
          if (timings.has(str)) {
            timings.get(str).push(it.execTime);
            return false;
          }
          timings.set(str, [it.execTime]);
          return true;
        }),
        timings,
      ];
    };

    const [uniq, timings] = uniqWithTimings(res, toStr);
    const items = uniq.map((it) => {
      const str = toStr(it);
      const itemTimings = timings.get(str);
      const timing =
        itemTimings.reduce((acc, it) => acc + it) / itemTimings.length;
      const label = `${str} ~${timing.toFixed(2)}ms`;
      return {
        label,
        width: tCtx.measureText(label).width,
        color: it.color,
        execTime: it.execTime,
      };
    });
    items.sort((a, b) => b.execTime - a.execTime);

    return items;
  }
}

/**@typedef {Object} LogItem
 * @property {string} id
 * @property {Date} ts
 * @property {number} execTime
 * @property {number} status
 * @property {LogPath} path
 * @property {string} color
 * @property {string} xCoord
 * @property {string} yCoord
 */

/**@typedef {Object} State
 * @property {boolean} isDark
 * @property {string} background
 * @property {string} foreground
 * @property {number} height
 * @property {number} width
 * @property {DateRange} range
 * @property {LogItem[]} items
 * @property {XCoord} xCoord
 * @property {YCoord} yCoord
 * @property {ColorGenerator} colors
 * @property {CoordHinter} coordHinter
 * @property {{x: number, y: number} | null} mouseCoord
 * @property {{onLeft: boolean; growToTop: boolean} | null} hoverPos
 * @property {CoordHinterItem[] | null} hoverEntries
 * @property {Map<string, import('pocketbase').CollectionModel} collections
 */

let state = newState(temporalCssHeight, temporalCssWidth);
let queue = {
  cur: [],
  isRunning: false,
  /** @param {(v: State) => State} fn*/
  enqueu(fn) {
    this.cur.push(fn);
    if (!this.isRunning) {
      this.isRunning = true;
      this._work();
    }
  },
  _work() {
    let curr = this.cur.shift();
    if (curr) {
      state = curr(state);
      this._work();
    } else {
      this.isRunning = false;
      logState();
      requestAnimationFrame(() => {
        renderUI(state);
      });
    }
  },
};

function logState() {
  console.debug({ event: 'update state', ...state });
}

function getThemeColors(isDark) {
  switch (isDark) {
    case true:
      return { background: '#000000', foreground: '#ffffff' };
    case false:
    default:
      return { background: '#ffffff', foreground: '#000000' };
  }
}

/**
 * @param {number} height
 * @param {number} width
 * @returns {State}
 */
function newState(height, width) {
  const isDark = themeQuery.matches;
  const range = {
    from: new Date(temporalFrom.value + 'Z'),
    to: new Date(temporalTo.value + 'Z'),
  };
  return {
    isDark,
    ...getThemeColors(isDark),
    items: [],
    height,
    width,
    range,
    xCoord: new XCoord(range, width),
    yCoord: new YCoord(UPPER_BOUNDS_MS, height),
    colors: new ColorGenerator(),
    coordHinter: new CoordHinter(height, width),
    mouseCoord: null,
    hoverPos: null,
    hoverEntries: [],
    collections: new Map(),
  };
}

/**@param {State} state
 * @returns {State}
 */
function updateStateRange(state) {
  const range = {
    from: new Date(temporalFrom.value + 'Z'),
    to: new Date(temporalTo.value + 'Z'),
  };
  return {
    ...state,
    items: [],
    range: range,
    xCoord: new XCoord(range, state.width),
    yCoord: new YCoord(UPPER_BOUNDS_MS, state.height),
    coordHinter: new CoordHinter(state.height, state.width),
  };
}

/**@param {State} state
 * @returns {State}
 */
function updateStateTheme(state) {
  const isDark = themeQuery.matches;
  return {
    ...state,
    isDark,
    ...getThemeColors(isDark),
  };
}

/**@param {number} height
 * @param {number} width
 * @param {State} state
 * @returns {State}
 */
function updateStateCanvasSize(height, width, state) {
  const xCoord = new XCoord(state.range, width);
  const yCoord = new YCoord(state.yCoord.max, height);
  const coordHinter = new CoordHinter(height, width);
  const items = state.items.map((it) => ({
    ...it,
    xCoord: xCoord.getCoord(it.ts),
    yCoord: yCoord.getCoord(it.execTime),
  }));
  items.forEach((it) => coordHinter.addItem(it.xCoord, it.yCoord, it));
  return {
    ...state,
    height,
    width,
    xCoord,
    yCoord,
    coordHinter,
    items,
    mouseCoord: null,
    hoverPos: null,
    hoverEntries: [],
  };
}

/**@param {{x: number, y: number} | null} pos
 * @param {State} state
 * @returns {State}
 */
function updateStateMousePosition(mouseCoord, state) {
  let hoverEntries = mouseCoord
    ? state.coordHinter.getEntries(mouseCoord.x, mouseCoord.y, CURSOR_SIZE / 2)
    : [];
  const hoverPos = mouseCoord
    ? {
        onLeft: mouseCoord.x >= state.width / 2,
        growToTop: mouseCoord.y >= state.height / 2,
      }
    : null;
  return {
    ...state,
    mouseCoord,
    hoverPos,
    hoverEntries,
  };
}

/**@param {LogItem[]} newItems
 * @param {State} state
 * @returns {State}
 */
function updateStatePushItems(newItems, state) {
  const max = newItems.reduce(
    (max, it) => Math.max(max, it.execTime),
    state.yCoord.max,
  );
  if (state.yCoord.max !== max) {
    const yCoord = new YCoord(max, state.height);
    const coordHinter = new CoordHinter(state.height, state.width);
    const items = [...state.items, ...newItems].map((it) => {
      const itemYCoord = yCoord.getCoord(it.execTime);
      coordHinter.addItem(it.xCoord, itemYCoord, it);
      return {
        ...it,
        yCoord: itemYCoord,
      };
    });

    return {
      ...state,
      items,
      yCoord,
      coordHinter,
      mouseCoord: null,
      hoverPos: null,
      hoverEntries: [],
    };
  }

  newItems.forEach((it) => state.coordHinter.addItem(it.xCoord, it.yCoord, it));
  return {
    ...state,
    items: [...state.items, ...newItems],
  };
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
  queue.enqueu(updateStateCanvasSize.bind(null, temporalCssHeight, width));
});
temporalCanvas.addEventListener('mousemove', (e) => {
  const rect = temporalCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  queue.enqueu(updateStateMousePosition.bind(null, { x, y }));
});
temporalCanvas.addEventListener('mouseleave', () => {
  queue.enqueu(updateStateMousePosition.bind(null, null));
});
temporalLoad.addEventListener('click', () => {
  console.debug({ event: 'temporalLoad click' });
  queue.enqueu(updateStateRange);
  loadEvents();
});
themeQuery.addEventListener('change', () => {
  console.debug({ event: 'themeQuery change' });
  queue.enqueu(updateStateTheme);
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
  queue.enqueu((state) => {
    const items = res.items
      .filter(
        (it) =>
          it.data?.type == 'request' && typeof it.data.execTime == 'number',
      )
      .map((it) => {
        const path = urlFormatter(it.data.method, it.data.url);
        const color = state.colors.getColor(
          path.type == 'custom' ? path.url : path.collection,
          path.action,
        );

        const ts = new Date(it.created);
        const execTime = it.data.execTime;
        /** @type {LogItem} */
        return {
          id: it.id,
          ts,
          execTime,
          status: it.data.status ?? 0,
          path,
          color,
          xCoord: state.xCoord.getCoord(ts),
          yCoord: state.yCoord.getCoord(execTime),
        };
      });
    let newState = updateStatePushItems(items, state);
    const nextPage = page + 1;
    if (nextPage <= res.totalPages) {
      loadEvents(nextPage);
    }
    return newState;
  });
}

//UI rendering
/** @param {State} state */
function renderUI(state) {
  console.debug({ event: 'renderUI' });

  tCtx.clearRect(0, 0, state.width, state.height);

  tCtx.lineWidth = 1.5;
  tCtx.textRendering = 'optimizeLegibility';
  tCtx.font = `${FONT_SIZE}px sans-serif`;

  drawYAxis(state);
  drawXAxis(state);
  plotItems(state);
  drawHover(state);
}

/**@param {State} state */
function drawHoverCursor(state) {
  tCtx.fillStyle = state.foreground;
  tCtx.globalAlpha = 0.2;
  const xCoord = state.mouseCoord.x - CURSOR_SIZE / 2;
  const yCoord = state.mouseCoord.y - CURSOR_SIZE / 2;
  tCtx.fillRect(xCoord, yCoord, CURSOR_SIZE, CURSOR_SIZE);
  tCtx.globalAlpha = 1;
  console.debug({ label: 'drawHoverCursor', xCoord, yCoord });
}

/**@param {State} state */
function drawHoverInfo(state) {
  if (state.hoverEntries.length == 0) return;
  const maxTextWidth = state.hoverEntries.reduce(
    (acc, it) => Math.max(acc, it.width),
    0,
  );
  const width = Math.max(maxTextWidth + 45, 130);
  const height = (state.hoverEntries.length + 2) * (FONT_SIZE + 5);
  const xCoord = state.hoverPos?.onLeft
    ? state.mouseCoord.x - CURSOR_SIZE - width
    : state.mouseCoord.x + CURSOR_SIZE;
  const yCoord = state.hoverPos?.growToTop
    ? state.mouseCoord.y + CURSOR_SIZE / 2 - height
    : state.mouseCoord.y - CURSOR_SIZE / 2;
  tCtx.beginPath();
  tCtx.fillStyle = state.background;
  tCtx.roundRect(xCoord, yCoord, width, height, 10);
  tCtx.fill();
  tCtx.stroke();
  state.hoverEntries.forEach((it, i) => {
    const xCoordText = xCoord + 25;
    const yCoordText = yCoord + 10 + (FONT_SIZE + 5) * (i + 1);

    tCtx.fillStyle = it.color;
    tCtx.fillRect(xCoordText - 10, yCoordText - FONT_SIZE / 2, 5, 5);
    tCtx.fillStyle = state.foreground;
    tCtx.fillText(it.label, xCoordText, yCoordText, maxTextWidth);
  });
}

/** @param {State} state */
function drawHover(state) {
  if (!state.mouseCoord) return;
  drawHoverCursor(state);
  drawHoverInfo(state);
}

/** @param {State} state */
function plotItems(state) {
  console.debug({ label: 'plotItems' });

  for (let item of state.items) {
    tCtx.beginPath();
    tCtx.arc(item.xCoord, item.yCoord, 0.5, 0, 2 * Math.PI);
    if (item.color) {
      tCtx.fillStyle = item.color;
    } else {
      tCtx.fillStyle = state.foreground;
    }
    tCtx.fill();
  }
}

/** @param {State} state */
function drawYAxis(state) {
  const xCoord = MARGIN - tCtx.lineWidth / 2;
  const topY = MARGIN;
  const bottomY = state.height - MARGIN;
  console.debug({ label: 'drawYAxis', xCoord, topY, bottomY });

  tCtx.fillStyle = state.foreground;
  tCtx.strokeStyle = state.foreground;
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
  for (let label of state.yCoord.labels) {
    tCtx.fillRect(
      xCoord - rectWidth,
      label.yCoord - rectHeight,
      rectWidth,
      rectHeight,
    );
    if (label.label.length == 0) {
      continue;
    }
    const textYCoord = Math.floor(label.yCoord + FONT_SIZE / 2);
    if (nextLabelAt < textYCoord) continue;
    nextLabelAt = textYCoord - FONT_SIZE - padTop;
    tCtx.fillText(
      label.label,
      xCoord - rectWidth - Math.ceil(label.width) - padRight,
      textYCoord,
      label.width,
    );
  }
}

/** @param {State} state */
function drawXAxis(state) {
  const yCoord = state.height - MARGIN - tCtx.lineWidth / 2;
  const leftX = MARGIN - tCtx.lineWidth;
  const rightX = state.width - MARGIN;
  console.debug({ label: 'drawYAxis', yCoord, leftX, rightX });

  tCtx.fillStyle = state.foreground;
  tCtx.strokeStyle = state.foreground;
  tCtx.beginPath();
  tCtx.moveTo(leftX, yCoord);
  tCtx.lineTo(rightX, yCoord);
  tCtx.closePath();
  tCtx.fill();
  tCtx.stroke();

  const rectHeight = 8;
  const rectWidth = tCtx.lineWidth;
  const padTop = 4;
  let nextLabelAt = 0;
  for (let label of state.xCoord.labels) {
    tCtx.fillRect(label.xCoord, yCoord, rectWidth, rectHeight);
    if (
      label.labels.length == 0 ||
      label.xCoord - label.maxWidth / 2 <= nextLabelAt
    )
      continue;
    nextLabelAt = label.xCoord + label.maxWidth / 2;
    label.labels.forEach((text, i) => {
      const textXCoord = label.xCoord - label.widths[i] / 2;
      tCtx.fillText(
        text,
        textXCoord,
        yCoord + rectHeight + FONT_SIZE / 2 + (FONT_SIZE + 5) * i + padTop,
        label.maxWidth,
      );
    });
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
 * @property {string} action
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
      let collection = state.collections.get(parts[2]);
      if (!collection) break;
      if (collection.type == 'auth') {
        action = parts.at(-1);
      } else {
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
      }
      return {
        type: 'collection',
        collection: collection?.name ?? parts.at(2) ?? 'unknown',
        action,
      };
    }
    case 'files':
      return {
        type: 'file',
        collection:
          state.collections.get(parts.at(2))?.name ?? parts.at(2) ?? 'unknown',
      };
  }

  return {
    type: 'custom',
    url: url,
    method,
  };
}

/**@param {number} value
 * @returns {string}
 */
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
