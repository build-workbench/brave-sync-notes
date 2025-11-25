import React, { useMemo, useCallback, Suspense, lazy, useState, useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import { useAppStore } from '../../store/useStore';
import { EditorSkeleton } from '../Loading/LoadingSpinner';

// Lazy load CodeMirror for better initial load performance
const CodeMirror = lazy(() => import('@uiw/react-codemirror'));

// Lazy load language extensions
const loadMarkdown = () => import('@codemirror/lang-markdown').then(m => m.markdown({ base: m.markdownLanguage }));
const loadJavaScript = () => import('@codemirror/lang-javascript').then(m => m.javascript({ jsx: true, typescript: true }));
const loadOneDark = () => import('@codemirror/theme-one-dark').then(m => m.oneDark);

const CodeEditor = ({ value, onChange, placeholder }) => {
  const darkMode = useAppStore((state) => state.darkMode);
  const fontSize = useAppStore((state) => state.fontSize);
  const tabSize = useAppStore((state) => state.tabSize);
  const lineNumbers = useAppStore((state) => state.lineNumbers);
  const wordWrap = useAppStore((state) => state.wordWrap);
  const editorMode = useAppStore((state) => state.editorMode);

  const [extensions, setExtensions] = useState([]);
  const [theme, setTheme] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Load extensions asynchronously
  useEffect(() => {
    let mounted = true;
    
    const loadExtensions = async () => {
      try {
        const exts = [];
        
        // Load language support based on mode
        if (editorMode === 'markdown') {
          const mdExt = await loadMarkdown();
          exts.push(mdExt);
        } else {
          const jsExt = await loadJavaScript();
          exts.push(jsExt);
        }
        
        // Word wrap
        if (wordWrap) {
          exts.push(EditorView.lineWrapping);
        }
        
        // Custom styling
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
        
        if (mounted) {
          setExtensions(exts);
        }
      } catch (err) {
        console.error('Failed to load editor extensions:', err);
      }
    };
    
    loadExtensions();
    
    return () => {
      mounted = false;
    };
  }, [editorMode, wordWrap, fontSize, darkMode]);

  // Load theme asynchronously
  useEffect(() => {
    let mounted = true;
    
    const loadTheme = async () => {
      try {
        if (darkMode) {
          const dark = await loadOneDark();
          if (mounted) setTheme(dark);
        } else {
          const light = EditorView.theme({
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
          if (mounted) setTheme(light);
        }
        if (mounted) setIsReady(true);
      } catch (err) {
        console.error('Failed to load editor theme:', err);
      }
    };
    
    loadTheme();
    
    return () => {
      mounted = false;
    };
  }, [darkMode]);

  // Memoize basic setup to prevent unnecessary re-renders
  const basicSetup = useMemo(() => ({
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
    autocompletion: false, // Disable for performance
    rectangularSelection: true,
    crosshairCursor: false,
    highlightActiveLine: true,
    highlightSelectionMatches: true,
    closeBracketsKeymap: true,
    defaultKeymap: true,
    searchKeymap: true,
    historyKeymap: true,
    foldKeymap: true,
    completionKeymap: false, // Disable for performance
    lintKeymap: false, // Disable for performance
    tabSize,
  }), [lineNumbers, tabSize]);

  // Memoize onChange handler
  const handleChange = useCallback((val) => {
    onChange(val);
  }, [onChange]);

  if (!isReady || extensions.length === 0 || !theme) {
    return <EditorSkeleton darkMode={darkMode} />;
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <Suspense fallback={<EditorSkeleton darkMode={darkMode} />}>
        <CodeMirror
          value={value}
          onChange={handleChange}
          extensions={extensions}
          theme={theme}
          placeholder={placeholder}
          basicSetup={basicSetup}
          className="h-full"
          style={{ height: '100%' }}
        />
      </Suspense>
    </div>
  );
};

export default React.memo(CodeEditor);
