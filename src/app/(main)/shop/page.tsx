import { Metadata } from 'next';

import { ArrowRightIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';
import ViewLogger from '~/src/components/ViewCounter';

import Header from '../components/Header';
import DraggableStickers from './DraggableStickers';

import './page.css';

export const metadata: Metadata = {
  title: 'Shop | Marijana Pavlinić',
};

export default async function Home() {
  return (
    <>
      <Header />
      <ViewLogger pathname="/shop" />
      <main className="shop flex flex-1 flex-col px-11 py-8">
        {/* dirty hack until https://github.com/vercel/next.js/issues/51030
        is resolved. .main:has(.shop) not supported in FF just yet
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `.main{overflow:hidden}`,
          }}
        />
        <div className="relative mb-[100px] flex flex-col items-center gap-2 md:mb-[150px] md:mt-[calc(var(--vh,1vh)*10)]">
          <p className="text-sm uppercase">Shop</p>
          <Heading className="text-center text-[clamp(2.25rem,2vw+2.5rem,4rem)] leading-none">
            Coming soon
          </Heading>
          <p className="text-center">
            Meanwhile, click, drag and explore&nbsp;
            <span className="inline-block animate-bounce">
              <ArrowRightIcon className="inline h-4 w-4 rotate-90" />
            </span>
          </p>
        </div>
        <DraggableStickers rotationSeed={Math.random()} positionSeed={Math.random()} />
      </main>
    </>
  );
}
