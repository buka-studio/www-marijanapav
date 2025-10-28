export class CircularBuffer<T> {
  private buffer: T[];
  private _capacity: number;

  constructor(capacity: number) {
    this._capacity = capacity;
    this.buffer = [];
  }

  add(item: T): void {
    this.buffer.push(item);
    if (this.buffer.length > this.capacity) {
      this.buffer.shift();
    }
  }

  get capacity(): number {
    return this._capacity;
  }

  getContents(): T[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }

  static from<T>(source: T[], capacity?: number): CircularBuffer<T> {
    const buffer = new CircularBuffer<T>(capacity ?? source.length);
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
