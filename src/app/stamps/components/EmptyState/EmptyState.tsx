import { cn } from '~/src/util';

import { useStampStore } from '../../store';
import Background from './Background.svg';
import { SignaturePrompt, SignaturePromptSmall } from './SignaturePrompt';
import Sun from './Sun';

interface Props {
  className?: string;
  animate?: boolean;
  onAnimationComplete?: () => void;
  shouldAnimate?: boolean;
  children?: React.ReactNode;
}

export default function EmptyState({
  className,
  animate,
  onAnimationComplete,
  shouldAnimate,
  children,
}: Props) {
  const store = useStampStore();

  return (
    <div className={cn('relative block', className)}>
      <Background className="text-stone-300 mask-[linear-gradient(90deg,transparent_0%,black_5%,black_95%,transparent_100%)]" />
      <SignaturePrompt
        className="absolute left-1/2 top-1/2 hidden w-full -translate-x-1/2 -translate-y-1/2 text-stone-600 lg:block lg:min-w-[350px]"
        animate={animate}
        shouldAnimate={shouldAnimate}
        groupProps={{ onAnimationComplete }}
      />
      <SignaturePromptSmall
        className="absolute left-1/2 top-1/2 block w-full max-w-[140px] -translate-x-1/2 -translate-y-1/2 text-stone-600 lg:hidden lg:min-w-[350px]"
        animate={animate}
        shouldAnimate={shouldAnimate}
        groupProps={{ onAnimationComplete }}
      />

      <Sun className="absolute right-[50px] top-5 hidden w-10 text-stone-400 lg:block xl:right-[150px] xl:top-10 xl:w-14" />
      {children}
      <button
        onClick={() => store.setStampsDrawerOpen(true)}
        className="absolute inset-0 lg:hidden"
        aria-label="Open stamps drawer"
      />
    </div>
  );
}
