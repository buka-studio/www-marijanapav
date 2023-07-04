import { StaticImageData } from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

import Crypto00 from '~/public/work/crypto/crypto_00.jpg';
import Cryptocurrency from '~/public/work/crypto/preview.png';
import ElizabethsFlowers00 from '~/public/work/elizabeths-flowers/elizabethsflowers_00.jpg';
import ElizabethsFlowers01 from '~/public/work/elizabeths-flowers/elizabethsflowers_01.jpg';
import ElizabethsFlowers02 from '~/public/work/elizabeths-flowers/elizabethsflowers_02.jpg';
import ElizabethsFlowers from '~/public/work/elizabeths-flowers/preview.png';
import FruitStickersPreview from '~/public/work/fruit-stickers/preview.png';
import HavgrimPreview00 from '~/public/work/havgrim/havgrim_00.png';
import HavgrimPreview01 from '~/public/work/havgrim/havgrim_01.png';
import HavgrimPreview02 from '~/public/work/havgrim/havgrim_02.png';
import HavgrimPreview03 from '~/public/work/havgrim/havgrim_03.png';
import HavgrimPreview from '~/public/work/havgrim/preview.png';
import HighRoads00 from '~/public/work/high-roads/highroads_00.jpg';
import HighRoads01 from '~/public/work/high-roads/highroads_01.jpg';
import HighRoads02 from '~/public/work/high-roads/highroads_02.jpg';
import HighRoadsPreview from '~/public/work/high-roads/preview.png';
import InfinumBeer00 from '~/public/work/infinum-beer/infinumbeer_00.png';
import InfinumBeerPreview from '~/public/work/infinum-beer/preview.png';
import Honey00 from '~/public/work/infinum-honey/honey_00.jpg';
import Honey01 from '~/public/work/infinum-honey/honey_01.jpg';
import Honey02 from '~/public/work/infinum-honey/honey_02.jpg';
import Honey03 from '~/public/work/infinum-honey/honey_03.jpg';
import InfinumHoneyPreview from '~/public/work/infinum-honey/preview.png';
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
import MemobottlePreview from '~/public/work/memobottle/preview.png';
import MemoriesPoster00 from '~/public/work/memories-poster/memories-poster_00.jpg';
import MemoriesPoster01 from '~/public/work/memories-poster/memories_01.png';
import MemoriesPoster02 from '~/public/work/memories-poster/memories_02.png';
import MemoriesPoster03 from '~/public/work/memories-poster/memories_03.png';
import MemoriesPoster04 from '~/public/work/memories-poster/memories_04.png';
import MemoriesPoster05 from '~/public/work/memories-poster/memories_05.png';
import MemoriesPosterPreview from '~/public/work/memories-poster/preview.png';
import OperaPosters00 from '~/public/work/opera-posters/posters_00.jpg';
import OperaPosters01 from '~/public/work/opera-posters/posters_01.jpg';
import OperaPosters02 from '~/public/work/opera-posters/posters_02.jpg';
import OperaPosters03 from '~/public/work/opera-posters/posters_03.jpg';
import OperaPostersPreview from '~/public/work/opera-posters/preview.png';
import ProgramEndPreview from '~/public/work/program-end/preview.png';
import DigitalStampCollection from '~/public/work/stamps/preview.png';
import Stamps00 from '~/public/work/stamps/stamps_00.png';
import Stamps01 from '~/public/work/stamps/stamps_01.png';
import Stamps02 from '~/public/work/stamps/stamps_02.png';
import Stamps03 from '~/public/work/stamps/stamps_03.png';
import Stamps04 from '~/public/work/stamps/stamps_04.png';
import Stamps05 from '~/public/work/stamps/stamps_05.png';
import Stamps06 from '~/public/work/stamps/stamps_06.png';
import Stamps07 from '~/public/work/stamps/stamps_07.png';
import SupabaseIconsPreview from '~/public/work/supabase-icons/preview.png';

import Paragraph from './[slug]/components/Paragraph';
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
  blocks?: Array<Array<StaticImageData | ReactNode>>;
  blocksConfig?: {
    assetsStretch?: boolean;
  };
  tags?: string[];
  link?: string;
};

export type ComponentProject = {
  type: 'component';
  content: ReactNode;
  filters: Filter[];
};

export type Project = StaticProject | ComponentProject;

// aspect - width/height
// todo: consider contentlayer or some other lightweight cms
export const projects: Project[] = [
  {
    type: 'project',
    title: 'Digital Stamp Collection',
    slug: 'stamp-collection',
    preview: DigitalStampCollection,
    filters: ['illustration'],
    description:
      "Digital Stamp Collection is my personal project of digitally recreating my grandpa's stamps. It's an homage to his journey, now brought online. Inspired by my family's stamp collection, I started my own philately collection, but in a digital format. With over 100 stamps created and three distinct styles explored, I continue to push boundaries. Stay tuned for updates on this project at marijanasimag.com/stamps-showoff.",
    blocks: [
      [Stamps00],
      [Stamps01, Stamps02, Stamps03],
      [
        <Paragraph key="1">
          Through this collection I&apos;ve set myself a goal of trying out new things. As my love
          for illustration grew, so did my “style” evolve. Stamps started off as monoline, then I
          decided to learn Procreate, after that more layout exploration ensued. More on this
          project soon <Link href="/stamp-showoff">here</Link>
        </Paragraph>,
      ],
      [Stamps04, Stamps05, Stamps06],
      [Stamps07],
    ],
    blocksConfig: {
      assetsStretch: true,
    },
    tags: ['Adobe Illustrator', 'Procreate', '© 2022'],
    link: 'https://instagram.com/marijanasimag.design',
    aspect: 0.7,
  },
  {
    type: 'project',
    title: 'Cryptocurrency Transactions Made Simple',
    slug: 'crypto',
    preview: Cryptocurrency,
    filters: ['illustration'],
    description:
      'Cover illustration for Infinum, a software development agency, and the blog post discussing the challenges of using cryptocurrencies and Interledger — an open protocol suite developed with the intention of making payments work as easy as email.',
    aspect: 1.5,
    blocks: [[Crypto00]],
    tags: ['Adobe Illustrator', 'Procreate', '© 2020'],
    link: 'https://infinum.com/news/cryptocurrency-transactions-made-simple-with-interledger/',
  },
  {
    type: 'project',
    title: 'The High Road Streetwear Brand Logo',
    slug: 'high-roads',
    preview: HighRoadsPreview,
    filters: ['illustration', 'branding'],
    description:
      'A branding project for an urban fashion brand that blends class with streetwear flair. Distinctive high contrast typeface combined with bold colors as its primary brand components shows off brands unique personality.',
    aspect: 1,
    blocks: [[HighRoads00], [HighRoads01, HighRoads02]],
    tags: ['Adobe Illustrator', '© 2020'],
  },
  {
    type: 'project',
    title: 'Memobottle design challenge',
    slug: 'memobottle',
    preview: MemobottlePreview,
    filters: ['illustration'],
    description:
      'An illustration for a challenge presented by Memobottle, known for its unique paper-inspired design that allows the bottles to sit flat against laptops, books, and any other item you might carry. The challenge called artists to showcase their creativity by sketching, shooting, or freestyling the Memobottle in various environments. For my submission, I decided to add a playful twist, featuring their A5 and Slim memobottle floating in a the pool.',
    aspect: 1.5,
    tags: ['Adobe Illustrator', '© 2021'],
    blocks: [[Memobottle00]],
    link: 'https://www.instagram.com/explore/tags/memoart21/',
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
    blocks: [[InfinumBeer00]],
    tags: ['Adobe Illustrator', '© 2022'],
  },

  {
    type: 'project',
    title: 'Memories Poster',
    slug: 'memories-poster',
    preview: MemoriesPosterPreview,
    filters: ['branding', 'ux-ui'],
    description:
      'I collected tons of tickets, stickers, papers, and generally memories that I shared with my fiance over the last 9 years. These are some of them but made digital.',
    aspect: 0.75,
    blocks: [
      [MemoriesPoster00],
      [MemoriesPoster01, MemoriesPoster02, MemoriesPoster03],
      [MemoriesPoster04, MemoriesPoster05],
    ],
    tags: ['Adobe Illustrator', 'Adobe Photoshop', '© 2021'],
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
    type: 'project',
    title: 'Kettle Illustration',
    slug: 'kettle',
    preview: KettlePreview,
    filters: ['illustration'],
    aspect: 0.85,
  },
  {
    type: 'project',
    title: 'Infinum Posters',
    slug: 'infinum-posters',
    preview: InfinumPostersPreview,
    filters: ['illustration', 'branding'],
    description:
      'Series of posters for Royal Opera House, taking a refreshing perspective on these well-known stories.',
    aspect: 0.7,
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
    aspect: 0.73,
    blocks: [
      [InfinumMerch00],
      [InfinumMerch01, InfinumMerch02],
      [InfinumMerch03, InfinumMerch04, InfinumMerch05],
    ],
    tags: ['Adobe Illustrator', 'Adobe Photoshop', '© 2022'],
  },
  {
    type: 'project',
    title: 'Series of Royal Opera Posters',
    slug: 'opera-posters',
    preview: OperaPostersPreview,
    filters: ['illustration'],
    description:
      'Series of posters for Royal Opera House, taking a refreshing perspective on these well-known stories.',
    aspect: 0.73,
    blocks: [[OperaPosters00], [OperaPosters01, OperaPosters02, OperaPosters03]],
  },
  {
    type: 'project',
    title: 'Packaging for Croatian honey collection ',
    slug: 'infinum-honey',
    preview: InfinumHoneyPreview,
    filters: ['branding', 'ux-ui'],
    description:
      'In the midst of a worldwide quarantine, Christmas 2020 called for a touch of sweetness to uplift spirits. We answered the call by curating a delightful three-pack of Croatian honey, as a heartfelt gift for our clients. With over 500 gifts shipped, we aimed to bring a taste of warmth and indulgence to homes during these challenging times.',
    aspect: 1,
    blocks: [[Honey00], [Honey01], [Honey02, Honey03]],
    tags: ['Adobe Illustrator', 'Adobe Lightroom', '© 2020'],
  },
  {
    type: 'project',
    title: 'Fruit Stickers',
    slug: 'fruit-stickers',
    preview: FruitStickersPreview,
    filters: ['illustration'],
    aspect: 1,
    blocks: [[Memobottle00]],
  },
  {
    type: 'project',
    title: 'Program End Illustration',
    slug: 'program-end',
    preview: ProgramEndPreview,
    filters: ['illustration'],
    aspect: 0.65,
  },
  {
    type: 'project',
    title: 'Elizabeth’s Flowers Floral Studio Logo',
    slug: 'elizabeths-flowers',
    preview: ElizabethsFlowers,
    filters: ['branding'],
    aspect: 1,
    description:
      "To capture the essence of Elizabeth's Flowers' quality and attention to detail, we opted for a timeless, elegant serif font and a green and subtly pink color palette.",
    blocks: [[ElizabethsFlowers00], [ElizabethsFlowers01, ElizabethsFlowers02]],
    tags: ['Adobe Illustrator', '© 2019'],
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
    blocks: [[HavgrimPreview00], [HavgrimPreview01, HavgrimPreview02, HavgrimPreview03]],
    tags: ['Adobe Illustrator', '© 2019'],
  },
];
