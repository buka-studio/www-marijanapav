'use client';

import Button from '~/src/components/ui/Button';
import Input from '~/src/components/ui/Input';
import { cn } from '~/src/util';

export default function SubscribeForm({ className = '' }: { className?: string }) {
  function handleSubscribe() {
    alert('Coming soon');
  }

  return (
    <form className={cn(className)}>
      <Input
        type="email"
        placeholder="Enter email"
        containerClassName="w-full"
        className="w-full"
        action={<Button buttonClassName="bg-main-theme-4">Subscribe</Button>}
      />
    </form>
  );
}
