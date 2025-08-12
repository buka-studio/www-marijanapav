export class CircularBuffer {
  private buffer: string[];
  private _capacity: number;

  constructor(capacity: number) {
    this._capacity = capacity;
    this.buffer = [];
  }

  add(item: string): void {
    this.buffer.push(item);
    if (this.buffer.length > this.capacity) {
      this.buffer.shift();
    }
  }

  get capacity(): number {
    return this._capacity;
  }

  getContents(): string[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }

  static from(source: string[], capacity?: number): CircularBuffer {
    const buffer = new CircularBuffer(capacity ?? source.length);
    for (const item of source) {
      buffer.add(item);
    }
    return buffer;
  }
}

export const arraySuffixPrefixMatch = <T>(source: T[], target: T[]): T[] => {
  for (let i = 0; i < source.length; i++) {
    const segmentToCheck = source.slice(i);
    if (segmentToCheck.length === 0) {
      continue;
    }

    if (segmentToCheck.length > target.length) {
      continue;
    }

    const targetPrefix = target.slice(0, segmentToCheck.length);

    let segmentMatches = true;
    for (let j = 0; j < segmentToCheck.length; j++) {
      if (segmentToCheck[j] !== targetPrefix[j]) {
        segmentMatches = false;
        break;
      }
    }

    if (segmentMatches) {
      return source.slice(i, i + segmentToCheck.length);
    }
  }

  return [];
};

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
    inactive: '#2d4e2d',
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
