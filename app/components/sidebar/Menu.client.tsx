import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { db, deleteById, getAll, chatId, type ChatHistoryItem } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { logger } from '~/utils/logger';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';

type DialogContent = { type: 'delete'; item: ChatHistoryItem } | null;

export function Menu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteItem = useCallback((event: React.UIEvent, item: ChatHistoryItem) => {
    event.preventDefault();

    if (db) {
      deleteById(db, item.id)
        .then(() => {
          loadEntries();

          if (chatId.get() === item.id) {
            // hard page navigation to clear the stores
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          toast.error('Failed to delete conversation');
          logger.error(error);
        });
    }
  }, []);

  const closeDialog = () => {
    setDialogContent(null);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <div
      ref={menuRef}
      className="flex flex-col side-menu fixed top-0 left-0 w-[280px] h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-r border-flashio-elements-borderColor shadow-2xl text-sm z-sidebar backdrop-blur-lg"
    >      <div className="flex items-center h-[80px] px-6 border-b border-flashio-elements-borderColor">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-flashio-elements-textPrimary text-lg">Flash.io</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <div className="p-5">
          <a
            href="/"
            className="flex gap-3 items-center bg-flashio-elements-sidebar-buttonBackgroundDefault text-flashio-elements-sidebar-buttonText hover:bg-flashio-elements-sidebar-buttonBackgroundHover rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105"
          >
            <span className="inline-block i-flashio:chat scale-125" />
            <span className="font-semibold">Start new chat</span>
          </a>
        </div>
        <div className="text-flashio-elements-textPrimary font-semibold pl-6 pr-5 my-3 text-sm uppercase tracking-wide">Your Chats</div>
        <div className="flex-1 overflow-scroll pl-5 pr-5 pb-5">
          {list.length === 0 && <div className="pl-2 text-flashio-elements-textTertiary text-center py-8">No previous conversations</div>}
          <DialogRoot open={dialogContent !== null}>
            {binDates(list).map(({ category, items }) => (
              <div key={category} className="mt-6 first:mt-0 space-y-2">
                <div className="text-flashio-elements-textTertiary sticky top-0 z-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pl-2 pt-2 pb-1 text-xs uppercase tracking-wide font-medium">
                  {category}
                </div>
                {items.map((item) => (
                  <HistoryItem key={item.id} item={item} onDelete={() => setDialogContent({ type: 'delete', item })} />
                ))}
              </div>
            ))}
            <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
              {dialogContent?.type === 'delete' && (
                <>
                  <DialogTitle>Delete Chat?</DialogTitle>
                  <DialogDescription asChild>
                    <div>
                      <p>
                        You are about to delete <strong>{dialogContent.item.description}</strong>.
                      </p>
                      <p className="mt-1">Are you sure you want to delete this chat?</p>
                    </div>
                  </DialogDescription>
                  <div className="px-5 pb-4 bg-flashio-elements-background-depth-2 flex gap-2 justify-end">
                    <DialogButton type="secondary" onClick={closeDialog}>
                      Cancel
                    </DialogButton>
                    <DialogButton
                      type="danger"
                      onClick={(event) => {
                        deleteItem(event, dialogContent.item);
                        closeDialog();
                      }}
                    >
                      Delete
                    </DialogButton>
                  </div>
                </>
              )}
            </Dialog>
          </DialogRoot>
        </div>
        <div className="flex items-center justify-between border-t border-flashio-elements-borderColor p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-2 text-flashio-elements-textSecondary text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Online
          </div>
          <ThemeSwitch />
        </div>
      </div>
    </div>
  );
}
