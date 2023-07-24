import Link from 'next/link';

import MouseVarsProvider from '~/src/components/MouseVarsProvider';
import Button from '~/src/components/ui/Button';
import ViewLogger from '~/src/components/ViewCounter';

import {
  BioCard,
  BukaCard,
  ColorThemeCard,
  CurrentCard,
  ExperienceCard,
  LocationCard,
  PantoneCard,
  PhotosCard,
  SneakPeekCard,
  StampsCard,
  ToolsCard,
} from './components';
import Header from './components/Header';
import Heading from './components/Heading';

import './page.css';

import { Filter } from './work/constants';

type FilterHref = `/work?f=${Filter}`;

const projectLinks: Array<{ label: string; href: FilterHref }> = [
  { label: 'Branding', href: '/work?f=branding' },
  { label: 'UX/UI', href: '/work?f=ux-ui' },
  { label: 'Illustration', href: '/work?f=illustration' },
];

const cards = [
  { gridArea: '👋', Component: BioCard },
  { gridArea: '👔', Component: ExperienceCard },
  { gridArea: '📌', Component: LocationCard },
  { gridArea: '🖌️', Component: PantoneCard },
  { gridArea: '🎨', Component: ColorThemeCard },
  { gridArea: '👀', Component: SneakPeekCard },
  { gridArea: '🖼️', Component: PhotosCard },
  { gridArea: '💯', Component: BukaCard },
  { gridArea: '🧪', Component: CurrentCard },
  { gridArea: '👩‍💻', Component: ToolsCard },
  { gridArea: '💌', Component: StampsCard },
];

const fetchSneakPeekCount = () =>
  fetch(
    process.env.NEXT_PUBLIC_HOST +
      '/api/stats?' +
      new URLSearchParams([
        ['pathname', '/#sneak-peek'],
        ['type', 'action'],
      ]),
    { cache: 'no-store' },
  )
    .then((res) => res.json())
    .then((res) => res.count)
    .catch((e) => {
      console.error(e);
      return 0;
    });

export const metadata = {
  title: 'About | Marijana Šimag',
  description:
    'Visual designer and Illustrator working remotely from Croatia, deep diving into all things digital, focusing on web design and UX.',
};

export default async function Home() {
  const currentCount = await fetchSneakPeekCount();

  return (
    <div>
      <Header />
      <ViewLogger pathname="/" />
      <div className="glow pointer-events-none fixed h-[400px] w-[400px] rounded-full blur-3xl" />
      <div className="flex flex-col px-5 py-5 md:py-12">
        <main className="pb-[100px]">
          <Heading className="mb-8" />
          <div className="mb-20 flex flex-col items-start gap-2 text-text-primary xxs:flex-row xxs:items-center xxs:gap-4">
            <div>What I do</div>
            <div className="flex gap-2">
              {projectLinks.map(({ label, ...linkProps }) => (
                <Button size="sm" asChild key={label}>
                  <Link {...linkProps}>{label}</Link>
                </Button>
              ))}
            </div>
          </div>
          <MouseVarsProvider>
            <div className="cards">
              {cards.map(({ gridArea, Component }, i) => (
                <div key={i} style={{ gridArea }}>
                  <Component currentCount={currentCount} />
                </div>
              ))}
            </div>
          </MouseVarsProvider>
        </main>
      </div>
    </div>
  );
}
