import { cn } from '~/src/util';

export function Hole({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-3 w-5 rounded-full bg-stone-300 shadow-inner shadow-black/20 lg:h-5 lg:w-3',
        className,
      )}
    />
  );
}

export function PunchPattern({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-full max-h-[564px] flex-col justify-between', className)}>
      <Hole className="w-3 lg:h-3" />
      <div className="flex flex-row gap-5 lg:flex-col">
        <Hole />
        <Hole />
      </div>
      <Hole className="w-3 lg:h-3" />
      <div className="flex flex-row gap-5 lg:flex-col">
        <Hole />
        <Hole />
      </div>
      <Hole className="w-3 lg:h-3" />
    </div>
  );
}
