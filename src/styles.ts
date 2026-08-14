/**
 * Base styles for the responsive image component, injected into the document
 * on first use so consumers do not have to manage a separate CSS file.
 *
 * The component marks up a `.ri` container with a `.ri__img` child. The JS
 * switches the child between three visual modes:
 *
 * - `.ri__img--fill`     (image fills an explicit aspect-ratio box with `object-fit`)
 * - `.ri__img--natural`  (no aspect ratio: image is fluid, height follows ratio)
 * - plain `.ri__img`     (small image: natural size, contained + centered)
 */

export const RESPONSIVE_IMAGE_CSS = `
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

let injected = false;

/** Inject the base styles once. Safe to call multiple times; no-ops in SSR. */
export function injectResponsiveImageStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-custom-responsive-image', '');
  style.textContent = RESPONSIVE_IMAGE_CSS;
  document.head.appendChild(style);
  injected = true;
}
