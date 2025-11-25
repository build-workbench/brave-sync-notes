import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { useAppStore } from '../../store/useStore';
import { EditorView } from '@codemirror/view';

const CodeEditor = ({ value, onChange, placeholder }) => {
  const { darkMode, fontSize, tabSize, lineNumbers, wordWrap, editorMode } = useAppStore();

  const extensions = useMemo(() => {
    const exts = [];
    
    // Language support based on mode
    if (editorMode === 'markdown') {
      exts.push(markdown({ base: markdownLanguage }));
    } else {
      // Add multiple language support for code mode
      exts.push(javascript({ jsx: true, typescript: true }));
    }
    
    // Word wrap
    if (wordWrap) {
      exts.push(EditorView.lineWrapping);
    }
    
    // Custom tab size
    exts.push(EditorView.theme({
      '.cm-content': {
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, "Inconsolata", "Roboto Mono", "Source Code Pro", Menlo, monospace',
        fontSize: `${fontSize}px`,
        lineHeight: '1.6',
      },
      '.cm-gutters': {
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: `${fontSize - 2}px`,
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
      '.cm-placeholder': {
        color: darkMode ? '#6b7280' : '#9ca3af',
        fontStyle: 'italic',
      },
    }));
    
    return exts;
  }, [editorMode, wordWrap, fontSize, darkMode]);

  const theme = useMemo(() => {
    if (darkMode) {
      return oneDark;
    }
    return EditorView.theme({
      '&': {
        backgroundColor: '#ffffff',
        color: '#1f2937',
      },
      '.cm-content': {
        caretColor: '#f97316',
      },
      '.cm-cursor': {
        borderLeftColor: '#f97316',
      },
      '.cm-activeLine': {
        backgroundColor: '#f3f4f6',
      },
      '.cm-gutters': {
        backgroundColor: '#f9fafb',
        color: '#9ca3af',
        borderRight: '1px solid #e5e7eb',
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#f3f4f6',
      },
      '.cm-selectionMatch': {
        backgroundColor: '#fef3c7',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: '#fed7aa',
      },
    });
  }, [darkMode]);

  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={theme}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
          tabSize,
        }}
        className="h-full"
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default CodeEditor;
