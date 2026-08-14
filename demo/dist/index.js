// dist/esm/config.js
var DEFAULT_CONFIG = {
  smallImageThreshold: 160
};
var config = { ...DEFAULT_CONFIG };
function getResponsiveImageConfig() {
  return { ...config };
}
function setResponsiveImageConfig(patch) {
  config = { ...config, ...patch };
  return getResponsiveImageConfig();
}

// dist/esm/styles.js
var RESPONSIVE_IMAGE_CSS = `
.ri {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.ri__img {
  display: block;
  flex: none;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
}

.ri__img--fill {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
}

.ri__img--natural {
  width: 100%;
  height: auto;
  max-width: none;
  max-height: none;
}

.ri__badge {
  position: absolute;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100% - 16px);
  padding: 3px 8px;
  border-radius: 999px;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ri-badge-color, #ffffff);
  background: var(--ri-badge-bg, rgba(17, 17, 17, 0.72));
}

.ri__badge--reversed {
  flex-direction: row-reverse;
}

.ri__badge__icon {
  display: inline-flex;
  flex: none;
}

.ri__badge__icon svg {
  display: block;
  width: 1em;
  height: 1em;
}

.ri__badge--top-left {
  top: 8px;
  left: 8px;
}

.ri__badge--top-right {
  top: 8px;
  right: 8px;
}

.ri__badge--bottom-left {
  bottom: 8px;
  left: 8px;
}

.ri__badge--bottom-right {
  bottom: 8px;
  right: 8px;
}

.ri__badge--light {
  --ri-badge-color: #1d1d1f;
  --ri-badge-bg: rgba(255, 255, 255, 0.9);
}
`.trim();
var injected = false;
function injectResponsiveImageStyles() {
  if (injected)
    return;
  if (typeof document === "undefined")
    return;
  const style = document.createElement("style");
  style.setAttribute("data-custom-responsive-image", "");
  style.textContent = RESPONSIVE_IMAGE_CSS;
  document.head.appendChild(style);
  injected = true;
}

// dist/esm/image.js
var BOX_CLASS = "ri--box";
function toCssAspectRatio(value) {
  if (value === void 0)
    return null;
  if (typeof value === "number") {
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
function createResponsiveImage(container, options) {
  if (typeof document === "undefined") {
    throw new Error("createResponsiveImage requires a DOM environment.");
  }
  injectResponsiveImageStyles();
  const element = document.createElement("div");
  element.className = "ri";
  const image = document.createElement("img");
  image.className = "ri__img";
  image.decoding = "async";
  element.appendChild(image);
  const badge = document.createElement("span");
  badge.className = "ri__badge";
  badge.style.display = "none";
  const badgeIcon = document.createElement("span");
  badgeIcon.className = "ri__badge__icon";
  const badgeText = document.createElement("span");
  badgeText.className = "ri__badge__text";
  badge.append(badgeIcon, badgeText);
  element.appendChild(badge);
  container.appendChild(element);
  let current = { ...options };
  const state = {
    aspectRatio: void 0,
    objectFit: "auto",
    small: void 0,
    userClass: "",
    natural: null
  };
  let destroyed = false;
  function isSmall() {
    if (state.small !== void 0)
      return state.small;
    const { smallImageThreshold } = getResponsiveImageConfig();
    const n = state.natural;
    if (n && n.width > 0 && Math.max(n.width, n.height) < smallImageThreshold) {
      return true;
    }
    return false;
  }
  function adaptiveFit() {
    const n = state.natural;
    const boxW = element.clientWidth;
    const boxH = element.clientHeight;
    if (!n || n.width <= 0 || boxW <= 0 || boxH <= 0)
      return "contain";
    return n.width > boxW || n.height > boxH ? "cover" : "contain";
  }
  function objectFitValue() {
    if (state.objectFit === "contain" || state.objectFit === "cover") {
      return state.objectFit;
    }
    return adaptiveFit();
  }
  function refresh() {
    if (destroyed)
      return;
    const small = isSmall();
    const hasBox = element.classList.contains(BOX_CLASS);
    const modifiers = small ? [] : hasBox ? ["ri__img--fill"] : ["ri__img--natural"];
    const parts = ["ri__img"];
    for (const cls of state.userClass.split(/\s+/)) {
      if (cls)
        parts.push(cls);
    }
    image.className = parts.concat(modifiers).join(" ");
    image.style.objectFit = small ? "contain" : objectFitValue();
  }
  function renderBadge(badgeOpts) {
    if (!badgeOpts) {
      badge.style.display = "none";
      return;
    }
    badge.style.display = "";
    const position = badgeOpts.position ?? "bottom-right";
    const theme = badgeOpts.theme ?? "dark";
    badge.className = `ri__badge ri__badge--${position} ri__badge--${theme}` + (badgeOpts.order === "text-icon" ? " ri__badge--reversed" : "");
    if (badgeOpts.icon) {
      badgeIcon.style.display = "";
      if (badgeOpts.icon.includes("<")) {
        badgeIcon.innerHTML = badgeOpts.icon;
      } else {
        badgeIcon.textContent = badgeOpts.icon;
      }
    } else {
      badgeIcon.style.display = "none";
      badgeIcon.innerHTML = "";
    }
    if (badgeOpts.text) {
      badgeText.style.display = "";
      badgeText.textContent = badgeOpts.text;
    } else {
      badgeText.style.display = "none";
      badgeText.textContent = "";
    }
  }
  function applyOptions(opts) {
    state.aspectRatio = opts.aspectRatio;
    state.objectFit = opts.objectFit ?? "auto";
    state.small = opts.small;
    const ratioCss = toCssAspectRatio(opts.aspectRatio);
    if (ratioCss) {
      element.style.aspectRatio = ratioCss;
      element.classList.add(BOX_CLASS);
    } else {
      element.style.aspectRatio = "";
      element.classList.remove(BOX_CLASS);
    }
    image.alt = opts.alt ?? "";
    image.setAttribute("loading", opts.loading ?? "lazy");
    image.setAttribute("fetchpriority", opts.fetchPriority ?? "auto");
    if (opts.crossOrigin !== void 0)
      image.crossOrigin = opts.crossOrigin;
    state.userClass = opts.className ?? "";
    if (image.getAttribute("src") !== opts.src) {
      state.natural = null;
      image.src = opts.src;
    }
    renderBadge(opts.badge);
    refresh();
  }
  function onLoad() {
    if (image.naturalWidth > 0) {
      state.natural = { width: image.naturalWidth, height: image.naturalHeight };
    }
    refresh();
  }
  image.addEventListener("load", onLoad);
  let resizeObserver = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => refresh());
    resizeObserver.observe(element);
  }
  applyOptions(options);
  if (image.naturalWidth > 0)
    onLoad();
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
    getNaturalSize: () => state.natural ? { ...state.natural } : null,
    getObjectFit: () => objectFitValue(),
    refresh: () => refresh(),
    update(patch) {
      current = { ...current, ...patch };
      applyOptions(current);
    },
    destroy() {
      if (destroyed)
        return;
      destroyed = true;
      resizeObserver?.disconnect();
      image.removeEventListener("load", onLoad);
      image.removeAttribute("src");
      element.remove();
    }
  };
}

// demo/main.js
function svgUri(width, height, bg, label, textColor = "#ffffff") {
  const size = Math.round(Math.min(width, height) * 0.14);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='${size}' fill='${textColor}'>${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
var LANDSCAPE = svgUri(1600, 900, "#4a7fc1", "1600 \xD7 900 photo");
var PORTRAIT = svgUri(900, 1600, "#c15f4a", "900 \xD7 1600 photo");
var ICON = svgUri(64, 64, "#7cb342", "64px icon");
var ICON_SMALL = svgUri(128, 128, "#8d6e63", "128px");
var MEDIUM = svgUri(320, 240, "#5e6488", "320 \xD7 240");
var FLUID = svgUri(640, 200, "#7eb8a0", "fluid 640 \xD7 200");
createResponsiveImage(document.querySelector("#demo-auto-cover"), {
  src: LANDSCAPE,
  alt: "Auto: covers because the image is bigger than the box",
  aspectRatio: "16 / 9",
  badge: { icon: "\u2605", text: "Featured", position: "bottom-right" }
});
createResponsiveImage(document.querySelector("#demo-auto-fit"), {
  src: MEDIUM,
  alt: "Auto: fits because the image fits inside the box",
  aspectRatio: "16 / 9",
  badge: { text: "In stock", position: "top-left", theme: "light" }
});
createResponsiveImage(document.querySelector("#demo-cover"), {
  src: LANDSCAPE,
  alt: "Forced cover",
  aspectRatio: "16 / 9",
  objectFit: "cover",
  badge: { icon: "\u{1F525}", position: "bottom-left" }
});
createResponsiveImage(document.querySelector("#demo-contain"), {
  src: PORTRAIT,
  alt: "Forced contain",
  aspectRatio: "1 / 1",
  objectFit: "contain",
  badge: { icon: "\u2726", text: "New", order: "text-icon", position: "top-right" }
});
createResponsiveImage(document.querySelector("#demo-icon"), {
  src: ICON,
  alt: "Small icon, auto-detected, contained + centered",
  aspectRatio: "1 / 1"
});
createResponsiveImage(document.querySelector("#demo-icon-wide"), {
  src: ICON,
  alt: "Small icon centered in a wide box",
  aspectRatio: "3 / 1"
});
createResponsiveImage(document.querySelector("#demo-small"), {
  src: ICON_SMALL,
  alt: "Small image with forced small behaviour",
  aspectRatio: "1 / 1",
  small: true
});
createResponsiveImage(document.querySelector("#demo-fluid"), {
  src: FLUID,
  alt: "No aspect ratio: fluid image"
});
var thresholdDemo = createResponsiveImage(document.querySelector("#demo-threshold"), {
  src: MEDIUM,
  alt: "A 320\xD7240 image; threshold demo below",
  aspectRatio: "4 / 3"
});
var badgeDemo = createResponsiveImage(document.querySelector("#demo-badge"), {
  src: LANDSCAPE,
  alt: "Badge variants",
  aspectRatio: "16 / 9",
  badge: { icon: "\u2605", text: "Featured", position: "bottom-right", theme: "dark" }
});
var badgePositionEl = document.querySelector("#badge-position");
var badgeThemeEl = document.querySelector("#badge-theme");
var badgeOrderEl = document.querySelector("#badge-order");
var badgeIconEl = document.querySelector("#badge-icon");
var badgeTextEl = document.querySelector("#badge-text");
function applyBadgeDemo() {
  const icon = badgeIconEl.checked ? "\u2605" : void 0;
  const text = badgeTextEl.checked ? "Featured" : void 0;
  badgeDemo.update({
    badge: icon || text ? {
      icon,
      text,
      order: badgeOrderEl.value,
      position: badgePositionEl.value,
      theme: badgeThemeEl.value
    } : null
  });
}
[badgePositionEl, badgeThemeEl, badgeOrderEl, badgeIconEl, badgeTextEl].forEach(
  (el) => el.addEventListener("change", applyBadgeDemo)
);
document.querySelector("#threshold-est").textContent = `current smallImageThreshold = ${getResponsiveImageConfig().smallImageThreshold}px`;
document.querySelector("#btn-threshold").addEventListener("click", () => {
  const next = getResponsiveImageConfig().smallImageThreshold === 160 ? 400 : 160;
  setResponsiveImageConfig({ smallImageThreshold: next });
  document.querySelector("#threshold-est").textContent = `current smallImageThreshold = ${getResponsiveImageConfig().smallImageThreshold}px`;
  thresholdDemo.refresh();
});
