'use client';

import Link from 'next/link';

import Gibraltar1 from '~/public/home/gibraltar_1.svg';
import Gibraltar2 from '~/public/home/gibraltar_2.svg';
import CardTitle from '~/src/components/ui/CardTitle';
import Tag from '~/src/components/ui/Tag';

import Card from './Card';

const Stamps = () => (
  <>
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="row flex [&_>*:not(:first-child)]:-ml-px">
        {Array.from({ length: 4 }).map((_, j) =>
          j % 2 === 0 ? <Gibraltar1 key={j} /> : <Gibraltar2 key={j} />,
        )}
      </div>
    ))}
  </>
);

export default function StampsCard() {
  return (
    <Card id="stamps">
      <div className="flex flex-col">
        <div className="relative mb-5 min-h-[240px] w-full overflow-hidden rounded-md xl:min-h-[420px]">
          <div className="stamps absolute translate-x-[9%] translate-y-[36px] scale-[120%] [&_>*:not(:first-child)]:-mt-px">
            <Stamps />
          </div>
        </div>
        <div className="mb-4 *:inline *:align-middle">
          <CardTitle variant="mono" className="flex items-center gap-2">
            <Link href="/stamps" className="group rounded-md">
              Digital Stamp Collection&nbsp;
              <Tag
                variant="dashed"
                className="ml-1 inline align-middle font-mono text-xs text-text-muted"
              >
                Coming&nbsp;soon
              </Tag>
            </Link>
          </CardTitle>
        </div>
        <p className="text-sm  text-text-primary">
          Paying homage to my grandpa&apos;s lifelong passion for philately, by recreating his
          stamps in a digital form, exploring the blend of art, history, and typography and bringing
          it online for a new audience to enjoy.
        </p>
      </div>
    </Card>
  );
}
