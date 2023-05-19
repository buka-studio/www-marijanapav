"use client";

import { useState } from "react";
import photo1 from "~/public/home/photos/photo_1.jpg";
import Card from "~/src/components/ui/Card";
import Heading from "~/src/components/ui/Heading";
import Image from "~/src/components/ui/Image";

import clsx from "clsx";
import { EyeIcon, EyeOffIcon } from "~/src/components/icons";
import "./cards.css";

export default function SneakPeekCard() {
  const [hiddenPercentage, setHiddenPercentage] = useState(100);
  const [clickCount, setClickCount] = useState(0);

  const p = photo1;
  console.log(hiddenPercentage);
  const revealed = hiddenPercentage === 0;

  return (
    <Card className="">
      <div>What I&apos;m working on ATM</div>
      <div className="flex items-start justify-between">
        <Heading as="h1" className="text-primary text-6xl mb-[100px]">
          Sneak
          <br />
          peek
        </Heading>
      </div>
      <div className="progress relative mb-2 rounded-full bg-main-theme-3 pr-2">
        <div
          className="progress-bar absolute bg-main-theme-2 rounded-full h-full min-w-[150px]"
          style={{
            width: `calc(100% - ${Math.min(hiddenPercentage)}%)`,
          }}
        />
        <button
          className="bg-main-theme-2 rounded-full flex items-center gap-2 relative py-[4px] px-[10px]"
          onClick={() => {
            setHiddenPercentage((p) => Math.max(p - 25, 0));
          }}
        >
          {revealed ? <EyeIcon /> : <EyeOffIcon />}
          Click to see
        </button>
        <span
          className={clsx(
            "absolute right-2 top-[6px] transition-all duration-[500ms] ease-out text-sm",
            {
              ["translate-y-4 opacity-0 "]: !revealed,
              ["opacity-100 translate-y-0"]: revealed,
            }
          )}
        >
          1231 clicks
        </span>
      </div>

      <div className="aspect-square relative rounded-xl overflow-hidden">
        <Image
          src={`/work/${p.src}`}
          alt={""}
          key={p.src}
          fill
          className="object-cover object-center"
        />
        <div
          className="cover bg-text-primary absolute left-0 top-0 w-full h-full transition-all duration-300"
          style={{
            backdropFilter: `blur(${hiddenPercentage / 10}px)`,
            opacity: hiddenPercentage / 100,
          }}
        />
      </div>
    </Card>
  );
}
