import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Copied');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-0 cursor-pointer"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      title={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="size-6 text-green-500" />
      ) : (
        <Copy className="size-6 text-gray-500" />
      )}
    </button>
  );
}
