import { cn } from '~/src/util';

export default function Divider({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex w-full justify-center before:absolute before:-top-4 before:h-px before:w-full before:bg-current md:before:top-1/2 md:before:-translate-y-1/2 in-[.theme-dark]:text-neutral-800 in-[.theme-light]:text-neutral-300',
        className,
      )}
    >
      {children && <div className="relative bg-main-background px-6 text-current">{children}</div>}
    </div>
  );
}
