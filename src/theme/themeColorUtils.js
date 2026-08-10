const HEX_PATTERN = /^#([\da-f]{3}|[\da-f]{6})$/i;
const RGB_PATTERN = /^rgba?\(([^)]+)\)$/i;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function parseColor(input) {
  if (typeof input !== 'string') return null;
  const color = input.trim();

  if (HEX_PATTERN.test(color)) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((part) => part + part).join('');
    }

    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgbMatch = color.match(RGB_PATTERN);
  if (!rgbMatch) return null;

  const parts = rgbMatch[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return null;

  return {
    r: clamp(Number(parts[0]), 0, 255),
    g: clamp(Number(parts[1]), 0, 255),
    b: clamp(Number(parts[2]), 0, 255),
    a: parts[3] === undefined ? 1 : clamp(Number(parts[3]), 0, 1),
  };
}

function toHex(color) {
  if (!color) return null;

  return `#${[color.r, color.g, color.b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function toRgba(color, alpha = color?.a ?? 1) {
  if (!color) return null;

  return `rgba(${Math.round(clamp(color.r, 0, 255))},${Math.round(clamp(color.g, 0, 255))},${Math.round(clamp(color.b, 0, 255))},${clamp(alpha, 0, 1)})`;
}

function mix(colorA, colorB, weight = 0.5) {
  const a = parseColor(colorA);
  const b = parseColor(colorB);
  if (!a || !b) return colorA;

  const ratio = clamp(weight, 0, 1);

  return {
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
    a: a.a + (b.a - a.a) * ratio,
  };
}

function luminance(input) {
  const color = parseColor(input);
  if (!color) return 0;

  const [r, g, b] = [color.r, color.g, color.b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ensureReadable(color, targetMode) {
  const parsed = parseColor(color);
  if (!parsed) return color;

  if (targetMode === 'dark' && luminance(color) < 0.5) {
    return toHex(mix(color, '#ffffff', 0.15));
  }

  if (targetMode === 'light' && luminance(color) > 0.5) {
    return toHex(mix(color, '#111827', 0.12));
  }

  return toHex(parsed);
}

function semanticRamp(color, targetMode) {
  const base = ensureReadable(color, targetMode);

  if (targetMode === 'dark') {
    return {
      color: base,
      bg: toRgba(parseColor(base), 0.14),
      border: toRgba(parseColor(base), 0.34),
    };
  }

  return {
    color: base,
    bg: toHex(mix(base, '#ffffff', 0.88)),
    border: toHex(mix(base, '#ffffff', 0.72)),
  };
}

function buildModeColors(colors, targetMode) {
  const primary = ensureReadable(colors.primary, targetMode);
  const success = semanticRamp(colors.success, targetMode);
  const danger = semanticRamp(colors.danger, targetMode);
  const warning = semanticRamp(colors.warning, targetMode);
  const info = semanticRamp(colors.info, targetMode);

  const lightBase = '#fbfaf8';
  const darkBase = '#0b0d12';
  const background = targetMode === 'dark'
    ? toHex(mix(primary, darkBase, 0.9))
    : toHex(mix(primary, lightBase, 0.95));

  const backgroundElevated = targetMode === 'dark'
    ? toHex(mix(primary, '#121722', 0.88))
    : '#ffffff';

  const backgroundSurface = targetMode === 'dark'
    ? toHex(mix(primary, '#171d29', 0.84))
    : toHex(mix(primary, '#f4f4f5', 0.9));

  const backgroundCard = targetMode === 'dark'
    ? toHex(mix(primary, '#1f2937', 0.8))
    : '#ffffff';

  const backgroundHover = targetMode === 'dark'
    ? toHex(mix(primary, '#2b3547', 0.74))
    : toHex(mix(primary, '#ebeef3', 0.82));

  const border = targetMode === 'dark'
    ? toHex(mix(primary, '#3a4456', 0.78))
    : toHex(mix(primary, '#d5dbe5', 0.82));

  const borderLight = targetMode === 'dark'
    ? toHex(mix(primary, '#2a3242', 0.84))
    : toHex(mix(primary, '#e6ebf2', 0.88));

  const textPrimary = targetMode === 'dark'
    ? toHex(mix(primary, '#f8fafc', 0.94))
    : toHex(mix(primary, '#111827', 0.88));

  const textSecondary = targetMode === 'dark'
    ? toHex(mix(primary, '#cbd5e1', 0.82))
    : toHex(mix(primary, '#475569', 0.76));

  const textTertiary = targetMode === 'dark'
    ? toHex(mix(primary, '#94a3b8', 0.78))
    : toHex(mix(primary, '#64748b', 0.7));

  const textMuted = targetMode === 'dark'
    ? toHex(mix(primary, '#64748b', 0.8))
    : toHex(mix(primary, '#94a3b8', 0.7));

  return {
    ...colors,
    primary,
    primaryLight: toHex(mix(primary, '#ffffff', targetMode === 'dark' ? 0.18 : 0.1)),
    primaryDark: toHex(mix(primary, '#000000', targetMode === 'dark' ? 0.16 : 0.22)),
    primaryDim: toRgba(parseColor(primary), targetMode === 'dark' ? 0.18 : 0.1),
    primaryBg: targetMode === 'dark'
      ? toRgba(parseColor(primary), 0.12)
      : toHex(mix(primary, '#ffffff', 0.9)),
    primaryBorder: targetMode === 'dark'
      ? toRgba(parseColor(primary), 0.42)
      : toHex(mix(primary, '#111827', 0.18)),
    background,
    backgroundElevated,
    backgroundSurface,
    backgroundCard,
    backgroundHover,
    textPrimary,
    textSecondary,
    textTertiary,
    textMuted,
    success: success.color,
    successBg: success.bg,
    successBorder: success.border,
    danger: danger.color,
    dangerBg: danger.bg,
    dangerBorder: danger.border,
    warning: warning.color,
    warningBg: warning.bg,
    warningBorder: warning.border,
    info: info.color,
    infoBg: info.bg,
    infoBorder: info.border,
    border,
    borderLight,
    borderFocus: primary,
    shadowSm: targetMode === 'dark' ? '0 1px 3px rgba(0,0,0,0.35)' : '0 1px 3px rgba(15,23,42,0.08)',
    shadowMd: targetMode === 'dark' ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 18px rgba(15,23,42,0.12)',
    shadowLg: targetMode === 'dark' ? '0 16px 40px rgba(0,0,0,0.5)' : '0 18px 42px rgba(15,23,42,0.16)',
    shadowGlow: targetMode === 'dark'
      ? `0 0 24px ${toRgba(parseColor(primary), 0.28)}`
      : `0 0 20px ${toRgba(parseColor(primary), 0.16)}`,
  };
}

function replaceColorStrings(value, colorMap) {
  if (typeof value === 'string') {
    return Object.entries(colorMap)
      .sort(([left], [right]) => right.length - left.length)
      .reduce((result, [source, target]) => result.split(source).join(target), value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceColorStrings(item, colorMap));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, replaceColorStrings(nestedValue, colorMap)])
    );
  }

  return value;
}

function cleanThemeName(name) {
  return String(name).replace(/\s+(Light|Dark)$/i, '').trim();
}

export function createThemeModeVariant(theme, targetMode) {
  if (!theme || !theme.colors || theme.mode === targetMode) {
    return theme;
  }

  const baseId = String(theme.id).replace(/-light$|-dark$/, '');
  const derivedColors = buildModeColors(theme.colors, targetMode);
  const colorMap = Object.fromEntries(
    Object.entries(theme.colors)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [value, derivedColors[key] ?? value])
  );

  const variant = replaceColorStrings(theme, colorMap);
  const label = targetMode === 'dark' ? 'Dark' : 'Light';

  return {
    ...variant,
    id: `${baseId}-${targetMode}`,
    name: `${cleanThemeName(theme.name)} ${label}`,
    description: `${cleanThemeName(theme.name)} theme in ${targetMode} mode`,
    mode: targetMode,
    colors: derivedColors,
    components: {
      ...variant.components,
      modal: {
        ...variant.components?.modal,
        overlay: {
          ...variant.components?.modal?.overlay,
          background: targetMode === 'dark' ? 'rgba(0,0,0,0.72)' : 'rgba(15,23,42,0.45)',
        },
      },
    },
    custom: {
      ...variant.custom,
      baseThemeId: baseId,
      generatedModeVariant: true,
    },
  };
}

export function getThemeBaseId(themeId) {
  return String(themeId || '').replace(/-light$|-dark$/, '');
}

export function getThemeMode(theme) {
  return theme?.mode === 'dark' ? 'dark' : 'light';
}

export function chooseReadableText(background, darkText = '#111827', lightText = '#f8fafc') {
  return luminance(background) > 0.52 ? darkText : lightText;
}

export function alpha(color, value) {
  return toRgba(parseColor(color), value);
}

export function tint(color, amount) {
  return toHex(mix(color, '#ffffff', amount));
}
