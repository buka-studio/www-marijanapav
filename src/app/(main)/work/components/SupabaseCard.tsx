import { LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function SupabaseCard() {
  return (
    <Card>
      <div className="group relative flex h-full w-full flex-col justify-center p-3">
        <p className="text-text-muted mb-10 flex w-full justify-between text-left">
          Blog post
          <LinkIcon className="group-hover:bg-theme-3 ml-4 inline h-7 w-7 rounded-full p-1" />
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
        <p className="text-text-muted mt-4">
          Designing with AI: Generating unique artwork for every user
        </p>
      </div>
    </Card>
  );
}
