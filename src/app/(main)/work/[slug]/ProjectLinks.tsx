import { ArrowRightIcon } from '@phosphor-icons/react/ssr';

type ProjectLink = { href: string; label: string };

// External project links: "→ label" with a soft underline; the arrow slides right on hover.
export function ProjectLinks({ links }: { links: ProjectLink[] }) {
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1">
      {links.map(({ href, label }) => (
        <li key={href}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="group/link text-text-secondary hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-text-primary inline-flex items-center gap-2 rounded-xs text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <ArrowRightIcon className="size-3 shrink-0 transition-transform duration-150 group-hover/link:translate-x-0.5 group-focus-visible/link:translate-x-0.5 motion-reduce:transition-none" />
            <span className="decoration-text-muted underline underline-offset-4">{label}</span>
            <span className="sr-only">(opens in new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
