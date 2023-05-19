import Card from "~/src/components/ui/Card";

const tools = [
  "Figma",
  "Procreate",
  "Affinity Designer",
  "Illustrator",
  "InDesign",
  "Pitch",
  "AfterEffects",
];

export default function ToolsCard() {
  return (
    <Card className="bg-panel-background shadow-lg shadow-panel-dropshadow-color">
      <div className="flex flex-col gap-8">
        <div className="text-[3.5rem] leading-[4rem] h-[calc(3.5rem*5)] overflow-hidden relative">
          <div className="track animate-[carousel-vertical_10s_linear_infinite]">
            {tools.concat(tools).map((t, i) => (
              <div
                key={i}
                className="font-medium font-archivo text-text-primary"
              >
                {t}
              </div>
            ))}
          </div>
          <div className="[background:var(--panel-blend-layer)] h-[100px] w-full top-0 absolute" />
          <div className="[background:var(--panel-blend-layer)] h-[100px] w-full bottom-[-1px] absolute rotate-180" />
        </div>
        <p className="text-text-primary leading-7">
          In today&apos;s ever-evolving design industry I enjoy exploring new
          ways to expand my toolkit. From industry standards like Adobe Creative
          Suite, to the latest tools on the market like MidJourney.
        </p>
      </div>
    </Card>
  );
}
