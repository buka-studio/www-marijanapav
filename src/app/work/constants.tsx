// import Cards from './[slug]/components/Cards';
import { StaticImageData } from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

import BugReport00 from '~/public/work/bug-report/bur-report_00.png';
import BugReportPreview from '~/public/work/bug-report/bur-report_preview.png';
import BukaWebPreview from '~/public/work/buka-studio-web/buka-web-preview.png';
import Crypto00 from '~/public/work/crypto/crypto_00.jpg';
import Cryptocurrency from '~/public/work/crypto/preview.png';
import EchoTab from '~/public/work/echo-tab/echo-tab.webp';
import ElizabethsFlowers01 from '~/public/work/elizabeths-flowers/elizabethsflowers_01.png';
import ElizabethsFlowers02 from '~/public/work/elizabeths-flowers/elizabethsflowers_02.png';
import ElizabethsFlowers03 from '~/public/work/elizabeths-flowers/elizabethsflowers_03.png';
import ElizabethsFlowers04 from '~/public/work/elizabeths-flowers/elizabethsflowers_04.png';
import ElizabethsFlowers05 from '~/public/work/elizabeths-flowers/elizabethsflowers_05.png';
import ElizabethsFlowers from '~/public/work/elizabeths-flowers/preview.png';
import FruitStickersPreview from '~/public/work/fruit-stickers/preview.png';
import HavgrimPreview00 from '~/public/work/havgrim/havgrim_00.png';
import HavgrimPreview01 from '~/public/work/havgrim/havgrim_01.png';
import HavgrimPreview02 from '~/public/work/havgrim/havgrim_02.png';
import HavgrimPreview03 from '~/public/work/havgrim/havgrim_03.png';
import HavgrimPreview from '~/public/work/havgrim/preview.png';
import HighRoads01 from '~/public/work/high-roads/highroads_01.jpg';
import HighRoads02 from '~/public/work/high-roads/highroads_02.jpg';
import HighRoads03 from '~/public/work/high-roads/highroads_03.jpg';
import HighRoads04 from '~/public/work/high-roads/highroads_04.jpg';
import HighRoads05 from '~/public/work/high-roads/highroads_05.jpg';
import HighRoadsPreview from '~/public/work/high-roads/preview.png';
import IllustratedCardsPreview from '~/public/work/illustrated-cards/preview.png';
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
import InfinumPosters0 from '~/public/work/infinum-posters/infinum-posters_0.png';
import InfinumPosters00 from '~/public/work/infinum-posters/infinum-posters_00.png';
import InfinumPosters01 from '~/public/work/infinum-posters/infinum-posters_01.png';
import InfinumPosters02 from '~/public/work/infinum-posters/infinum-posters_02.png';
import InfinumPosters03 from '~/public/work/infinum-posters/infinum-posters_03.png';
import InfinumPostersPreview from '~/public/work/infinum-posters/preview.png';
import KettlePreview from '~/public/work/kettle/preview.png';
import Memobottle00 from '~/public/work/memobottle/memobottle_00.jpg';
import MemobottlePreview from '~/public/work/memobottle/preview.png';
import MemoriesPoster00 from '~/public/work/memories-poster/memories-poster_00.png';
import MemoriesPosterPreview from '~/public/work/memories-poster/preview.png';
import MidnightStudio00 from '~/public/work/midnight-studio/midnight-studio_00.png';
import MidnightStudio01 from '~/public/work/midnight-studio/midnight-studio_01.png';
import MidnightStudio02 from '~/public/work/midnight-studio/midnight-studio_02.png';
import MidnightStudioPreview from '~/public/work/midnight-studio/midnight-studio_preview.png';
import OperaPosters0 from '~/public/work/opera-posters/posters_0.png';
import OperaPosters00 from '~/public/work/opera-posters/posters_00.png';
import OperaPosters01 from '~/public/work/opera-posters/posters_01.png';
import OperaPosters02 from '~/public/work/opera-posters/posters_02.png';
import OperaPostersPreview from '~/public/work/opera-posters/preview.png';
import SignOff01 from '~/public/work/program-end/sign-off_01.png';
import SignOff02 from '~/public/work/program-end/sign-off_02.png';
import SignOff03 from '~/public/work/program-end/sign-off_03.png';
import SignOff04 from '~/public/work/program-end/sign-off_04.png';
import SignOff05 from '~/public/work/program-end/sign-off_05.png';
import SignOffPreview from '~/public/work/program-end/sign-off_preview.png';
import Stamps00 from '~/public/work/stamps/stamps_00.png';
import s1 from '~/public/work/stamps/s1.png';
import s2 from '~/public/work/stamps/s2.png';
import s3 from '~/public/work/stamps/s3.png';
import s4 from '~/public/work/stamps/s4.png';

import Stamps01 from '~/public/work/stamps/stamps_01.png';
import Stamps02 from '~/public/work/stamps/stamps_02.png';
import Stamps03 from '~/public/work/stamps/stamps_03.png';
import Stamps04 from '~/public/work/stamps/stamps_04.png';
import Stamps05 from '~/public/work/stamps/stamps_05.png';
import Stamps06 from '~/public/work/stamps/stamps_06.png';
import Stamps07 from '~/public/work/stamps/stamps_07.png';
import Stamps08 from '~/public/work/stamps/stamps_08.png';
import Stamps09 from '~/public/work/stamps/stamps_09.png';
import Stamps10 from '~/public/work/stamps/stamps_10.png';
import Stars from '~/public/work/stamps/stars.gif';
import SupabaseIcons00 from '~/public/work/supabase-icons/supabase-icons_00.png';
import SupabaseIcons01 from '~/public/work/supabase-icons/supabase-icons_01.png';
import SupabaseIcons02 from '~/public/work/supabase-icons/supabase-icons_02.png';
import SupabaseIcons03 from '~/public/work/supabase-icons/supabase-icons_03.png';
import SupabaseIconsGif from '~/public/work/supabase-icons/supabase-icons.webp';
import SupabaseLW6 from '~/public/work/supabase-lw6/preview.png';
import SupabaseLW7 from '~/public/work/supabase-lw7/preview.png';
import SupabaseLW8 from '~/public/work/supabase-lw8/preview.png';
import SupabaseLW81 from '~/public/work/supabase-lw8/supabase1.png';
import SupabaseLW82 from '~/public/work/supabase-lw8/supabase2.png';
import SupabaseLW83 from '~/public/work/supabase-lw8/supabase3.png';
import SupabaseLW84 from '~/public/work/supabase-lw8/supabase4.png';
import SupabaseLW85 from '~/public/work/supabase-lw8/supabase5.png';
import SupabaseLW86 from '~/public/work/supabase-lw8/supabase6.png';
import SupabaseMerchPreview from '~/public/work/supabase-merch/supabase-merch-preview.png';
import SupabaseMerch from '~/public/work/supabase-merch/supabase-merch.png';

import Paragraph from './[slug]/components/Paragraph';
import SupabaseCard from './components/SupabaseCard';

export const filters = ['all', 'illustration', 'branding', 'digital', 'merch'] as const;

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
  images?: StaticImageData[];
  dynamic?: boolean;
  tags?: string[];
  link?: string;
  publishedAt?: string;
};

export type ComponentProject = {
  type: 'component';
  content: ReactNode;
  filters: Filter[];
};

export type Project = (StaticProject | ComponentProject) & {
  hidden?: boolean;
};

// aspect - width/height - for grid layout
// todo: consider contentlayer or some other lightweight cms
export const projects: Project[] = [
  {
    type: 'project',
    title: 'buka.studio web',
    slug: 'buka-web',
    preview: BukaWebPreview,
    filters: ['digital'],
    link: 'https://buka.studio',
    tags: ['Figma', '© 2024'],
    aspect: 0.7,
  },
  {
    type: 'project',
    title: 'EchoTab Chrome Extension',
    slug: 'echo-tab',
    preview: EchoTab,
    blocks: [[EchoTab]],
    filters: ['digital'],
    description:
      'A clean and simple browser extension, that helps you manage thousands of open tabs, with multi-select, smart tagging and CmdK command menu for quick browsing experience.',
    link: '',
    tags: ['Figma', '© 2024'],
    aspect: 1.5,
  },
  {
    type: 'project',
    title: 'Supabase Merch',
    slug: 'supabase-merch',
    preview: SupabaseMerchPreview,
    blocks: [[SupabaseMerch]],
    filters: ['branding', 'merch'],
    tags: ['Adobe Illustrator', '© 2023'],

    aspect: 1.5,
  },
  {
    type: 'project',
    title: 'Supabase Icons',
    slug: 'supabase-icons',
    preview: SupabaseIcons01,
    blocks: [
      [SupabaseIcons00, SupabaseIconsGif],
      [SupabaseIcons01, SupabaseIcons02, SupabaseIcons03],
    ],
    filters: ['branding', 'digital'],
    aspect: 1,
  },
  {
    hidden: true,
    type: 'project',
    title: 'Supabase Launch Week 8 Branding',
    slug: 'supabase-lw8',
    preview: SupabaseLW8,
    filters: ['digital'],
    description:
      "Supabase Launch Week is week-long event packed with product updates, community announcements, meetups, daily video announcements, and live Discord hangouts. It's a showcase of what the Supabase team has been working on in the past few months, and on the design front it's an opportunity to push our brand's boundaries.",
    aspect: 0.8,
    blocks: [
      [SupabaseLW81, SupabaseLW82],
      [SupabaseLW83, SupabaseLW84],
      [SupabaseLW85, SupabaseLW86],
    ],
    tags: ['Figma', '© 2023'],
    link: 'https://supabase.com/launch-week',
  },
  {
    type: 'project',
    title: 'Digital Stamp Collection',
    slug: 'stamp-collection',
    preview: Stars,
    filters: ['illustration'],
    description:
      "This is my personal project of digitally recreating my grandpa's stamps. It's a homage to his philatelic journey, brought online when I started my own philately collection, but in a different format. Through this collection I've set myself a goal of trying out new softwares.",
    // images: [Stamps00, Stamps00, Stamps00, Stamps00, Stars],
    images: [s1,s2,s3,s4, MemoriesPoster00],
    blocks: [
      [Stamps00],
      [Stamps01, Stamps02, Stamps03],
      [Stamps04, Stamps05, Stamps06],
      [Stamps10],
      [
        <Paragraph key="1">
          In 2020 when the quarantine started so did my digital stamp collection. With over 100
          stamps recreated and three distinct styles explored, I try to push boundaries and learn
          new softwares. <br />
          <br />
          The initial designs were created using Adobe Illustrator, then curiosity led me to explore
          Procreate and later on Affinity Desiner x Intous Pro. As a result, the stamps became more
          detailed and textured with each switch of the software. I keep saying next phase should be
          stamps in motion but we&apos;ll see about that! More on this project soon{' '}
          <Link href="/stamp-showoff">here</Link>
        </Paragraph>,
      ],

      [Stamps07, Stamps08, Stamps09],
    ],
    tags: ['Adobe Illustrator', 'Procreate', '© 2022'],
    aspect: 0.7,
  },
  {
    hidden: true,
    type: 'project',
    title: 'Supabase Launch Week 7 Branding',
    slug: 'supabase-lw7',
    preview: SupabaseLW7,
    filters: ['illustration'],
    description: 'Remember when TV programs ended at 00:00?',
    aspect: 1,
    blocks: [[Honey00], [Honey01], [Honey02, Honey03]],
    tags: ['Adobe Illustrator', 'Adobe Lightroom', '© 2020'],
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
    title: 'Interactive Illustrated Cards',
    slug: 'illustrated-cards',
    preview: IllustratedCardsPreview,
    filters: ['digital'],
    aspect: 0.7,
    description:
      'A set of illustrated cards that explores a monoline and monochromatic visual language. It incorporates holographic elements and includes various interactive games to showcase the dynamic movement of the cards.',
    tags: ['Figma', 'Illustrator', '© 2023'],
    dynamic: true,
  },
  {
    type: 'project',
    title: 'The High Road Streetwear Brand Logo',
    slug: 'high-roads',
    preview: HighRoadsPreview,
    filters: ['branding'],
    description:
      'A branding project for an urban fashion brand that blends class with streetwear flair. Distinctive high contrast typeface combined with bold colors as its primary brand components shows off a bit of the brands personality.',
    aspect: 1,
    blocks: [
      [HighRoads01, HighRoads02],
      [HighRoads03, HighRoads04, HighRoads05],
    ],
    tags: ['Adobe Illustrator', '© 2020'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Memobottle design challenge',
    slug: 'memobottle',
    preview: MemobottlePreview,
    filters: ['illustration'],
    description:
      'An illustration for a challenge presented by Memobottle, known for its unique paper-inspired design that allows the bottles to sit flat against laptops, books, and any other item you might carry. The challenge called artists to showcase their creativity by sketching, shooting, or freestyling the Memobottle in various environments. For my submission, I decided to add a playful twist, featuring their A5 and Slim memobottle floating in a the pool.',
    aspect: 1.5,
    tags: ['Adobe Illustrator', 'Procreate', '© 2021'],
    blocks: [[Memobottle00]],
    link: 'https://www.instagram.com/explore/tags/memoart21/',
  },
  {
    type: 'project',
    title: 'Infinum Craft Beer Can Packaging',
    slug: 'infinum-beer',
    preview: InfinumBeerPreview,
    filters: ['branding', 'merch'],
    aspect: 1,
    description:
      'Infinum collaboration with Lepidečki Brewery. We designed a crisp and refreshing lager beer for Infinum events aimed at developers, nudging users to think of Github PRs. The "Pour Request" beer comes in all-black cans with an eye-catching white label featuring an oversized Neue Haas font that will make you want to spin the bottle and take a sip.',
    blocks: [[InfinumBeer00]],
    tags: ['Adobe Illustrator', '© 2022'],
  },

  {
    type: 'project',
    title: 'Memories Poster',
    slug: 'memories-poster',
    preview: MemoriesPosterPreview,
    filters: ['illustration'],
    description:
      'I collected tons of tickets, stickers, papers, and generally memories that I shared with my fiance over the years. These are some of them but made digital.',
    aspect: 0.75,
    blocks: [[MemoriesPoster00]],
    tags: ['Adobe Illustrator', 'Adobe Photoshop', '© 2021'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Kettle Illustration',
    slug: 'kettle',
    preview: KettlePreview,
    filters: ['illustration'],
    aspect: 0.85,
  },

  {
    hidden: true,
    type: 'project',
    title: 'Bug-Reporting iOS Library blog illustration',
    slug: 'bug-report',
    preview: BugReportPreview,
    filters: ['illustration'],
    description:
      'Cover illustration for Infinum, a software development agency, and the blog post about Bugsnatch, that helps Quality Assurance engineers with exterminating the bugs early on.',
    aspect: 1.5,
    blocks: [[BugReport00]],
    tags: ['Adobe Illustrator', 'Procreate', '© 2020'],
    link: 'https://infinum.com/blog/snatch-bugs-with-bug-reporting-ios-library/',
  },

  {
    type: 'project',
    title: 'Infinum Posters',
    slug: 'infinum-posters',
    preview: InfinumPostersPreview,
    filters: ['branding'],
    description:
      "An exploration of Infinum's new typeface and refreshed branding brought to life through a collection of large B2 office posters inspired by iconic Vignelli type compositions. Each layout showcases the essence of Infinum's brand identity and pays homage to the power of the bold Neue Haas typeface, aligning with Infinum's brand ethos.",
    blocks: [
      [InfinumPosters0, InfinumPosters00],
      [InfinumPosters01],
      [InfinumPosters02, InfinumPosters03, InfinumPosters03],
    ],
    tags: ['Figma', '© 2022'],
    link: 'https://infinum.com/brand',
    aspect: 0.7,
  },
  {
    hidden: true,
    type: 'component',
    content: <SupabaseCard />,
    filters: ['branding', 'digital'],
  },

  {
    type: 'project',
    title: 'Infinum Merch',
    slug: 'infinum-swag',
    preview: InfinumSwagPreview,
    filters: ['branding', 'merch'],
    description:
      'With the brand being known for its light, clean, and bold aesthetic, the merchandise was designed to reflect these qualities and use signature red color as an accent.',
    aspect: 0.73,
    blocks: [
      [InfinumMerch00],
      [InfinumMerch01, InfinumMerch02],
      [InfinumMerch03, InfinumMerch04, InfinumMerch05],
    ],
    link: 'https://infinum.com/brand',
    tags: ['Adobe Illustrator', 'Adobe Photoshop', '© 2022'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Series of Royal Opera Posters',
    slug: 'opera-posters',
    preview: OperaPostersPreview,
    filters: ['illustration'],
    description:
      'Series of posters for Royal Opera House, taking a refreshing perspective on these well-known stories.',
    aspect: 0.73,
    blocks: [[OperaPosters0], [OperaPosters00, OperaPosters01, OperaPosters02]],
    tags: ['Adobe Illustrator', 'Procreate', '© 2021'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Supabase Launch Week 6 Branding',
    slug: 'supabase-lw6',
    preview: SupabaseLW6,
    filters: ['illustration'],
    description: 'Remember when TV programs ended at 00:00?',
    aspect: 1,
    tags: ['Adobe Illustrator', 'Adobe Lightroom', '© 2020'],
  },
  {
    type: 'project',
    title: 'Packaging for Croatian honey collection ',
    slug: 'infinum-honey',
    preview: InfinumHoneyPreview,
    filters: ['branding', 'merch'],
    description:
      'In the midst of a worldwide quarantine, Christmas 2020 called for a touch of sweetness to uplift spirits. We answered the call by curating a three-pack of Croatian honey, as a heartfelt gift for our clients. With over 500 gifts shipped, we aimed to bring a taste of warmth and indulgence to homes during these challenging times.',
    aspect: 1,
    blocks: [
      [Honey00, Honey01],
      [Honey02, Honey03],
    ],
    tags: ['Adobe Illustrator', 'Adobe Lightroom', '© 2020'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Fruit Stickers',
    slug: 'fruit-stickers',
    preview: FruitStickersPreview,
    filters: ['illustration'],
    description: 'Remember when TV programs ended at 00:00?',
    aspect: 1,
    blocks: [[Honey00], [Honey01], [Honey02, Honey03]],
    tags: ['Adobe Illustrator', 'Adobe Lightroom', '© 2020'],
  },
  {
    type: 'project',
    title: 'Midnight Design Studio Branding',
    slug: 'midnight-studio',
    preview: MidnightStudioPreview,
    filters: ['branding'],
    aspect: 0.7,
    description:
      'Branding for a design studio specializing in bold and captivating branding identities. Through a fusion of sharp typography and striking color palettes, we created impactful visual identity that resonates with the target audience',
    blocks: [[MidnightStudio00], [MidnightStudio01, MidnightStudio02]],
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
      'Nestled in the captivating landscapes of the Faroe Islands, the Havgrim Hotel branding captures the essence of tradition and timeless elegance. With its classic light color palette and refined typography, it evokes a sense of heritage.',
    blocks: [[HavgrimPreview00], [HavgrimPreview01, HavgrimPreview02, HavgrimPreview03]],
    tags: ['Adobe Illustrator', '© 2019'],
  },
  {
    hidden: true,
    type: 'project',
    title: 'Sign-off Poster Series',
    slug: 'program-end',
    preview: SignOffPreview,
    filters: ['illustration'],
    description:
      'Remember when TV programs used to end at midnight? What did you imagine happens after clock runs 00:00? These series of nostalgic posters takes you back to the days when the familiar image signaled the end of late-night programming. Posters showcase gradual deconstruction of the well known visual, from its structured grid to an explosion of colors and forms.',
    blocks: [
      [SignOff01, SignOff02, SignOff03],
      [SignOff04, SignOff05],
    ],
    tags: ['Adobe Illustrator', '© 2021'],
    aspect: 0.7,
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
    blocks: [
      [ElizabethsFlowers01, ElizabethsFlowers02],
      [ElizabethsFlowers03, ElizabethsFlowers04, ElizabethsFlowers05],
    ],
    tags: ['Adobe Illustrator', '© 2019'],
  },
];
