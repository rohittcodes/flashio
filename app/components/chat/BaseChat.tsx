import type { Message } from 'ai';
import React, { type RefCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';

import styles from './BaseChat.module.scss';

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
}

const EXAMPLE_PROMPTS = [
  { text: 'Build a todo app in React using Tailwind' },
  { text: 'Build a simple blog using Astro' },
  { text: 'Create a cookie consent form using Material UI' },
  { text: 'Make a space invaders game' },
  { text: 'How do I center a div?' },
];

const TEXTAREA_MIN_HEIGHT = 76;

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900',
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex overflow-y-auto w-full h-full ml-[280px]">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full px-8')}>
            {!chatStarted && (
              <div id="intro" className="mt-12 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                      <span className="text-white font-bold text-2xl">F</span>
                    </div>
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                      Flash.io
                    </h1>
                  </div>
                  <p className="text-xl text-flashio-elements-textSecondary max-w-2xl mx-auto leading-relaxed">
                    Your AI-powered development environment. Create, build, and deploy full-stack applications with unprecedented speed and intelligence.
                  </p>
                </div>
                
                {/* Feature highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  <div className="text-center p-6 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-900 rounded-2xl shadow-lg border border-flashio-elements-borderColor hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="i-ph:squares-four text-3xl text-purple-500 mb-3 mx-auto" />
                    <div className="text-sm font-semibold text-flashio-elements-textPrimary mb-1">Templates</div>
                    <div className="text-xs text-flashio-elements-textTertiary">Quick starts</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-white to-pink-50 dark:from-slate-800 dark:to-pink-900 rounded-2xl shadow-lg border border-flashio-elements-borderColor hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="i-ph:code text-3xl text-pink-500 mb-3 mx-auto" />
                    <div className="text-sm font-semibold text-flashio-elements-textPrimary mb-1">Snippets</div>
                    <div className="text-xs text-flashio-elements-textTertiary">Code library</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-orange-900 rounded-2xl shadow-lg border border-flashio-elements-borderColor hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="i-ph:robot text-3xl text-orange-500 mb-3 mx-auto" />
                    <div className="text-sm font-semibold text-flashio-elements-textPrimary mb-1">AI Assistant</div>
                    <div className="text-xs text-flashio-elements-textTertiary">Smart coding</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-blue-900 rounded-2xl shadow-lg border border-flashio-elements-borderColor hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="i-ph:chart-bar text-3xl text-blue-500 mb-3 mx-auto" />
                    <div className="text-sm font-semibold text-flashio-elements-textPrimary mb-1">Analytics</div>
                    <div className="text-xs text-flashio-elements-textTertiary">Insights</div>
                  </div>
                </div>
              </div>
            )}
            <div
              className={classNames('px-6 pt-8', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col w-full flex-1 max-w-chat px-4 pb-6 mx-auto z-1"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames('relative w-full max-w-chat mx-auto z-prompt', {
                  'sticky bottom-0': chatStarted,
                })}
              >                <div
                  className={classNames(
                    'shadow-xl border-2 border-flashio-elements-borderColor bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-900 backdrop-filter backdrop-blur-[12px] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-purple-300',
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    className={`w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-flashio-elements-textPrimary placeholder-flashio-elements-textTertiary bg-transparent`}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

                        event.preventDefault();

                        sendMessage?.(event);
                      }
                    }}
                    value={input}
                    onChange={(event) => {
                      handleInputChange?.(event);
                    }}
                    style={{
                      minHeight: TEXTAREA_MIN_HEIGHT,
                      maxHeight: TEXTAREA_MAX_HEIGHT,
                    }}
                    placeholder="✨ How can Flash.io transform your idea into reality today?"
                    translate="no"
                  />
                  <ClientOnly>
                    {() => (
                      <SendButton
                        show={input.length > 0 || isStreaming}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          sendMessage?.(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                  <div className="flex justify-between text-sm p-4 pt-2">
                    <div className="flex gap-1 items-center">
                      <IconButton
                        title="Enhance prompt"
                        disabled={input.length === 0 || enhancingPrompt}
                        className={classNames({
                          'opacity-100!': enhancingPrompt,
                          'text-flashio-elements-item-contentAccent! pr-1.5 enabled:hover:bg-flashio-elements-item-backgroundAccent!':
                            promptEnhanced,
                        })}
                        onClick={() => enhancePrompt?.()}
                      >
                        {enhancingPrompt ? (
                          <>
                            <div className="i-svg-spinners:90-ring-with-bg text-flashio-elements-loader-progress text-xl"></div>
                            <div className="ml-1.5">Enhancing prompt...</div>
                          </>
                        ) : (
                          <>
                            <div className="i-flashio:stars text-xl"></div>
                            {promptEnhanced && <div className="ml-1.5">Prompt enhanced</div>}
                          </>
                        )}
                      </IconButton>
                    </div>
                    {input.length > 3 ? (
                      <div className="text-xs text-flashio-elements-textTertiary">
                        Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for a new line
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="bg-flashio-elements-background-depth-1 pb-6">{/* Ghost Element */}</div>
              </div>
            </div>
            {!chatStarted && (
              <div id="examples" className="relative w-full max-w-4xl mx-auto mt-8 flex justify-center">
                <div className="w-full">
                  <h3 className="text-center text-flashio-elements-textSecondary mb-6 font-medium">Try these popular prompts to get started</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {EXAMPLE_PROMPTS.map((examplePrompt, index) => {
                      return (
                        <button
                          key={index}
                          onClick={(event) => {
                            sendMessage?.(event, examplePrompt.text);
                          }}
                          className="group flex items-center justify-between w-full p-4 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-900 border border-flashio-elements-borderColor hover:border-purple-300 rounded-xl text-left text-flashio-elements-textSecondary hover:text-flashio-elements-textPrimary transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        >
                          <span className="flex-1 text-sm font-medium">{examplePrompt.text}</span>
                          <div className="i-ph:arrow-right opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-purple-500" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );
  },
);
