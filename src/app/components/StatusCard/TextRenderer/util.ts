import { BitmapChar, BitmapFont } from './models';

export const decodeBitmapFont = (font: string): BitmapFont => {
  const json = JSON.parse(font);

  return {
    name: json.name,
    chars: Object.fromEntries(
      Object.entries(json.chars).map(([key, value]) => [key, BitmapChar.parse(value)]),
    ),
  };
};

export const encodeBitmapFont = (font: BitmapFont) => {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(font.chars).map(([key, value]) => [
        key,
        value.data.map((row) => row.toString(2)),
      ]),
    ),
  );
};

export const gridToBitmapChar = (grid: number[][]): BitmapChar => {
  if (!grid || grid.length === 0) {
    return { width: 0, height: 0, data: [] };
  }

  let value = 0;
  const width = grid[0].length;

  for (let i = 0; i < width; i++) {
    if (grid[0][i] === 1) {
      // The left shift operator '<<' moves bits to the left.
      // 1 << (width - 1 - i) calculates the value of the bit at the current position.
      // For example, in a 5-bit array, the first element (i=0) is shifted by 4.
      // The bitwise OR operator '|' adds this value to our running total.
      value |= 1 << (width - 1 - i);
    }
  }

  return { width, height: grid.length, data: [value] };
};

export const bitmapCharToGrid = (char: BitmapChar): number[][] => {
  if (!char || !char.data) {
    return [];
  }

  const { width, data } = char;

  const grid = data.map((rowData) => {
    const row = [];
    for (let i = 0; i < width; i++) {
      // Check if the bit at position i is set.
      // (width - 1 - i) checks from left-to-right (MSB to LSB).
      const bitIsSet = (rowData >> (width - 1 - i)) & 1;
      row.push(bitIsSet);
    }
    return row;
  });

  return grid;
};
