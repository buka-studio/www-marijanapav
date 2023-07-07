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
        'w-full relative before:absolute before:h-[1px] before:w-full  before:bg-main-theme-3 flex justify-center md:before:top-1/2 md:before:-translate-y-1/2 before:-top-4',
        className,
      )}
    >
      <div className="px-6 text-main-theme-3 bg-main-background relative">{children}</div>
    </div>
  );
}
