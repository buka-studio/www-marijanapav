import Link from 'next/link';

import {
  ArrowRightIcon,
  BlueskyIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  ReadCVIcon,
  TwitterIcon,
} from '~/src/components/icons';
import Button from '~/src/components/ui/Button';
import Image from '~/src/components/ui/Image';
import TextLink from '~/src/components/ui/TextLink';

import PortraitSrc from '../../../public/home/me.jpg';
import Card from './Card';

import './cards.css';

const social = [
  {
    url: 'https://twitter.com/marijanapav',
    Icon: TwitterIcon,
    attrs: { 'aria-label': 'Go to Twitter' },
  },
  {
    url: 'https://www.linkedin.com/in/marijana-pavlinic/',
    Icon: LinkedinIcon,
    attrs: { 'aria-label': 'Go to LinkedIn' },
  },
  {
    url: 'https://www.instagram.com/marijanapavlinic/',
    Icon: InstagramIcon,
    attrs: { 'aria-label': 'Go to Instagram' },
  },
  {
    url: 'https://bsky.app/profile/marijanapav.com',
    Icon: BlueskyIcon,
    attrs: { 'aria-label': 'Go to Bluesky' },
  },
  {
    url: 'https://read.cv/marijanapav',
    Icon: ReadCVIcon,
    attrs: { 'aria-label': 'Go to ReadCV' },
  },
  {
    url: 'https://github.com/marijanapav',
    Icon: GithubIcon,
    attrs: { 'aria-label': 'Go to GithHub' },
  },
];

export default function BioCard() {
  return (
    <Card className="flex flex-1 flex-col gap-4 bg-panel-background p-4">
      <div className="relative">
        <Image
          alt="A wild Marijana caught drawing"
          src={PortraitSrc}
          placeholder="blur"
          className="max-h-[455px] w-full rounded-md object-cover object-top"
          loading="eager"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
        <div className="bg-panel-overlay absolute left-0 top-0 h-full w-full rounded-md transition-colors duration-200" />
      </div>

      <p className="panel leading-7 text-text-primary">
        I&apos;m a designer interested in tech, co-running{' '}
        <TextLink href="https://www.buka.studio">Buka Studio</TextLink>. I have experience working
        in a variety of environments, from small design studios to a large agency, as well as
        startups and contracting for various clients. Along the way, I&apos;ve picked up a mix of
        skills from editorial design, illustration, merchandise, to now primarily focusing on web
        design, UX and brand design. I&apos;m based in Europe, Croatia, working from my home
        office—because life&apos;s too short for long commutes, but I do have to deal with a cat
        trying to sit on my keyboard.
      </p>
      <div className="mt-9 flex flex-col items-start justify-between text-text-primary md:flex-row md:items-center">
        <div>See what I&apos;ve been doing on:</div>
        <div className="mr-auto mt-3 flex gap-2 md:ml-5 md:mt-0">
          {social.map(({ url, Icon, attrs }) => (
            <a
              target="_blank"
              rel="noreferrer noopener"
              key={url}
              href={`${url}`}
              className="hover hoverable:text-theme-2 hoverable:hover:text-theme-1 cursor-pointer rounded-full transition-all duration-200"
              {...attrs}
            >
              <Icon />
            </a>
          ))}
        </div>
        <Button className="mt-10 md:mt-0" iconRight={<ArrowRightIcon />} asChild>
          <Link href="/contact">Let&apos;s talk</Link>
        </Button>
      </div>
    </Card>
  );
}
