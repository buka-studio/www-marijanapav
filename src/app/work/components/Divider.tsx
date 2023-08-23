import clsx from 'clsx';

export default function Divider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'relative flex w-full justify-center before:absolute before:-top-4 before:h-[1px] before:w-full before:bg-current md:before:top-1/2 md:before:-translate-y-1/2 [.theme-dark_&]:text-neutral-800 [.theme-light_&]:text-neutral-300',
        className,
      )}
    >
      <div className="relative bg-main-background px-6 text-current">{children}</div>
    </div>
  );
}
