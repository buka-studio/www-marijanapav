"use client";

import { StaticImageData } from "next/image";
import Image from "~/src/components/ui/Image";
// export const dynamic = "force-static";
import { motion } from "framer-motion";
import Link from "next/link";
import EnjoyWork from "../../public/work/184A0632-2 1-1.png";
import Ducks from "../../public/work/184A0632-2 1-2.png";
import Bitcoin from "../../public/work/184A0632-2 1-3.png";
import Falkland from "../../public/work/184A0632-2 1.png";

// const image

// const getAssetPlaceholders = () => {};

// export default async function Work() {
//   const img = await getPlaiceholder("/work/poster.png");
//   // console.log(base64, img);
//   return <Work2 img={img} />;
// }

const projects = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "ten",
  "eleven",
] as const;

type Project = typeof projects;

const projectTypes = [
  "all",
  "illustration",
  "branding",
  "product design",
  "other",
] as const;
type ProjectType = typeof projectTypes;

type Col = number;
type Row = number;

type ProjectGridConfig = Record<string, Record<string, [Col, Row]>>;
type ProjectSources = Record<string, StaticImageData[]>;

const projectSources: ProjectSources = {
  falkland: [Falkland],
  ducks: [Ducks],
  bitcoin: [Bitcoin],
  enjoyWork: [EnjoyWork],
};

const filterConfig: ProjectGridConfig = {
  all: {
    falkland: [8, 1],
    enjoyWork: [4, 1],
    ducks: [6, 1],
    bitcoin: [6, 1],
    // five: [5, 2],
    // six: [7, 1],
    // seven: [3, 1],
    // eight: [9, 1],
    // nine: [3, 1],
    // ten: [3, 1],
    // eleven: [6, 1],
  },
  ill: {
    enjoyWork: [4, 1],
    ducks: [4, 1],
    bitcoin: [4, 1],
    falkland: [12, 1],
  },
};

const spring = {
  type: "spring",
  //   stiffness: 10,
  damping: 20,
  duration: 0.5,
};

export default function Work({ ...rest }: ProjectGridConfig) {
  //   console.log(searchParams);

  //   const cards = filterConfig[searchParams.tag || "all"];
  // console.log(cards);
  //   const container = {
  //     // hidden: { opacity: 0 },
  //     show: {
  //       //   opacity: 1,
  //       transition: {
  //         staggerChildren: 0.03,
  //       },
  //     },
  //   };

  //   const item = {
  //     hidden: { opacity: 0, y: 50 },
  //     show: { opacity: 1, y: 0 },
  //   };
  // console.log(cards, rest, "a");
  const cards = rest.config;
  return (
    <>
      <div>
        <Link href="/work">all</Link>
        <Link href="/work?tag=ill">ill</Link>
      </div>
      <div
        className="grid grid-cols-[repeat(12,1fr)] h-[1500px] grid-rows-[150px,250px] gap-5"
        // transition={{
        //   ease: "linear",
        // }}
        // variants={container}
        // initial="hidden"
        // animate="show"
      >
        {Object.entries(cards).map(([card, [cols, rows]], i) => (
          <motion.div
            key={card}
            style={{
              gridColumn: `span ${cols}`,
              gridRow: `span ${rows}`,
              // background: `rgba(${randInt(0, 255)}, ${randInt(0, 255)}, ${randInt(
              //   0,
              //   255
              // )}, 0.5)`,
            }}
            className="relative rounded-xl overflow-hidden"
            // variants={item}
            layoutId={`layout-${card}`}
            transition={spring}
          >
            {projectSources[card]!.map((s) => (
              <Image
                src={s}
                placeholder="blur"
                key={s.src}
                fill
                alt=""
                className="object-cover hover:-translate-y-20 rounded-xl"
              />
            ))}
          </motion.div>
        ))}
      </div>
    </>
  );
}
