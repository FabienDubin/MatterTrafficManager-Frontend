/**
 * Generate a random pastel color in hex format
 */
export const generateRandomPastelColor = (): string => {
  // Generate random hue (0-360)
  const hue = Math.floor(Math.random() * 360);
  
  // Keep saturation between 25-45% for pastel colors
  const saturation = 25 + Math.floor(Math.random() * 20);
  
  // Keep lightness between 70-85% for pastel colors
  const lightness = 70 + Math.floor(Math.random() * 15);
  
  // Convert HSL to hex
  return hslToHex(hue, saturation, lightness);
};

/**
 * Convert HSL to Hex color
 */
const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Get contrast color (black or white) based on background color and theme
 */
export const getContrastColor = (backgroundColor: string, isDarkTheme?: boolean): string => {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If dark theme, we might need to adjust the threshold
  const threshold = isDarkTheme ? 0.6 : 0.5;
  
  // Return black or white based on luminance
  return luminance > threshold ? '#000000' : '#ffffff';
};

/**
 * Validate if a string is a valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

/**
 * Darken a hex color by a percentage
 */
export const darkenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 0 ? 0 : B : 255)
  ).toString(16).slice(1);
};

/**
 * Lighten a hex color by a percentage
 */
export const lightenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 0 ? 0 : B : 255)
  ).toString(16).slice(1);
};

/**
 * Get a color with opacity
 */
export const colorWithOpacity = (color: string, opacity: number): string => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Return rgba
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};