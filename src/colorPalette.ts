const MINIMUM_MONOCHROME_COLOR_COUNT = 5

interface OklchColor {
  lightness: number
  chroma: number
  hue: number
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeHexColor(color: string) {
  const normalized = color.trim().replace(/^#?/, '#')
  return /^#[\da-f]{6}$/i.test(normalized)
    ? normalized.toUpperCase()
    : null
}

function srgbToLinear(channel: number) {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4)
}

function linearToSrgb(channel: number) {
  const clamped = clamp(channel)
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
}

function hexToOklch(color: string): OklchColor | null {
  const normalized = normalizeHexColor(color)
  if (!normalized) return null

  const red = srgbToLinear(Number.parseInt(normalized.slice(1, 3), 16) / 255)
  const green = srgbToLinear(Number.parseInt(normalized.slice(3, 5), 16) / 255)
  const blue = srgbToLinear(Number.parseInt(normalized.slice(5, 7), 16) / 255)

  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  return {
    lightness,
    chroma: Math.sqrt(a * a + b * b),
    hue: Math.atan2(b, a),
  }
}

function oklchToHex({ lightness, chroma, hue }: OklchColor) {
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)
  const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3)

  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]

  return `#${channels
    .map((channel) =>
      Math.round(linearToSrgb(channel) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`.toUpperCase()
}

export function getMonochromeColorCount(requiredColorCount: number) {
  return Math.max(
    MINIMUM_MONOCHROME_COLOR_COUNT,
    Math.max(0, Math.floor(requiredColorCount)),
  )
}

export function generateMonochromePalette(
  baseColor: string,
  requiredColorCount: number,
) {
  const normalized = normalizeHexColor(baseColor) ?? '#6A38F0'
  const base = hexToOklch(normalized)!
  const colorCount = getMonochromeColorCount(requiredColorCount)
  const targetLightness = Math.max(base.lightness, 0.97)

  return Array.from({ length: colorCount }, (_, index) => {
    if (index === 0) return normalized

    const progress = index / (colorCount - 1)
    const easedProgress = Math.pow(progress, 0.88)
    return oklchToHex({
      lightness:
        base.lightness + (targetLightness - base.lightness) * easedProgress,
      chroma:
        base.chroma *
        (0.12 + 0.88 * Math.pow(1 - progress, 0.75)),
      hue: base.hue,
    })
  })
}
