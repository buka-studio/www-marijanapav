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
  const setStampsDrawerOpen = useStampStore((s) => s.setStampsDrawerOpen);

  return (
    <div className={cn('relative block', className)}>
      <Background className="mask-[linear-gradient(90deg,transparent_0%,black_5%,black_95%,transparent_100%)] text-stone-300" />
      <SignaturePrompt
        className="absolute top-1/2 left-1/2 hidden w-full -translate-x-1/2 -translate-y-1/2 text-stone-600 lg:block lg:min-w-[350px]"
        animate={animate}
        shouldAnimate={shouldAnimate}
        groupProps={{ onAnimationComplete }}
      />
      <SignaturePromptSmall
        className="absolute top-1/2 left-1/2 block w-full max-w-[140px] -translate-x-1/2 -translate-y-1/2 text-stone-600 lg:hidden lg:min-w-[350px]"
        animate={animate}
        shouldAnimate={shouldAnimate}
        groupProps={{ onAnimationComplete }}
      />

      <Sun className="absolute top-5 right-[50px] hidden w-10 text-stone-400 lg:block xl:top-10 xl:right-[150px] xl:w-14" />
      {children}
      <button
        onClick={() => setStampsDrawerOpen(true)}
        className="absolute inset-0 lg:hidden"
        aria-label="Open stamps drawer"
      />
    </div>
  );
}
