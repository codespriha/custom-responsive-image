import { getResponsiveImageConfig } from './config.js';
import { injectResponsiveImageStyles } from './styles.js';

/** Accepted value for the component's `objectFit` option. */
export type ObjectFitValue = 'contain' | 'cover' | 'auto';

/** Corner placement for the optional badge. */
export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Color theme for the optional badge. */
export type BadgeTheme = 'dark' | 'light';

/** Optional badge rendered over the image (icon, text, or both). */
export interface ResponsiveImageBadge {
  /** Icon content: an emoji/glyph, or raw SVG markup (a string containing `<`). */
  icon?: string;
  /** Badge label text. */
  text?: string;
  /** Order of icon and text. Defaults to `'icon-text'`. */
  order?: 'icon-text' | 'text-icon';
  /** Corner placement inside the image box. Defaults to `'bottom-right'`. */
  position?: BadgePosition;
  /** Color theme. Defaults to `'dark'`. */
  theme?: BadgeTheme;
}

/** Options for {@link createResponsiveImage}. */
export interface ResponsiveImageOptions {
  /** Image source URL. */
  src: string;
  /** Accessible alt text. */
  alt?: string;
  /**
   * Aspect ratio the container must keep strictly, e.g. `16 / 9`, `'16:9'` or `1.5`.
   * When omitted the container does not force a ratio and the image stays fluid.
   */
  aspectRatio?: number | string;
  /**
   * How the image fits its box. `'auto'` (default) picks `cover` when the image
   * is bigger than the container in any dimension, otherwise `contain`.
   */
  objectFit?: ObjectFitValue;
  /**
   * Force small-image treatment (always `contain` + centered, never upscaled).
   * When omitted, smallness is auto-detected from the global
   * `smallImageThreshold` config and the image's natural size.
   */
  small?: boolean;
  /** Extra class(es) added to the `<img>` element. */
  className?: string;
  /** Optional badge overlaid on the image box. Pass `null` to hide it. */
  badge?: ResponsiveImageBadge | null;
  /** Native `loading` attribute. Defaults to `'lazy'`. */
  loading?: 'lazy' | 'eager';
  /** Native `fetchpriority` attribute. */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Native `crossorigin` attribute value. */
  crossOrigin?: string;
}

/** Controller returned by {@link createResponsiveImage}. */
export interface ResponsiveImageController {
  /** The created container element (`.ri`). */
  readonly element: HTMLElement;
  /** The created `<img>` element. */
  readonly image: HTMLImageElement;
  /** Whether the image is currently treated as a small image. */
  readonly isSmall: boolean;
  /** Natural pixel size of the loaded image, or `null` before it loads. */
  getNaturalSize(): { width: number; height: number } | null;
  /** The resolved `object-fit` value (`'contain'` or `'cover'`). */
  getObjectFit(): 'contain' | 'cover';
  /**
   * Re-evaluate sizing decisions (small detection, adaptive `object-fit`)
   * against the current layout and global config. Useful after a layout or
   * config change. Options are left untouched.
   */
  refresh(): void;
  /** Apply a partial options patch. */
  update(patch: Partial<ResponsiveImageOptions>): void;
  /** Remove the component from the DOM and release observers/listeners. */
  destroy(): void;
}

interface InternalState {
  aspectRatio: number | string | undefined;
  objectFit: ObjectFitValue;
  small: boolean | undefined;
  userClass: string;
  natural: { width: number; height: number } | null;
}

const BOX_CLASS = 'ri--box';

function toCssAspectRatio(value: number | string | undefined): string | null {
  if (value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? String(value) : null;
  }
  const trimmed = value.trim();
  const pair = trimmed.match(/^(\d+(?:\.\d+)?)\s*[/:]\s*(\d+(?:\.\d+)?)$/);
  if (pair) {
    const a = Number(pair[1]);
    const b = Number(pair[2]);
    return a > 0 && b > 0 ? `${a} / ${b}` : null;
  }
  const single = Number(trimmed);
  return Number.isFinite(single) && single > 0 ? trimmed : null;
}

/**
 * Create a fully responsive image component inside `container`.
 *
 * @param container The element the component mounts into.
 * @param options   Image configuration.
 */
export function createResponsiveImage(
  container: HTMLElement,
  options: ResponsiveImageOptions,
): ResponsiveImageController {
  if (typeof document === 'undefined') {
    throw new Error('createResponsiveImage requires a DOM environment.');
  }

  injectResponsiveImageStyles();

  const element = document.createElement('div');
  element.className = 'ri';

  const image = document.createElement('img');
  image.className = 'ri__img';
  image.decoding = 'async';
  element.appendChild(image);

  const badge = document.createElement('span');
  badge.className = 'ri__badge';
  badge.style.display = 'none';
  const badgeIcon = document.createElement('span');
  badgeIcon.className = 'ri__badge__icon';
  const badgeText = document.createElement('span');
  badgeText.className = 'ri__badge__text';
  badge.append(badgeIcon, badgeText);
  element.appendChild(badge);

  container.appendChild(element);

  let current: ResponsiveImageOptions = { ...options };

  const state: InternalState = {
    aspectRatio: undefined,
    objectFit: 'auto',
    small: undefined,
    userClass: '',
    natural: null,
  };

  let destroyed = false;

  function isSmall(): boolean {
    if (state.small !== undefined) return state.small;
    const { smallImageThreshold } = getResponsiveImageConfig();
    const n = state.natural;
    if (n && n.width > 0 && Math.max(n.width, n.height) < smallImageThreshold) {
      return true;
    }
    return false;
  }

  function adaptiveFit(): 'contain' | 'cover' {
    const n = state.natural;
    const boxW = element.clientWidth;
    const boxH = element.clientHeight;
    if (!n || n.width <= 0 || boxW <= 0 || boxH <= 0) return 'contain';
    // Cover only when the image is bigger than the container in some dimension;
    // otherwise keep it fitted so small images are never upscaled into blur.
    return n.width > boxW || n.height > boxH ? 'cover' : 'contain';
  }

  function objectFitValue(): 'contain' | 'cover' {
    if (state.objectFit === 'contain' || state.objectFit === 'cover') {
      return state.objectFit;
    }
    return adaptiveFit();
  }

  function refresh(): void {
    if (destroyed) return;
    const small = isSmall();
    const hasBox = element.classList.contains(BOX_CLASS);

    // The modifier classes describe the current visual mode and live on the
    // <img> alongside any user-provided classes.
    const modifiers = small ? [] : hasBox ? ['ri__img--fill'] : ['ri__img--natural'];
    const parts = ['ri__img'];
    for (const cls of state.userClass.split(/\s+/)) {
      if (cls) parts.push(cls);
    }
    image.className = parts.concat(modifiers).join(' ');

    // Small images are always contained and centered; never cropped.
    image.style.objectFit = small ? 'contain' : objectFitValue();
  }

  function renderBadge(badgeOpts: ResponsiveImageBadge | null | undefined): void {
    if (!badgeOpts) {
      badge.style.display = 'none';
      return;
    }
    badge.style.display = '';

    const position = badgeOpts.position ?? 'bottom-right';
    const theme = badgeOpts.theme ?? 'dark';
    badge.className =
      `ri__badge ri__badge--${position} ri__badge--${theme}` +
      (badgeOpts.order === 'text-icon' ? ' ri__badge--reversed' : '');

    if (badgeOpts.icon) {
      badgeIcon.style.display = '';
      if (badgeOpts.icon.includes('<')) {
        badgeIcon.innerHTML = badgeOpts.icon;
      } else {
        badgeIcon.textContent = badgeOpts.icon;
      }
    } else {
      badgeIcon.style.display = 'none';
      badgeIcon.innerHTML = '';
    }

    if (badgeOpts.text) {
      badgeText.style.display = '';
      badgeText.textContent = badgeOpts.text;
    } else {
      badgeText.style.display = 'none';
      badgeText.textContent = '';
    }
  }

  function applyOptions(opts: ResponsiveImageOptions): void {
    state.aspectRatio = opts.aspectRatio;
    state.objectFit = opts.objectFit ?? 'auto';
    state.small = opts.small;

    const ratioCss = toCssAspectRatio(opts.aspectRatio);
    if (ratioCss) {
      element.style.aspectRatio = ratioCss;
      element.classList.add(BOX_CLASS);
    } else {
      element.style.aspectRatio = '';
      element.classList.remove(BOX_CLASS);
    }

    image.alt = opts.alt ?? '';
    image.setAttribute('loading', opts.loading ?? 'lazy');
    image.setAttribute('fetchpriority', opts.fetchPriority ?? 'auto');
    if (opts.crossOrigin !== undefined) image.crossOrigin = opts.crossOrigin;

    state.userClass = opts.className ?? '';

    if (image.getAttribute('src') !== opts.src) {
      state.natural = null;
      image.src = opts.src;
    }

    renderBadge(opts.badge);

    refresh();
  }

  function onLoad(): void {
    if (image.naturalWidth > 0) {
      state.natural = { width: image.naturalWidth, height: image.naturalHeight };
    }
    refresh();
  }

  image.addEventListener('load', onLoad);

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => refresh());
    resizeObserver.observe(element);
  }

  applyOptions(options);

  // The image may already be cached/complete by the time the listener is set.
  if (image.naturalWidth > 0) onLoad();

  return {
    get element() {
      return element;
    },
    get image() {
      return image;
    },
    get isSmall() {
      return isSmall();
    },
    getNaturalSize: () => (state.natural ? { ...state.natural } : null),
    getObjectFit: () => objectFitValue(),
    refresh: () => refresh(),
    update(patch: Partial<ResponsiveImageOptions>) {
      current = { ...current, ...patch };
      applyOptions(current);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resizeObserver?.disconnect();
      image.removeEventListener('load', onLoad);
      image.removeAttribute('src');
      element.remove();
    },
  };
}
