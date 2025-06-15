import { memo } from 'react';
import { Markdown } from './Markdown';

interface AssistantMessageProps {
  content: string;
}

export const AssistantMessage = memo(({ content }: AssistantMessageProps) => {
  return (
    <div className="overflow-hidden w-full p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-bolt-elements-borderColor shadow-sm">
      <Markdown html>{content}</Markdown>
    </div>
  );
});
