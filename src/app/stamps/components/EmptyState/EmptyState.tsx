import { cn } from '~/src/util';

import Background from './Background.svg';
import Signature from './Signature';
import Sun from './Sun';

export default function EmptyState({
  className,
  animate,
  onAnimationComplete,
  shouldAnimate,
}: {
  className?: string;
  animate?: boolean;
  onAnimationComplete?: () => void;
  shouldAnimate?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      <Background className="text-stone-300 [mask-image:linear-gradient(90deg,transparent_0%,black_5%,black_95%,transparent_100%)]" />
      <Signature
        className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-stone-600 lg:min-w-[350px]"
        animate={animate}
        shouldAnimate={shouldAnimate}
        groupProps={{ onAnimationComplete }}
      />
      <Sun className="absolute right-[50px] top-5 w-14 text-stone-400 xl:right-[150px] xl:top-10" />
    </div>
  );
}
