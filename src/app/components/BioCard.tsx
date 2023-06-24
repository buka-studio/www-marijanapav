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
  { url: '1', Icon: TwitterIcon },
  { url: '2', Icon: LinkedinIcon },
  { url: '3', Icon: InstagramIcon },
  { url: '4', Icon: DribbbleIcon },
  { url: '5', Icon: BehanceIcon },
];

export default function BioCard() {
  return (
    <Card className="p-4 flex-1 flex flex-col rounded-2xl gap-4  bg-panel-background">
      <div className="relative">
        <Image
          alt="A wild Marijana caught drawing"
          src={PortraitSrc}
          placeholder="blur"
          height={455}
          className="rounded-xl w-full object-cover object-top max-h-[455px]"
        />
        <div className="transition-colors duration-200 rounded-xl bg-main-theme-overlay absolute h-full w-full top-0 left-0" />
      </div>

      <p className="leading-7 panel text-text-secondary">
        I&apos;ve worked in various design environments, including a studio, an agency, and now at a
        fast-growing startup. Through these different settings I&apos;ve had a chance to work on
        various skills, from editorial design, illustration, packaging, to a deep dive into all
        things digital, and now mostly focused on web design and UX. I&apos;m based in Central
        Europe, working from a home office, because life&apos;s too short for long commutes, but I
        do have to deal with my cat trying to sit on my keyboard.
      </p>
      <div className="flex flex-col items-start  justify-between mt-9 text-text-secondary xl:flex-row xl:items-center">
        <div>See what I&apos;ve been doing on:</div>
        <div className="flex mr-auto mt-3 xl:mt-0 xl:ml-5 gap-2">
          {social.map(({ url, Icon }) => (
            <a
              target="_blank"
              rel="noreferrer"
              key={url}
              href={`${url}`}
              className="hover transition-all duration-100 cursor-pointer"
            >
              <Icon />
            </a>
          ))}
        </div>
        <Button className="mt-10 xl:mt-0" iconRight={<ArrowRightIcon />}>
          Let&apos;s talk
        </Button>
      </div>
    </Card>
  );
}
