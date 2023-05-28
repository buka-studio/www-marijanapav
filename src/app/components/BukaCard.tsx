import { BukaIcon, LinkIcon } from '~/src/components/icons';
import Card from '~/src/components/ui/Card';
import Heading from '~/src/components/ui/Heading';

export default function BukaCard() {
  return (
    <Card className="h-full">
      <div className="flex flex-col gap-7 h-full justify-between">
        <div className="flex justify-between">
          <span className="text-text-secondary">What&apos;s Next</span>
        </div>
        <div className="flex gap-4 items-center">
          <BukaIcon />
          <Heading className="text-5xl">
            <a href="buka.studio" className="flex items-center gap-3 group">
              buka.studio
              <LinkIcon className="w-[48px] h-[48px] group-hover:bg-main-theme-3 rounded-full p-1 transition-all duration-150" />
            </a>
          </Heading>
        </div>
        <p className="text-text-secondary">
          Branding and web project for a design and dev studio
          <br />
          (not yet live but I dare you to check the placeholder).
        </p>
      </div>
    </Card>
  );
}
