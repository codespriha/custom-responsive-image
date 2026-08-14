import {
  createResponsiveImage,
  setResponsiveImageConfig,
  getResponsiveImageConfig,
} from '../dist/esm/index.js';

// --------------------------------------------------------------------- assets
function svgUri(width, height, bg, label, textColor = '#ffffff') {
  const size = Math.round(Math.min(width, height) * 0.14);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>` +
    `<rect width='100%' height='100%' fill='${bg}'/>` +
    `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' ` +
    `font-family='sans-serif' font-size='${size}' fill='${textColor}'>${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const LANDSCAPE = svgUri(1600, 900, '#4a7fc1', '1600 × 900 photo');
const PORTRAIT = svgUri(900, 1600, '#c15f4a', '900 × 1600 photo');
const ICON = svgUri(64, 64, '#7cb342', '64px icon');
const ICON_SMALL = svgUri(128, 128, '#8d6e63', '128px');
const MEDIUM = svgUri(320, 240, '#5e6488', '320 × 240');
const FLUID = svgUri(640, 200, '#7eb8a0', 'fluid 640 × 200');

// --------------------------------------------------------------------- demos
createResponsiveImage(document.querySelector('#demo-auto-cover'), {
  src: LANDSCAPE,
  alt: 'Auto: covers because the image is bigger than the box',
  aspectRatio: '16 / 9',
  badge: { icon: '★', text: 'Featured', position: 'bottom-right' },
});

createResponsiveImage(document.querySelector('#demo-auto-fit'), {
  src: MEDIUM,
  alt: 'Auto: fits because the image fits inside the box',
  aspectRatio: '16 / 9',
  badge: { text: 'In stock', position: 'top-left', theme: 'light' },
});

createResponsiveImage(document.querySelector('#demo-cover'), {
  src: LANDSCAPE,
  alt: 'Forced cover',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
  badge: { icon: '🔥', position: 'bottom-left' },
});

createResponsiveImage(document.querySelector('#demo-contain'), {
  src: PORTRAIT,
  alt: 'Forced contain',
  aspectRatio: '1 / 1',
  objectFit: 'contain',
  badge: { icon: '✦', text: 'New', order: 'text-icon', position: 'top-right' },
});

createResponsiveImage(document.querySelector('#demo-icon'), {
  src: ICON,
  alt: 'Small icon, auto-detected, contained + centered',
  aspectRatio: '1 / 1',
});

createResponsiveImage(document.querySelector('#demo-icon-wide'), {
  src: ICON,
  alt: 'Small icon centered in a wide box',
  aspectRatio: '3 / 1',
});

createResponsiveImage(document.querySelector('#demo-small'), {
  src: ICON_SMALL,
  alt: 'Small image with forced small behaviour',
  aspectRatio: '1 / 1',
  small: true,
});

createResponsiveImage(document.querySelector('#demo-fluid'), {
  src: FLUID,
  alt: 'No aspect ratio: fluid image',
});

const thresholdDemo = createResponsiveImage(document.querySelector('#demo-threshold'), {
  src: MEDIUM,
  alt: 'A 320×240 image; threshold demo below',
  aspectRatio: '4 / 3',
});

const badgeDemo = createResponsiveImage(document.querySelector('#demo-badge'), {
  src: LANDSCAPE,
  alt: 'Badge variants',
  aspectRatio: '16 / 9',
  badge: { icon: '★', text: 'Featured', position: 'bottom-right', theme: 'dark' },
});

// ------------------------------------------------------------ badge controls
const badgePositionEl = document.querySelector('#badge-position');
const badgeThemeEl = document.querySelector('#badge-theme');
const badgeOrderEl = document.querySelector('#badge-order');
const badgeIconEl = document.querySelector('#badge-icon');
const badgeTextEl = document.querySelector('#badge-text');

function applyBadgeDemo() {
  const icon = badgeIconEl.checked ? '★' : undefined;
  const text = badgeTextEl.checked ? 'Featured' : undefined;
  badgeDemo.update({
    badge:
      icon || text
        ? {
            icon,
            text,
            order: badgeOrderEl.value,
            position: badgePositionEl.value,
            theme: badgeThemeEl.value,
          }
        : null,
  });
}

[badgePositionEl, badgeThemeEl, badgeOrderEl, badgeIconEl, badgeTextEl].forEach((el) =>
  el.addEventListener('change', applyBadgeDemo),
);

// ------------------------------------------------------------------- controls
document.querySelector('#threshold-est').textContent =
  `current smallImageThreshold = ${getResponsiveImageConfig().smallImageThreshold}px`;

document.querySelector('#btn-threshold').addEventListener('click', () => {
  const next = getResponsiveImageConfig().smallImageThreshold === 160 ? 400 : 160;
  setResponsiveImageConfig({ smallImageThreshold: next });
  document.querySelector('#threshold-est').textContent =
    `current smallImageThreshold = ${getResponsiveImageConfig().smallImageThreshold}px`;
  thresholdDemo.refresh(); // re-evaluate smallness against the new threshold
});
