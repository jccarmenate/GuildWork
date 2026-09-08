import "@testing-library/jest-dom/vitest";

// jsdom has no canvas 2D backend and throws on getContext("2d") — stub it so
// components using <canvas> (e.g. ParticleNetworkBackground) don't spam
// console.error in every test that renders them.
HTMLCanvasElement.prototype.getContext = (() => ({
  clearRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  arc: () => {},
  fill: () => {},
  setTransform: () => {}
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Node 25+ ships its own built-in `localStorage` global (inert without a
// --localstorage-file flag: getItem/setItem/etc. are all missing) and it
// shadows jsdom's real, working implementation on globalThis. Force jsdom's
// version back into place so components that read localStorage in tests
// don't silently no-op.
if (typeof window.localStorage.clear !== "function") {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();
    get length() {
      return this.store.size;
    }
    clear() {
      this.store.clear();
    }
    getItem(key: string) {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    key(index: number) {
      return Array.from(this.store.keys())[index] ?? null;
    }
    removeItem(key: string) {
      this.store.delete(key);
    }
    setItem(key: string, value: string) {
      this.store.set(key, String(value));
    }
  }
  Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true });
  Object.defineProperty(window, "localStorage", { value: globalThis.localStorage, configurable: true });
}

// jsdom also has no matchMedia implementation.
window.matchMedia =
  window.matchMedia ||
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }));
