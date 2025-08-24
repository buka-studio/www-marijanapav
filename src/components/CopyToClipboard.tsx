'use client';

import React, { useState } from 'react';

import Button from '~/src/components/ui/Button';

export default function CopyToClipboard({
  content,
  label = 'Copy',
}: {
  content: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      onClick={() => {
        navigator.clipboard.writeText(content).then(() => {
          setCopied(true);
        });
      }}
    >
      {copied ? 'Copied!' : label}
    </Button>
  );
}
