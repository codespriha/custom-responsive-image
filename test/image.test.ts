import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'http://localhost/',
});
(globalThis as { document: Document }).document = dom.window.document;
(globalThis as { HTMLElement: typeof HTMLElement }).HTMLElement = dom.window.HTMLElement;
(globalThis as { HTMLImageElement: typeof HTMLImageElement }).HTMLImageElement =
  dom.window.HTMLImageElement;

import {
  createResponsiveImage,
  setResponsiveImageConfig,
  resetResponsiveImageConfig,
  injectResponsiveImageStyles,
} from '../src/index.js';
import type { ResponsiveImageController } from '../src/index.js';

// jsdom cannot load images, so stub natural dimensions globally.
let NATURAL_W = 0;
let NATURAL_H = 0;
Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
  configurable: true,
  get: () => NATURAL_W,
});
Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
  configurable: true,
  get: () => NATURAL_H,
});

function setNatural(w: number, h: number): void {
  NATURAL_W = w;
  NATURAL_H = h;
}

function makeContainer(): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function mount(opts: Parameters<typeof createResponsiveImage>[1]): {
  container: HTMLElement;
  controller: ResponsiveImageController;
} {
  const container = makeContainer();
  return { container, controller: createResponsiveImage(container, opts) };
}

afterEach(() => {
  document.body.innerHTML = '';
  setNatural(0, 0);
  resetResponsiveImageConfig();
});

test('renders container and img into the target container', () => {
  const { container, controller } = mount({ src: 'a.png', alt: 'A' });
  assert.ok(container.contains(controller.element));
  assert.equal(controller.element.className, 'ri');
  assert.equal(controller.image.tagName, 'IMG');
  assert.equal(controller.image.alt, 'A');
  assert.equal(controller.image.getAttribute('src'), 'a.png');
  assert.equal(controller.image.getAttribute('loading'), 'lazy');
});

test('aspectRatio number sets a strict box on the container', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: 16 / 9 });
  assert.equal(controller.element.style.aspectRatio, String(16 / 9));
  assert.ok(controller.element.classList.contains('ri--box'));
  assert.ok(controller.image.classList.contains('ri__img--fill'));
});

test('aspectRatio string "16:9" is normalized to "16 / 9"', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '16:9' });
  assert.equal(controller.element.style.aspectRatio, '16 / 9');
});

test('invalid aspectRatio values are ignored', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: 'oops' });
  assert.equal(controller.element.style.aspectRatio, '');
  assert.ok(!controller.element.classList.contains('ri--box'));
});

test('explicit objectFit cover is applied', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '4 / 3', objectFit: 'cover' });
  assert.equal(controller.getObjectFit(), 'cover');
  assert.equal(controller.image.style.objectFit, 'cover');
});

test('explicit objectFit contain is applied', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '4 / 3', objectFit: 'contain' });
  assert.equal(controller.getObjectFit(), 'contain');
  assert.equal(controller.image.style.objectFit, 'contain');
});

test('auto covers when the image is bigger than the box', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '16 / 9' });
  setNatural(1600, 900);
  Object.defineProperty(controller.element, 'clientWidth', { value: 400, configurable: true });
  Object.defineProperty(controller.element, 'clientHeight', { value: 225, configurable: true });
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.getObjectFit(), 'cover');
});

test('auto contains when the image fits inside the box', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '16 / 9' });
  setNatural(640, 360);
  Object.defineProperty(controller.element, 'clientWidth', { value: 1280, configurable: true });
  Object.defineProperty(controller.element, 'clientHeight', { value: 720, configurable: true });
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.getObjectFit(), 'contain');
});

test('auto covers when the image is bigger than the box in some dimension', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '16 / 9' });
  setNatural(640, 1000); // taller, but not wider
  Object.defineProperty(controller.element, 'clientWidth', { value: 1280, configurable: true });
  Object.defineProperty(controller.element, 'clientHeight', { value: 720, configurable: true });
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.getObjectFit(), 'cover');
});

test('small image under the threshold is contained and centered, never filled', () => {
  const { controller } = mount({ src: 'icon.png', aspectRatio: '1 / 1' });
  setNatural(64, 64);
  Object.defineProperty(controller.element, 'clientWidth', { value: 400, configurable: true });
  Object.defineProperty(controller.element, 'clientHeight', { value: 400, configurable: true });
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.isSmall, true);
  assert.ok(!controller.image.classList.contains('ri__img--fill'));
  assert.equal(controller.image.style.objectFit, 'contain');
  assert.equal(controller.getObjectFit(), 'contain');
});

test('explicit small:true forces small treatment even for large images', () => {
  const { controller } = mount({ src: 'big.png', aspectRatio: '16 / 9', small: true });
  setNatural(2000, 1125);
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.isSmall, true);
  assert.ok(!controller.image.classList.contains('ri__img--fill'));
});

test('explicit small:false disables small treatment for tiny images', () => {
  const { controller } = mount({ src: 'tiny.png', aspectRatio: '16 / 9', small: false });
  setNatural(40, 40);
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.isSmall, false);
  assert.ok(controller.image.classList.contains('ri__img--fill'));
});

test('global config threshold changes the small-image cutoff', () => {
  setResponsiveImageConfig({ smallImageThreshold: 400 });
  const { controller } = mount({ src: 'img.png', aspectRatio: '1 / 1' });
  setNatural(300, 300);
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.isSmall, true);
});

test('no aspect ratio and normal image uses natural fluid sizing', () => {
  const { controller } = mount({ src: 'a.png' });
  assert.ok(!controller.element.classList.contains('ri--box'));
  assert.ok(controller.image.classList.contains('ri__img--natural'));
});

test('no aspect ratio and small image stays contained (never natural-fluid)', () => {
  const { controller } = mount({ src: 'icon.png' });
  setNatural(48, 48);
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.isSmall, true);
  assert.ok(!controller.image.classList.contains('ri__img--natural'));
  assert.ok(!controller.image.classList.contains('ri__img--fill'));
});

test('update patches existing options and persists earlier values', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '4 / 3', objectFit: 'cover' });
  controller.update({ objectFit: 'contain' });
  assert.equal(controller.getObjectFit(), 'contain');
  assert.equal(controller.element.style.aspectRatio, '4 / 3');
  controller.update({ aspectRatio: '16 / 9', src: 'b.png' });
  assert.equal(controller.element.style.aspectRatio, '16 / 9');
  assert.equal(controller.image.getAttribute('src'), 'b.png');
  assert.equal(controller.getObjectFit(), 'contain');
});

test('refresh re-evaluates smallness against the current global config', () => {
  const { controller } = mount({ src: 'img.png', aspectRatio: '1 / 1' });
  setNatural(300, 300);
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.equal(controller.isSmall, false);
  setResponsiveImageConfig({ smallImageThreshold: 400 });
  controller.refresh();
  assert.equal(controller.isSmall, true);
});

test('switching src resets pending natural size until the new image loads', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '16 / 9' });
  setNatural(1600, 900);
  controller.image.dispatchEvent(new dom.window.Event('load'));
  assert.deepEqual(controller.getNaturalSize(), { width: 1600, height: 900 });
  controller.update({ src: 'b.png' });
  assert.equal(controller.getNaturalSize(), null);
});

test('className is appended to the img, plus the current mode modifier', () => {
  const { controller } = mount({ src: 'a.png', className: 'hero' });
  assert.equal(controller.image.className, 'ri__img hero ri__img--natural');
});

test('destroy removes the component from the DOM', () => {
  const { container, controller } = mount({ src: 'a.png' });
  controller.destroy();
  assert.equal(container.children.length, 0);
  assert.equal(controller.image.getAttribute('src'), null);
});

test('inject styles is idempotent', () => {
  injectResponsiveImageStyles();
  injectResponsiveImageStyles();
  const styles = document.head.querySelectorAll('style[data-custom-responsive-image]');
  assert.equal(styles.length, 1);
});

function badgeOf(controller: ResponsiveImageController): HTMLElement {
  const el = controller.element.querySelector('.ri__badge');
  assert.ok(el);
  return el as HTMLElement;
}

function childOf(badgeEl: HTMLElement, selector: string): HTMLElement {
  const el = badgeEl.querySelector(selector);
  assert.ok(el);
  return el as HTMLElement;
}

test('badge renders with default position/theme and icon + text', () => {
  const { controller } = mount({
    src: 'a.png',
    aspectRatio: '1 / 1',
    badge: { icon: '★', text: 'Featured' },
  });
  const badgeEl = badgeOf(controller);
  assert.match(badgeEl.className, /ri__badge--bottom-right/);
  assert.match(badgeEl.className, /ri__badge--dark/);
  assert.equal(badgeEl.style.display, '');
  assert.equal(childOf(badgeEl, '.ri__badge__icon').textContent, '★');
  assert.equal(childOf(badgeEl, '.ri__badge__text').textContent, 'Featured');
});

test('badge respects custom position and theme', () => {
  const { controller } = mount({
    src: 'a.png',
    aspectRatio: '1 / 1',
    badge: { text: 'x', position: 'top-left', theme: 'light' },
  });
  const badgeEl = badgeOf(controller);
  assert.match(badgeEl.className, /ri__badge--top-left/);
  assert.match(badgeEl.className, /ri__badge--light/);
});

test('badge icon-only hides the text span', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '1 / 1', badge: { icon: '🔥' } });
  const badgeEl = badgeOf(controller);
  assert.equal(childOf(badgeEl, '.ri__badge__icon').style.display, '');
  assert.equal(childOf(badgeEl, '.ri__badge__text').style.display, 'none');
});

test('badge text-only hides the icon span', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '1 / 1', badge: { text: 'New' } });
  const badgeEl = badgeOf(controller);
  assert.equal(childOf(badgeEl, '.ri__badge__icon').style.display, 'none');
});

test('badge text-icon order adds the reversed modifier', () => {
  const { controller } = mount({
    src: 'a.png',
    aspectRatio: '1 / 1',
    badge: { icon: '✦', text: 'New', order: 'text-icon' },
  });
  const badgeEl = badgeOf(controller);
  assert.match(badgeEl.className, /ri__badge--reversed/);
});

test('badge accepts raw SVG markup as an icon', () => {
  const { controller } = mount({
    src: 'a.png',
    aspectRatio: '1 / 1',
    badge: {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>',
    },
  });
  const badgeEl = badgeOf(controller);
  assert.ok(childOf(badgeEl, '.ri__badge__icon').querySelector('svg'));
});

test('update can change and remove the badge', () => {
  const { controller } = mount({
    src: 'a.png',
    aspectRatio: '1 / 1',
    badge: { text: 'A', position: 'top-left' },
  });
  const badgeEl = badgeOf(controller);
  controller.update({ badge: { text: 'B', position: 'bottom-right' } });
  assert.match(badgeEl.className, /ri__badge--bottom-right/);
  assert.equal(childOf(badgeEl, '.ri__badge__text').textContent, 'B');
  controller.update({ badge: null });
  assert.equal(badgeEl.style.display, 'none');
});

test('badge element exists but stays hidden when no badge is configured', () => {
  const { controller } = mount({ src: 'a.png', aspectRatio: '1 / 1' });
  const badgeEl = badgeOf(controller);
  assert.equal(badgeEl.style.display, 'none');
});
