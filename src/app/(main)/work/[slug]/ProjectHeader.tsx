import Link from 'next/link';

export function ProjectHeader({ title, backHref }: { title: string; backHref: string }) {
  return (
    <h1 className="text-text-primary mb-4 flex max-w-xl flex-wrap items-baseline gap-x-2 text-lg font-medium text-pretty">
      <Link
        href={backHref}
        className="text-text-muted hover:text-text-primary focus-visible:outline-text-primary rounded-xs font-normal transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Work
      </Link>
      <span className="text-text-muted font-normal" aria-hidden>
        /
      </span>
      <span>{title}</span>
    </h1>
  );
}
