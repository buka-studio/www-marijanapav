'use client';

import { useState } from 'react';

import { ContentCopyIcon } from '~/src/components/icons';
import Button from '~/src/components/ui/Button';

export default function CopyToClipboard({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      iconLeft={<ContentCopyIcon />}
      onClick={() => {
        navigator.clipboard.writeText(content).then(() => {
          setCopied(true);
        });
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}
