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
