import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import { type ChatHistoryItem } from '~/lib/persistence';

interface HistoryItemProps {
  item: ChatHistoryItem;
  onDelete?: (event: React.UIEvent) => void;
}

export function HistoryItem({ item, onDelete }: HistoryItemProps) {
  const [hovering, setHovering] = useState(false);
  const hoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    function mouseEnter() {
      setHovering(true);

      if (timeout) {
        clearTimeout(timeout);
      }
    }

    function mouseLeave() {
      setHovering(false);
    }

    hoverRef.current?.addEventListener('mouseenter', mouseEnter);
    hoverRef.current?.addEventListener('mouseleave', mouseLeave);

    return () => {
      hoverRef.current?.removeEventListener('mouseenter', mouseEnter);
      hoverRef.current?.removeEventListener('mouseleave', mouseLeave);
    };
  }, []);
  return (
    <div
      ref={hoverRef}
      className="group rounded-xl text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 overflow-hidden flex justify-between items-center px-3 py-3 transition-all duration-300 border border-transparent hover:border-purple-200 dark:hover:border-purple-700"
    >
      <a href={`/chat/${item.urlId}`} className="flex w-full relative truncate block font-medium">
        {item.description}
        <div className="absolute right-0 z-1 top-0 bottom-0 bg-gradient-to-l from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 group-hover:from-purple-50 group-hover:to-pink-50 dark:group-hover:from-purple-900/30 dark:group-hover:to-pink-900/30 w-8 flex justify-end group-hover:w-12 transition-all duration-300">
          {hovering && (
            <div className="flex items-center p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-item-contentDanger transition-colors duration-300">
              <Dialog.Trigger asChild>
                <button
                  className="i-ph:trash scale-110 hover:scale-125 transition-transform duration-300"
                  onClick={(event) => {
                    // we prevent the default so we don't trigger the anchor above
                    event.preventDefault();
                    onDelete?.(event);
                  }}
                />
              </Dialog.Trigger>
            </div>
          )}
        </div>
      </a>
    </div>
  );
}
