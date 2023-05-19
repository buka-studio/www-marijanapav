import Card from "~/src/components/ui/Card";
import Heading from "~/src/components/ui/Heading";

import "./cards.css";

export default function LocationCard() {
  return (
    <Card className="h-full">
      <div className="flex flex-col h-full gap-4">
        <Heading as="h1" className="text-primary text-6xl mr-[60px]">
          Working remotely, from Croatia
        </Heading>
        <p className="mt-auto">
          Because life&apos;s too short for long commutes, but you might have to
          deal with a cat trying to sit on your keyboard.
        </p>
      </div>
    </Card>
  );
}
