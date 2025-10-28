import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { DocumentDuplicateIcon, ClipboardCheckIcon } from './icons';
import { UI_LABELS } from '../constants';

interface GeneratedOutputProps {
  text: string;
  onCopyItem: (index: number) => void;
  itemCount: number;
}

const useCopyToClipboard = (): [boolean, (text: string) => void] => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    const copy = (text: string) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setIsCopied(true);
        }
    };

    return [isCopied, copy];
};

export const GeneratedOutput: React.FC<GeneratedOutputProps> = ({ text, onCopyItem, itemCount }) => {
  const [isAllCopied, copyAll] = useCopyToClipboard();

  return (
    <Card className="sticky top-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-highlight">{UI_LABELS.GENERATED_OUTPUT_TITLE}</h2>
        <Button onClick={() => copyAll(text)} disabled={!text}>
          {isAllCopied ? <ClipboardCheckIcon className="w-5 h-5 mr-2" /> : <DocumentDuplicateIcon className="w-5 h-5 mr-2" />}
          {isAllCopied ? UI_LABELS.COPIED : UI_LABELS.COPY_ALL}
        </Button>
      </div>
      <div className="bg-primary p-4 rounded-lg min-h-[250px] border border-accent/50 focus-within:ring-2 focus-within:ring-brand transition-all">
        <pre className="text-text-secondary whitespace-pre-wrap text-sm font-mono break-words">{text || UI_LABELS.OUTPUT_PLACEHOLDER}</pre>
      </div>
    </Card>
  );
};
