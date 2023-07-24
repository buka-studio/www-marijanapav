import { LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function SupabaseCard() {
  return (
    <Card>
      <div className="flex flex-col justify-center w-full h-full p-3 relative group">
        <p className="mb-10 flex text-left text-text-alt justify-between w-full">
          Blog post
          <LinkIcon className="ml-4 inline w-7 h-7 group-hover:bg-main-theme-3 rounded-full p-1" />
        </p>
        <Heading className="text-3xl md:text-4xl">
          <a
            href="https://supabase.com/blog/designing-with-ai-midjourney"
            className="before:absolute before:top-0 before:left-0 before:w-full before:h-full rounded-md"
            rel="noreferrer"
            target="_blank"
          >
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
