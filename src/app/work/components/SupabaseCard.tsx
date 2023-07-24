import { LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function SupabaseCard() {
  return (
    <Card>
      <div className="group relative flex h-full w-full flex-col justify-center p-3">
        <p className="mb-10 flex w-full justify-between text-left text-text-alt">
          Blog post
          <LinkIcon className="ml-4 inline h-7 w-7 rounded-full p-1 group-hover:bg-main-theme-3" />
        </p>
        <Heading className="text-3xl md:text-4xl">
          <a
            href="https://supabase.com/blog/designing-with-ai-midjourney"
            className="rounded-md before:absolute before:left-0 before:top-0 before:h-full before:w-full"
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
