import { preloadImage } from '~/src/util';

import { stampAtlases } from './atlas';
import Description from './components/Description';
import Stamps from './components/Stamps';
import SVGFilters from './components/SVGFilters';

import './page.css';

export default function Page() {
  preloadImage(stampAtlases.typographic.metadata.src);

  return (
    <div
      className="stamps-page grain grid min-h-svh grid-cols-1 grid-rows-[auto_auto] gap-10 overflow-clip bg-stone-100 lg:h-screen lg:max-h-screen lg:grid-cols-[minmax(auto,600px)_1fr] lg:grid-rows-1 lg:gap-x-6 lg:pl-10 xl:gap-x-10"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `:root{background:#f5f5f4 !important;}`,
        }}
      />
      <div className="stamps-copy scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100 overflow-x-clip overflow-y-auto">
        <Description className="mx-auto max-w-xl px-4 pt-4 lg:pt-5 lg:pb-10" />
      </div>
      <Stamps />

      <SVGFilters className="pointer-events-none absolute" />
    </div>
  );
}
