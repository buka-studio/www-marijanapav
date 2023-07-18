import Link from 'next/link';

import {
  ArrowRightIcon,
  BehanceIcon,
  DribbbleIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
} from '~/src/components/icons';
import Button from '~/src/components/ui/Button';
import Image from '~/src/components/ui/Image';

import PortraitSrc from '../../../public/home/me.jpg';
import Card from './Card';

import './cards.css';

const social = [
  {
    url: 'https://twitter.com/MarijanaSimag',
    Icon: TwitterIcon,
    attrs: { 'aria-label': 'Go to Twitter' },
  },
  {
    url: 'https://www.linkedin.com/in/marijana-simag/',
    Icon: LinkedinIcon,
    attrs: { 'aria-label': 'Go to Linkedin' },
  },
  {
    url: 'https://www.instagram.com/marijanasimag/',
    Icon: InstagramIcon,
    attrs: { 'aria-label': 'Go to Instagram' },
  },
  {
    url: 'https://dribbble.com/marijanasimag',
    Icon: DribbbleIcon,
    attrs: { 'aria-label': 'Go to Dribbble' },
  },
  {
    url: 'https://www.behance.net/marijanasimag',
    Icon: BehanceIcon,
    attrs: { 'aria-label': 'Go to Behance' },
  },
];

export default function BioCard() {
  return (
    <Card className="p-4 flex-1 flex flex-col rounded-2xl gap-4  bg-panel-background">
      <div className="relative">
        <Image
          alt="A wild Marijana caught drawing"
          src={PortraitSrc}
          placeholder="blur"
          className="rounded-xl w-full object-cover object-top max-h-[455px]"
          loading="eager"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
        <div className="transition-colors duration-200 rounded-xl bg-main-theme-overlay absolute h-full w-full top-0 left-0" />
      </div>

      <p className="leading-7 panel text-text-secondary">
        I&apos;ve had a chance to work in various environments, including a design studio, an
        agency, and now at Supabase &#9825;, a fast-growing startup. Through these different
        settings I worked on various skills, from editorial design, illustration, packaging, to a
        deep dive into all things digital, and now mostly focused on web design and UX. I&apos;m
        based in Central Europe, working from my home office, because life&apos;s too short for long
        commutes, but I do have to deal with a cat trying to sit on my keyboard.
      </p>
      <div className="flex flex-col items-start justify-between mt-9 text-text-secondary md:flex-row md:items-center">
        <div>See what I&apos;ve been doing on:</div>
        <div className="flex mr-auto mt-3 md:mt-0 md:ml-5 gap-2">
          {social.map(({ url, Icon, attrs }) => (
            <a
              target="_blank"
              rel="noreferrer noopener"
              key={url}
              href={`${url}`}
              className="hover transition-all duration-200 cursor-pointer hoverable:text-main-theme-2 hoverable:hover:text-main-theme-1"
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
