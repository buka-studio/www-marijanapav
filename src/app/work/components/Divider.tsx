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
        'relative flex w-full justify-center before:absolute  before:-top-4 before:h-[1px] before:w-full before:bg-main-theme-3 md:before:top-1/2 md:before:-translate-y-1/2',
        className,
      )}
    >
      <div className="relative bg-main-background px-6 text-main-theme-3">{children}</div>
    </div>
  );
}
