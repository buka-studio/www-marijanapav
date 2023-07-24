'use client';

import Heading from '~/src/components/ui/Heading';
import Tag from '~/src/components/ui/Tag';

import Gibraltar1 from '../../../public/home/gibraltar_1.svg';
import Gibraltar2 from '../../../public/home/gibraltar_2.svg';
import Card from './Card';

const Stamps = () => (
  <>
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="row flex [&_>*:not(:first-child)]:ml-[-1px]">
        {Array.from({ length: 4 }).map((_, j) =>
          j % 2 === 0 ? <Gibraltar1 key={j} /> : <Gibraltar2 key={j} />,
        )}
      </div>
    ))}
  </>
);

export default function StampsCard() {
  return (
    <Card className="">
      <div className="flex flex-col">
        <div className="relative mb-5 min-h-[240px] w-full overflow-hidden rounded-xl xl:min-h-[480px]">
          <div className="stamps absolute translate-x-[9%] translate-y-[36px] scale-[120%] [&_>*:not(:first-child)]:mt-[-1px]">
            <Stamps />
          </div>
        </div>
        <div className="mb-4 [&_>*]:inline [&_>*]:align-middle">
          <Heading className="text-4xl md:text-5xl xl:text-6xl">
            <a href="#" className="group rounded-lg">
              Digital Stamp Collection&nbsp;
              <Tag className="ml-2 inline align-middle font-sans text-xs">Coming&nbsp;soon</Tag>
            </a>
          </Heading>
        </div>
        <p className="leading-7 text-text-secondary">
          Paying homage to my grandpa&apos;s lifelong passion for philately, by recreating his
          stamps in a digital form, exploring the blend of art, history, and typography and bringing
          it online for a new audience to enjoy.
        </p>
      </div>
    </Card>
  );
}
