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
    <Card className="flex flex-1 flex-col gap-4 bg-panel-background">
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
        <div className="absolute left-0 top-0 h-full w-full rounded-md bg-panel-overlay transition-colors duration-200" />
      </div>

      <p className="panel text-sm leading-6 text-text-primary">
        I&apos;m a designer interested in tech, exploring brand, web, illustration, and code. Lately
        my focus has been shaping brands and websites for devtools, which pushed me to explore
        frontend, curious how implementation can push design further when you follow it all the way
        from Figma to prod. I&apos;m based in Croatia where I co-run{' '}
        <TextLink className=" font-semibold hover:text-theme-1" href="https://www.buka.studio">
          Buka Studio
        </TextLink>{' '}
        alongside my partner (and a cat who rarely skips a meeting).
      </p>
      <div className="mt-4 flex flex-col items-start justify-between text-text-primary md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm">See what I&apos;ve been doing on</span>
          <div className="flex gap-2">
            {social.map(({ url, Icon, attrs }) => (
              <a
                target="_blank"
                rel="noreferrer noopener"
                key={url}
                href={`${url}`}
                className="hover cursor-pointer rounded-full transition-all duration-200 hoverable:text-theme-2 hoverable:hover:text-theme-1"
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
