import Card from './Card';

const tools = [
  'Affinity Designer',
  'Figma',
  'Procreate',
  'Illustrator',
  'InDesign',
  'Notion',
  'Raycast',
];

export default function ToolsCard() {
  return (
    <Card>
      <div className="flex h-full flex-col gap-8">
        <div className="flex justify-between">
          <span className="text-text-secondary">Tools I use</span>
        </div>
        <div className="relative h-[calc(3.5rem*4)] overflow-hidden text-[2.5rem] leading-[1.2] md:h-[calc(3.5rem*5)] md:text-[3rem] md:leading-[3.5rem] xl:h-[calc(3.5rem*4)]">
          <div className="track animate-[carousel-vertical_10s_linear_infinite]">
            {tools.concat(tools).map((t, i) => (
              <div key={i} className="font-archivo font-medium text-text-primary">
                {t}
              </div>
            ))}
          </div>
          <div className="absolute top-0 h-[100px] w-full [background:var(--panel-blend-layer)]" />
          <div className="absolute bottom-[-1px] h-[100px] w-full rotate-180 [background:var(--panel-blend-layer)]" />
        </div>
        <p className="mt-auto leading-7 text-text-secondary">
          I began in print while studying Visual Communications and gradually shifted to digital.
          Over time my go-to companion software switched from Illustrator, to InDesign, Procreate,
          Sketch, Figma. I loved them all, but my fav is Figma &#9825;
        </p>
      </div>
    </Card>
  );
}
