import Link from 'next/link';

import Button from '~/src/components/ui/Button';

import Heading from './Heading';
import {
  BackgroundCard,
  BukaCard,
  CurrentCard,
  ExperienceCard,
  LocationCard,
  PantoneCard,
  PhotosCard,
  SneakPeekCard,
  StampsCard,
  ThemeCard,
  ToolsCard,
} from './components';
import Header from './components/Header';
import MouseVarsProvider from './components/MouseVarsProvider';

import './page.css';

const projectLinks = [
  { label: 'Branding', href: '/work?f=branding' },
  { label: 'UX/UI', href: '/work?f=product-design' },
  { label: 'Illustration', href: '/work?f=illustration' },
  { label: 'Other', href: '/work?f=other' },
];

const cards = [
  { label: 'bio', Component: BackgroundCard },
  { label: 'work', Component: ExperienceCard },
  { label: 'location', Component: LocationCard },
  { label: 'pantone', Component: PantoneCard },
  { label: 'theme', Component: ThemeCard },
  { label: 'sneak', Component: SneakPeekCard },
  { label: 'photos', Component: PhotosCard },
  { label: 'buka', Component: BukaCard },
  { label: 'current', Component: CurrentCard },
  { label: 'tools', Component: ToolsCard },
  { label: 'stamps', Component: StampsCard },
];

export default function Home() {
  return (
    <>
      <Header />
      <div className="fixed glow h-[400px] w-[400px] blur-3xl rounded-full pointer-events-none" />
      <div className="flex flex-col px-5 py-12">
        <main className="pb-[100px]">
          <Heading />
          <div className="mb-[82px] flex items-center gap-4 text-text-primary">
            <div>What I do</div>
            <div className="flex gap-2">
              {projectLinks.map((l) => (
                <Link href={l.href} passHref key={l.href} legacyBehavior>
                  <Button as="a" size="sm">
                    {l.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          <MouseVarsProvider>
            <div className="cards">
              {cards.map(({ label, Component }, i) => (
                <div key={i} style={{ gridArea: label }}>
                  <Component />
                </div>
              ))}
            </div>
          </MouseVarsProvider>
        </main>
      </div>
    </>
  );
}
