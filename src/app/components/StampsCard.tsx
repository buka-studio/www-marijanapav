'use client';

import { LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';

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
        <div className="w-full overflow-hidden relative rounded-xl mb-5 min-h-[480px]">
          <div className="stamps absolute -translate-x-[10%] translate-y-[30px] scale-[120%] [&_>*:not(:first-child)]:mt-[-1px]">
            <Stamps />
          </div>
        </div>
        <div className="[&_>*]:align-middle [&_>*]:inline mb-4">
          <Heading className="text-6xl">
            <a href="#" className="group">
              Digital Stamp Collection
              <LinkIcon className="ml-4 inline w-[48px] h-[48px] group-hover:bg-main-theme-3 rounded-full p-1 transition-all duration-150" />
            </a>
          </Heading>
        </div>
        <p className="leading-7 text-text-secondary">
          Paying homage to my grandpa&apos;s lifelong passion for philately, by recreating the
          stamps in a compact form, exploring the blend of art, history, and typography and bringing
          it online for a new audience to enjoy.
        </p>
      </div>
    </Card>
  );
}
