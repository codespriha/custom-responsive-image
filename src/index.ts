export { createResponsiveImage } from './image.js';
export type {
  ResponsiveImageOptions,
  ResponsiveImageController,
  ObjectFitValue,
  ResponsiveImageBadge,
  BadgePosition,
  BadgeTheme,
} from './image.js';

export {
  getResponsiveImageConfig,
  setResponsiveImageConfig,
  resetResponsiveImageConfig,
} from './config.js';
export type { ResponsiveImageConfig } from './config.js';

export { RESPONSIVE_IMAGE_CSS, injectResponsiveImageStyles } from './styles.js';
