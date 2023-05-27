import Cryptocurrency from '~/public/work/bitcoin/preview.png';
import ElizabethsFlowers00 from '~/public/work/elizabeths-flowers/elizabethsflowers_00.jpg';
import ElizabethsFlowers01 from '~/public/work/elizabeths-flowers/elizabethsflowers_01.jpg';
import ElizabethsFlowers02 from '~/public/work/elizabeths-flowers/elizabethsflowers_02.jpg';
import ElizabethsFlowers from '~/public/work/elizabeths-flowers/preview.png';
import DigitalStampCollection from '~/public/work/falkland/preview.png';
import HavgrimPreview00 from '~/public/work/havgrim/havgrim_00.png';
import HavgrimPreview01 from '~/public/work/havgrim/havgrim_01.png';
import HavgrimPreview02 from '~/public/work/havgrim/havgrim_02.png';
import HavgrimPreview03 from '~/public/work/havgrim/havgrim_03.png';
import HavgrimPreview from '~/public/work/havgrim/preview.png';
import HighRoads00 from '~/public/work/high-roads/highroads_00.jpg';
import HighRoads01 from '~/public/work/high-roads/highroads_01.jpg';
import HighRoads02 from '~/public/work/high-roads/highroads_02.jpg';
// import HavgrimPreview from "~/public/work/havgrim/preview.png";
// import DucksPreview from "~/public/work/ducks/preview.png";
import HighRoadsPreview from '~/public/work/high-roads/preview.png';
import InfinumBeer00 from '~/public/work/infinum-beer/infinumbeer_00.png';
import InfinumBeerPreview from '~/public/work/infinum-beer/preview.png';
import InfinumMerch00 from '~/public/work/infinum-merch/infinum_merch_00.jpg';
import InfinumMerch01 from '~/public/work/infinum-merch/infinum_merch_01.jpg';
import InfinumMerch02 from '~/public/work/infinum-merch/infinum_merch_02.jpg';
import InfinumMerch03 from '~/public/work/infinum-merch/infinum_merch_03.jpg';
import InfinumMerch04 from '~/public/work/infinum-merch/infinum_merch_04.jpg';
import InfinumMerch05 from '~/public/work/infinum-merch/infinum_merch_05.jpg';
import InfinumSwagPreview from '~/public/work/infinum-merch/preview.png';
import InfinumPostersPreview from '~/public/work/infinum-posters/preview.png';
import KettlePreview from '~/public/work/kettle/preview.png';
import Memobottle00 from '~/public/work/memobottle/memobottle_00.jpg';
import MemobottlePreview from '~/public/work/Memobottle/preview.png';
import SupabaseIconsPreview from '~/public/work/supabase-icons/preview.png';
import { StaticImageData } from 'next/image';
import { ReactNode } from 'react';
import SupabaseCard from './components/SupabaseCard';

export const filters = ['all', 'illustration', 'branding', 'ux-ui', 'other'] as const;

export type Filter = (typeof filters)[number];

export type StaticProject = {
  type?: 'project';
  title: string;
  description?: string;
  slug?: string;
  filters: Filter[];
  preview: StaticImageData;
  aspect?: number;
  assets?: StaticImageData[][];
  tags?: string[];
};

export type ComponentProject = {
  type: 'component';
  content: ReactNode;
  filters: Filter[];
};

export type Project = StaticProject | ComponentProject;

// aspect - width/height
export const projects: Project[] = [
  {
    type: 'project',
    title: 'Digital Stamp Collection',
    slug: 'stamp-collection',
    preview: DigitalStampCollection,
    filters: ['illustration'],
    description:
      'Cover illustration for software development agency for a blog post about Interledger — an open protocol suite developed with the intention of making payments work as easy as email.',
    assets: [
      [DigitalStampCollection],
      [DigitalStampCollection, DigitalStampCollection, DigitalStampCollection],
    ],
    tags: ['Adobe Illustrator', 'Procreate', '© 2022'],
    aspect: 0.67,
  },
  {
    type: 'project',
    title: 'Cryptocurrency Transactions Made Simple',
    slug: 'crypto',
    preview: Cryptocurrency,
    filters: ['illustration'],
    description:
      'Cover illustration for software development agency for a blog post about Interledger — an open protocol suite developed with the intention of making payments work as easy as email.',
    aspect: 1.75,
    tags: ['Adobe Illustrator', 'Procreate', '© 2021'],
  },
  {
    type: 'project',
    title: 'The High Road Streetwear Brand Logo',
    slug: 'high-roads',
    preview: HighRoadsPreview,
    filters: ['illustration', 'branding'],
    aspect: 1,
    assets: [[HighRoads00], [HighRoads01, HighRoads02]],
    tags: ['Adobe Illustrator', '© 2020'],
  },
  {
    type: 'project',
    title: 'Infinum Craft Beer Can Packaging',
    slug: 'infinum-beer',
    preview: InfinumBeerPreview,
    filters: ['branding', 'ux-ui'],
    aspect: 1.2,
    description:
      'In collaboration with Lepidečki Brewery, we designed a crisp and refreshing lager beer for Infinum that comes in all-black cans with an eye-catching white label featuring an oversized Neue Haas font that will make you want to spin the bottle and take a sip.',
    assets: [[InfinumBeer00]],
    tags: ['Adobe Illustrator', '© 2022'],
  },
  {
    type: 'project',
    title: 'Supabase Icons',
    slug: 'supabase-icons',
    preview: SupabaseIconsPreview,
    filters: ['branding', 'ux-ui'],
    aspect: 1.2,
  },
  {
    type: 'component',
    content: <SupabaseCard />,
    filters: ['branding', 'ux-ui', 'illustration'],
  },

  {
    type: 'project',
    title: 'Infinum Merch',
    slug: 'infinum-swag',
    preview: InfinumSwagPreview,
    filters: ['branding', 'ux-ui'],
    description:
      'With the brand being known for its light, clean, and bold aesthetic, the merchandise was designed to reflect these qualities and use signature red color as an accent.',
    aspect: 0.7,
    assets: [
      [InfinumMerch00],
      [InfinumMerch01, InfinumMerch02],
      [InfinumMerch03, InfinumMerch04, InfinumMerch05],
    ],
    tags: ['Adobe Illustrator', 'Adobe Photoshop', '© 2022'],
  },
  {
    type: 'project',
    title: 'Infinum Posters',
    slug: 'infinum-posters',
    preview: InfinumPostersPreview,
    filters: ['illustration', 'branding'],
    aspect: 0.7,
  },
  {
    type: 'project',
    title: 'Kettle Illustration',
    slug: 'kettle',
    preview: KettlePreview,
    filters: ['illustration'],
    aspect: 0.8,
  },
  {
    type: 'project',
    title: 'The Havgrim Seaside Hotel Branding',
    slug: 'havgrim',
    preview: HavgrimPreview,
    filters: ['branding'],
    aspect: 1.2,
    description:
      "To capture the essence of Elizabeth's Flowers' quality and attention to detail, we opted for a timeless, elegant serif font and a green and subtly pink color palette.",
    assets: [[HavgrimPreview00], [HavgrimPreview01, HavgrimPreview02, HavgrimPreview03]],
    tags: ['Adobe Illustrator', '© 2019'],
  },
  {
    type: 'project',
    title: 'Elizabeths Flowers',
    slug: 'elizabeths-flowers',
    preview: ElizabethsFlowers,
    filters: ['branding'],
    aspect: 1,
    description:
      "To capture the essence of Elizabeth's Flowers' quality and attention to detail, we opted for a timeless, elegant serif font and a green and subtly pink color palette.",
    assets: [[ElizabethsFlowers00], [ElizabethsFlowers01, ElizabethsFlowers02]],
    tags: ['Adobe Illustrator', '© 2019'],
  },
  {
    type: 'project',
    title: 'Memobottle design challange',
    slug: 'memobottle',
    preview: MemobottlePreview,
    filters: ['illustration'],
    aspect: 1.5,
    assets: [[Memobottle00]],
  },
];
