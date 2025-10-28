// todo(rpavlini): pull from css variables
const themeColors = {
  red: {
    active: '#ff4733',
    inactive: '#45110d',
    background: '#070000',
  },
  blue: {
    active: '#4f79ff',
    inactive: '#161f54',
    background: '#030212',
  },
  green: {
    active: '#a4d1a4',
    inactive: '#203820',
    background: '#000300',
  },
  default: {
    active: '#e9e9e299',
    inactive: '#292929',
    background: '#080808',
  },
};

export function getPalette({
  resolvedTheme,
  colorTheme,
}: {
  resolvedTheme?: string;
  colorTheme?: string;
}) {
  if (!colorTheme) {
    return themeColors.default;
  }

  return themeColors[colorTheme as keyof typeof themeColors] || themeColors.default;
}
