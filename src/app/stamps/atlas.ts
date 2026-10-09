import monoline from './atlases/monoline.json';
import textured from './atlases/textured.json';
import typographic from './atlases/typographic.json';

export type StampAtlasItem = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type StampAtlas = {
  metadata: {
    src: string;
    width: number;
    height: number;
    scale: number;
  };
  items: Record<string, StampAtlasItem>;
};

export const stampAtlases = {
  typographic,
  textured,
  monoline,
} satisfies Record<string, StampAtlas>;

export type StampAtlasKey = keyof typeof stampAtlases;
