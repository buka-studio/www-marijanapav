import { LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function SupabaseCard() {
  return (
    <Card>
      <div className="flex flex-col justify-center w-full h-full p-3">
        <p className="mb-10 flex text-left text-text-alt justify-between w-full">
          Blog post
          <LinkIcon className="ml-4 inline w-6 h-6" />
        </p>
        <Heading className="text-4xl">
          <a href="#" className="group">
            Designing with&nbsp;AI
          </a>
        </Heading>
        <p className="mt-4 text-text-alt">
          Designing with AI: Generating unique artwork for every user
        </p>
      </div>
    </Card>
  );
}
