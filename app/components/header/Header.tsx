import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center bg-gradient-to-r from-white to-purple-50 dark:from-slate-900 dark:to-purple-900 px-6 py-4 border-b h-[var(--header-height)] shadow-sm backdrop-blur-lg',
        {
          'border-transparent': !chat.started,
          'border-bolt-elements-borderColor': chat.started,
        },
      )}
    >
      <div className="flex items-center gap-3 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <a href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center hover:scale-105 transition-transform duration-300">
          Flash.io
        </a>
      </div>
      <span className="flex-1 px-6 truncate text-center text-bolt-elements-textPrimary font-medium">
        <ClientOnly>{() => <ChatDescription />}</ClientOnly>
      </span>
      {chat.started && (
        <ClientOnly>
          {() => (
            <div className="mr-2">
              <HeaderActionButtons />
            </div>
          )}
        </ClientOnly>
      )}
    </header>
  );
}
