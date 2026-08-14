/**
 * Global configuration for `custom-responsive-image`.
 */

export interface ResponsiveImageConfig {
  /**
   * Images whose largest natural dimension (in px) is below this value are
   * automatically treated as small (icon/illustration) images — i.e. always
   * `contain` and centered, never upscaled or cropped. Defaults to `160`.
   */
  smallImageThreshold: number;
}

const DEFAULT_CONFIG: ResponsiveImageConfig = {
  smallImageThreshold: 160,
};

let config: ResponsiveImageConfig = { ...DEFAULT_CONFIG };

/** Get a copy of the current global config. */
export function getResponsiveImageConfig(): ResponsiveImageConfig {
  return { ...config };
}

/**
 * Patch the global config. Returns the updated config.
 *
 * @example
 * setResponsiveImageConfig({ smallImageThreshold: 100 });
 */
export function setResponsiveImageConfig(
  patch: Partial<ResponsiveImageConfig>,
): ResponsiveImageConfig {
  config = { ...config, ...patch };
  return getResponsiveImageConfig();
}

/** Restore the default global config. Returns the reset config. */
export function resetResponsiveImageConfig(): ResponsiveImageConfig {
  config = { ...DEFAULT_CONFIG };
  return getResponsiveImageConfig();
}
