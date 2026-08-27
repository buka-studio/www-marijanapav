import Link from 'next/link';

import PortraitSrc from '~/public/home/me.jpg';
import {
  ArrowRightIcon,
  BlueskyIcon,
  GithubIcon,
  LinkedinIcon,
  TwitterIcon,
} from '~/src/components/icons';
import Button from '~/src/components/ui/Button';
import Image from '~/src/components/ui/Image';
import TextLink from '~/src/components/ui/TextLink';

import Card from './Card';

import './cards.css';

const social = [
  {
    url: 'https://twitter.com/marijanapav',
    Icon: TwitterIcon,
    attrs: { 'aria-label': 'Go to Twitter' },
  },
  {
    url: 'https://github.com/marijanapav',
    Icon: GithubIcon,
    attrs: { 'aria-label': 'Go to GithHub' },
  },
  {
    url: 'https://www.linkedin.com/in/marijana-pavlinic/',
    Icon: LinkedinIcon,
    attrs: { 'aria-label': 'Go to LinkedIn' },
  },
  {
    url: 'https://bsky.app/profile/marijanapav.com',
    Icon: BlueskyIcon,
    attrs: { 'aria-label': 'Go to Bluesky' },
  },
];

export default function BioCard() {
  return (
    <Card className="bg-panel-background flex flex-1 flex-col gap-4">
      <div className="relative">
        <Image
          alt="A wild Marijana caught drawing"
          src={PortraitSrc}
          placeholder="blur"
          className="h-full w-full rounded-md object-cover object-top"
          loading="eager"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
        <div className="bg-panel-overlay absolute top-0 left-0 h-full w-full rounded-md transition-colors duration-200" />
      </div>

      <p className="panel text-text-primary text-sm leading-6">
        I&apos;m a Brand Designer at{' '}
        <TextLink
          className="hover:text-theme-1 font-semibold underline decoration-from-font underline-offset-2"
          href="https://vercel.com/home"
        >
          Vercel
        </TextLink>
        , working across brand, web, and code in the devtools space. Before that, I was at{' '}
        <TextLink
          className="hover:text-theme-1 font-semibold underline decoration-from-font underline-offset-2"
          href="https://livekit.io"
        >
          LiveKit
        </TextLink>{' '}
        and{' '}
        <TextLink
          className="hover:text-theme-1 font-semibold underline decoration-from-font underline-offset-2"
          href="https://supabase.com"
        >
          Supabase
        </TextLink>
        , where I helped shape their brand and websites as they grew, which pulled me deeper into
        frontend and actually building what I design. I&apos;m based in Croatia, where I also co-run{' '}
        <TextLink
          className="hover:text-theme-1 font-semibold underline decoration-from-font underline-offset-2"
          href="https://www.buka.studio"
        >
          Buka Studio
        </TextLink>{' '}
        with my partner (and a cat who rarely skips meetings).
      </p>
      <div className="text-text-primary mt-4 flex flex-col items-start justify-between md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">See what I&apos;ve been doing on</span>
          <div className="flex gap-2">
            {social.map(({ url, Icon, attrs }) => (
              <a
                target="_blank"
                rel="noreferrer noopener"
                key={url}
                href={`${url}`}
                className="hover text-theme-2 hover:text-theme-1 cursor-pointer rounded-full transition-all duration-200"
                {...attrs}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
        <Button className="mt-10 md:mt-0" iconRight={<ArrowRightIcon />} asChild>
          <Link href="/contact">Let&apos;s talk</Link>
        </Button>
      </div>
    </Card>
  );
}
