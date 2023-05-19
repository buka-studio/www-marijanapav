import Button from "~/src/components/ui/Button";
import Card from "~/src/components/ui/Card";
import Image from "~/src/components/ui/Image";
import PortraitSrc from "../../../public/home/me.jpg";

import {
  ArrowRightIcon,
  BehanceIcon,
  DribbbleIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
} from "~/src/components/icons";
import "./cards.css";

const social = [
  { url: "1", Icon: TwitterIcon },
  { url: "2", Icon: LinkedinIcon },
  { url: "3", Icon: InstagramIcon },
  { url: "4", Icon: DribbbleIcon },
  { url: "5", Icon: BehanceIcon },
];

export default function BackgroundCard() {
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

      <p className="leading-7 panel text-text-primary">
        My background as a visual designer includes experience from working at a
        small design studio, an agency, and currently a startup, which has honed
        my skills in typography, web design, and illustration. I specialize in
        blending traditional and digital design to craft visually engaging web
        designs and building strong brand identities.
      </p>
      <div className="flex flex-col items-start  justify-between mt-9 text-text-primary xl:flex-row xl:items-center">
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
