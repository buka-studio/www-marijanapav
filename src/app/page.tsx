import Link from 'next/link';

import Button from '~/src/components/ui/Button';

import ViewLogger from '../components/ViewCounter';
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
import MouseVarsProvider from './components/MouseVarsProvider';

import './page.css';

const projectLinks = [
  { label: 'Branding', href: '/work?f=branding' },
  { label: 'UX/UI', href: '/work?f=product-design' },
  { label: 'Illustration', href: '/work?f=illustration' },
  { label: 'Other', href: '/work?f=other' },
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

export default async function Home() {
  const currentCount = await fetchSneakPeekCount();

  return (
    <div>
      <Header />
      <ViewLogger pathname="/" />
      <div className="fixed glow h-[400px] w-[400px] blur-3xl rounded-full pointer-events-none" />
      <div className="flex flex-col px-5 py-12">
        <main className="pb-[100px]">
          <Heading />
          <div className="mb-[82px] flex items-center gap-4 text-text-primary">
            <div>What I do</div>
            <div className="flex gap-2">
              {projectLinks.map(({ label, ...linkProps }) => (
                <Link {...linkProps} key={label} legacyBehavior>
                  <Button as="a" size="sm" {...linkProps}>
                    {label}
                  </Button>
                </Link>
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
