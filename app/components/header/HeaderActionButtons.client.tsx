import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { useState } from 'react';
import { ProjectTemplates } from '~/components/templates/ProjectTemplates';
import { CodeSnippetLibrary } from '~/components/snippets/CodeSnippetLibrary';
import { ProjectManager } from '~/components/projects/ProjectManager';
import { AIAssistant } from '~/components/ai/AIAssistant';
import { ProjectStatsModal } from '~/components/stats/ProjectStatsModal';

interface HeaderActionButtonsProps {}

export function HeaderActionButtons({}: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const canHideChat = showWorkbench || !showChat;

  const handleSelectTemplate = (prompt: string) => {
    // For now, we'll just trigger a simple prompt enhancement
    // In a real implementation, this would integrate with the chat system
    console.log('Template selected:', prompt);
    setShowTemplates(false);
  };

  const handleInsertSnippet = (code: string) => {
    // For now, we'll just log the snippet
    // In a real implementation, this would integrate with the editor
    console.log('Snippet selected:', code.slice(0, 100) + '...');
    setShowSnippets(false);
  };

  const handleSelectProject = (project: any) => {
    // For now, we'll just log the project
    // In a real implementation, this would load the project context
    console.log('Project selected:', project);
    setShowProjects(false);
  };

  const handleAIMessage = (message: string) => {
    // For now, we'll just log the message
    // In a real implementation, this would send the message to the chat
    console.log('AI message:', message);
    setShowAIAssistant(false);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* New Feature Buttons */}
        <Button
          title="Project Templates"
          onClick={() => setShowTemplates(true)}
        >
          <div className="i-ph:squares-four text-sm" />
        </Button>

        <Button
          title="Code Snippets"
          onClick={() => setShowSnippets(true)}
        >
          <div className="i-ph:code text-sm" />
        </Button>

        <Button
          title="Project Manager"
          onClick={() => setShowProjects(true)}
        >
          <div className="i-ph:folder text-sm" />
        </Button>

        <Button
          title="AI Assistant"
          onClick={() => setShowAIAssistant(true)}
        >
          <div className="i-ph:robot text-sm" />
        </Button>

        <Button
          title="Project Statistics"
          onClick={() => setShowStats(true)}
        >
          <div className="i-ph:chart-bar text-sm" />
        </Button>

        <div className="w-[1px] bg-flashio-elements-borderColor h-6 mx-1" />

        {/* Original Chat/Workbench Toggle */}
        <div className="flex border border-flashio-elements-borderColor rounded-md overflow-hidden">
          <Button
            active={showChat}
            disabled={!canHideChat}
            onClick={() => {
              if (canHideChat) {
                chatStore.setKey('showChat', !showChat);
              }
            }}
          >
            <div className="i-flashio:chat text-sm" />
          </Button>
          <div className="w-[1px] bg-flashio-elements-borderColor" />
          <Button
            active={showWorkbench}
            onClick={() => {
              if (showWorkbench && !showChat) {
                chatStore.setKey('showChat', true);
              }

              workbenchStore.showWorkbench.set(!showWorkbench);
            }}
          >
            <div className="i-ph:code-bold" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showTemplates && (
        <ProjectTemplates
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showSnippets && (
        <CodeSnippetLibrary
          onInsertSnippet={handleInsertSnippet}
          onClose={() => setShowSnippets(false)}
        />
      )}

      {showProjects && (
        <ProjectManager
          onSelectProject={handleSelectProject}
          onClose={() => setShowProjects(false)}
        />
      )}

      {showAIAssistant && (
        <AIAssistant
          onSendMessage={handleAIMessage}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {showStats && (
        <ProjectStatsModal
          onClose={() => setShowStats(false)}
        />
      )}
    </>
  );
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
  title?: string;
}

function Button({ active = false, disabled = false, children, onClick, title }: ButtonProps) {
  return (
    <button
      title={title}
      className={classNames('flex items-center p-1.5 transition-colors', {
        'bg-flashio-elements-item-backgroundDefault hover:bg-flashio-elements-item-backgroundActive text-flashio-elements-textTertiary hover:text-flashio-elements-textPrimary':
          !active,
        'bg-flashio-elements-item-backgroundAccent text-flashio-elements-item-contentAccent': active && !disabled,
        'bg-flashio-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
          disabled,
      })}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
