# custom-responsive-image

A framework-agnostic, headless responsive image component.

The component mounts a container + `<img>` into any DOM element and gives you:

- **Strict aspect ratio** — pass `aspectRatio` and the container box always keeps it.
- **`object-fit: contain | cover | auto`** — `auto` (default) picks `cover` when the image is
dimensionally bigger than its box, otherwise `contain`.
- **Small image (icon/illustration) handling** — images smaller than a global threshold are
automatically `contain`ed and centered, never upscaled or cropped. Can also be forced per instance.
- **Fully responsive** — the container is `width: 100%` of its parent; no pixel sizes required.

## Install

```bash
npm install custom-responsive-image
```

## Quick start

```ts
import { createResponsiveImage } from 'custom-responsive-image';

// 16:9 box, image covers the box when it is bigger than it, else it fits.
const hero = createResponsiveImage(document.querySelector('#hero'), {
  src: '/photos/hero.jpg',
  alt: 'Hero photo',
  aspectRatio: '16 / 9',
});

// 1:1 icon box, always contain + centered (auto-detected as small, 64px).
const icon = createResponsiveImage(document.querySelector('#icon'), {
  src: '/icons/logo.svg',
  alt: 'Logo',
  aspectRatio: '1 / 1',
});

// Cover always.
const cover = createResponsiveImage(document.querySelector('#cover'), {
  src: '/photos/banner.jpg',
  aspectRatio: 4 / 3,
  objectFit: 'cover',
});
```

## Options

| Option          | Type                            | Default    | Description                                                                  |
| --------------- | ------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `src`           | `string`                        | (required) | Image URL.                                                                   |
| `alt`           | `string`                        | `''`       | Alt text.                                                                    |
| `aspectRatio`   | `number \| string`              | —          | Strict container ratio, e.g. `16 / 9`, `'16:9'`, `1.5`. Omit for fluid.      |
| `objectFit`     | `'contain' \| 'cover' \| 'auto'` | `'auto'`   | `auto` = cover if image is dimensionally bigger than the box, else contain.  |
| `small`         | `boolean`                       | auto       | Force small-image treatment (contain + centered).                            |
| `className`     | `string`                        | —          | Extra class(es) on the `<img>` (state modifier classes are added after them). |
| `badge`         | `ResponsiveImageBadge \| null`  | —          | Optional corner badge (icon / text / icon+text / text+icon).                  |
| `loading`       | `'lazy' \| 'eager'`             | `'lazy'`   | Native `loading` attribute.                                                  |
| `fetchPriority` | `'high' \| 'low' \| 'auto'`     | `'auto'`   | Native `fetchpriority` attribute.                                            |
| `crossOrigin`   | `string`                        | —          | Native `crossorigin` attribute.                                              |

## Behaviour

### Aspect ratio is strict

When `aspectRatio` is provided the container uses CSS `aspect-ratio`, so the box keeps the ratio
at every width. Without it the container is fluid — the `<img>` is `width: 100%; height: auto`
and the container grows with the image.

### `objectFit: 'auto'` (default)

The component measures the image's natural size and the container box, then:

- image dimension bigger than the box → `cover`
- otherwise → `contain`

The decision is re-evaluated on image load and on container resize (via `ResizeObserver`, when
available).

### Small images (icons / illustrations)

An image is small when its largest natural dimension is below a global threshold (default **160px**).
Small images are always:

- `object-fit: contain` and centered,
- never upscaled beyond their natural size,
- never cropped.

```ts
import { setResponsiveImageConfig } from 'custom-responsive-image';

setResponsiveImageConfig({ smallImageThreshold: 100 });
```

Pass `small: true` / `small: false` to force the behaviour for a specific image and override
auto-detection.

## Badge

An optional badge can be overlaid on the image box. It supports icon only, text only, icon+text or
text+icon, any of the four corners, and light/dark color themes:

```ts
createResponsiveImage(el, {
  src: 'photo.jpg',
  aspectRatio: '16 / 9',
  badge: {
    icon: '★',
    text: 'Featured',
    order: 'icon-text',        // 'icon-text' | 'text-icon' (default 'icon-text')
    position: 'bottom-right',  // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    theme: 'dark',             // 'dark' | 'light' (default 'dark')
  },
});
```

- `icon` accepts an emoji/glyph or raw SVG markup (any string containing `<`).
- Omit `icon` or `text` to show only the other.
- Themes `'dark'` and `'light'` use the `--ri-badge-color` and `--ri-badge-bg` CSS variables, so a
  custom theme is just a CSS override:

  ```css
  .ri__badge {
    --ri-badge-color: #ffffff;
    --ri-badge-bg: #b54507;
  }
  ```

- Pass `badge: null` (or omit it) to hide the badge; `update({ badge: {...} })` replaces it.

## Controller API

```ts
const controller = createResponsiveImage(container, options);

controller.element; // the created container div
controller.image; // the created <img>
controller.isSmall; // whether it is treated as small
controller.getNaturalSize(); // { width, height } | null
controller.getObjectFit(); // 'contain' | 'cover'
controller.refresh(); // re-evaluate against current layout/config
controller.update({ src: 'new.jpg', aspectRatio: '4 / 3' });
controller.destroy(); // remove from DOM + cleanup
```

## Global config

```ts
import {
  getResponsiveImageConfig,
  setResponsiveImageConfig,
  resetResponsiveImageConfig,
} from 'custom-responsive-image';
```

## Styles

Base styles are injected once automatically on first use. You can import the raw CSS or inject it
manually:

```ts
import { RESPONSIVE_IMAGE_CSS, injectResponsiveImageStyles } from 'custom-responsive-image';
```

## Demo

Live demo: <https://codespriha.github.io/custom-responsive-image/demo/>

Run it locally:

```bash
npm run build && npm run build:demo
npx serve .
```

Then open the demo at the served path.

## License

MIT
