'use client';

import clsx from 'clsx';

import Button from '~/src/components/ui/Button';
import Input from '~/src/components/ui/Input';

export default function SubscribeForm({ className = '' }: { className?: string }) {
  function handleSubscribe() {
    alert('Coming soon');
  }

  return (
    <form className={clsx(className)}>
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
