'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { oneDark } from '@codemirror/theme-one-dark'
import { ViewUpdate } from '@codemirror/view'

interface CodeEditorProps {
  filePath: string
  content: string
  language?: 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'markdown'
  theme?: 'light' | 'dark'
  readOnly?: boolean
  onChange?: (content: string) => void
  onSave?: (content: string) => void
  className?: string
}

const languageSupport: Record<string, any> = {
  javascript: javascript(),
  typescript: javascript(), // Use JavaScript support for TypeScript for now
  html: html(),
  css: css(),
  json: javascript(), // JSON can use JavaScript highlighting
  markdown: [], // Basic support for now
}

export function CodeEditor({
  filePath,
  content,
  language = 'javascript',
  theme = 'dark',
  readOnly = false,
  onChange,
  onSave,
  className = ''
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!editorRef.current) return

    // Determine language support
    const langSupport = languageSupport[language] || []

    // Create editor state
    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        langSupport,
        theme === 'dark' ? oneDark : [],
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged && onChange && !readOnly) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace'
          },
          '.cm-editor': {
            height: '100%'
          },
          '.cm-scroller': {
            height: '100%'
          },
          '.cm-content': {
            padding: '16px',
            minHeight: '100%'
          },
          '.cm-focused': {
            outline: 'none'
          }
        }),
        // Key bindings
        EditorView.domEventHandlers({
          keydown: (event, view) => {
            // Save shortcut (Ctrl+S or Cmd+S)
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
              event.preventDefault()
              if (onSave && !readOnly) {
                onSave(view.state.doc.toString())
              }
              return true
            }
            return false
          }
        }),
        readOnly ? EditorState.readOnly.of(true) : []
      ]
    })

    // Create editor view
    view.current = new EditorView({
      state,
      parent: editorRef.current
    })

    setIsReady(true)

    return () => {
      if (view.current) {
        view.current.destroy()
        view.current = null
      }
    }
  }, [filePath, language, theme, readOnly])

  // Update content when it changes externally
  useEffect(() => {
    if (view.current && content !== view.current.state.doc.toString()) {
      const transaction = view.current.state.update({
        changes: {
          from: 0,
          to: view.current.state.doc.length,
          insert: content
        }
      })
      view.current.dispatch(transaction)
    }
  }, [content])

  const getCurrentContent = () => {
    return view.current?.state.doc.toString() || ''
  }

  const insertText = (text: string, position?: number) => {
    if (!view.current) return

    const pos = position ?? view.current.state.selection.main.head
    const transaction = view.current.state.update({
      changes: { from: pos, insert: text },
      selection: { anchor: pos + text.length }
    })
    view.current.dispatch(transaction)
  }

  const replaceRange = (from: number, to: number, text: string) => {
    if (!view.current) return

    const transaction = view.current.state.update({
      changes: { from, to, insert: text }
    })
    view.current.dispatch(transaction)
  }

  const formatCode = async () => {
    if (!view.current || readOnly) return

    try {
      // This would integrate with a code formatter like Prettier
      // For now, just trigger a save to demonstrate the API
      const content = getCurrentContent()
      if (onSave) {
        onSave(content)
      }
    } catch (error) {
      console.error('Failed to format code:', error)
    }
  }

  const focusEditor = () => {
    if (view.current) {
      view.current.focus()
    }
  }

  return (
    <div className={`code-editor-container ${className}`}>
      <div className="editor-header bg-gray-800 text-white px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{filePath.split('/').pop()}</span>
          <span className="text-xs text-gray-400 uppercase">{language}</span>
        </div>
        <div className="flex items-center space-x-2">
          {!readOnly && (
            <>
              <button
                onClick={formatCode}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Format
              </button>
              <button
                onClick={() => onSave?.(getCurrentContent())}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Save
              </button>
            </>
          )}
          <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
        </div>
      </div>
      <div 
        ref={editorRef} 
        className="editor-content flex-1"
        style={{ height: '500px' }}
      />
    </div>
  )
}

// Hook for managing multiple editor instances
export function useCodeEditor() {
  const [editors, setEditors] = useState<Map<string, EditorView>>(new Map())

  const registerEditor = (filePath: string, view: EditorView) => {
    setEditors(prev => new Map(prev).set(filePath, view))
  }

  const unregisterEditor = (filePath: string) => {
    setEditors(prev => {
      const newMap = new Map(prev)
      newMap.delete(filePath)
      return newMap
    })
  }

  const getEditor = (filePath: string) => {
    return editors.get(filePath)
  }

  const getAllEditors = () => {
    return Array.from(editors.entries())
  }

  return {
    registerEditor,
    unregisterEditor,
    getEditor,
    getAllEditors
  }
}

export default CodeEditor
