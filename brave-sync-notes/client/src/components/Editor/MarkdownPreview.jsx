import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '../../store/useStore';

const MarkdownPreview = ({ content }) => {
  const { darkMode } = useAppStore();

  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <div className="relative group my-4">
            <div className={`absolute top-0 right-0 px-2 py-1 text-xs rounded-bl ${
              darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}>
              {language}
            </div>
            <SyntaxHighlighter
              style={darkMode ? oneDark : oneLight}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      if (!inline) {
        return (
          <pre className={`p-4 rounded-lg overflow-x-auto ${
            darkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        );
      }
      
      return (
        <code
          className={`px-1.5 py-0.5 rounded text-sm font-mono ${
            darkMode 
              ? 'bg-slate-700 text-orange-400' 
              : 'bg-slate-200 text-orange-600'
          }`}
          {...props}
        >
          {children}
        </code>
      );
    },
    
    table({ children }) {
      return (
        <div className="overflow-x-auto my-4">
          <table className={`min-w-full divide-y ${
            darkMode ? 'divide-slate-700' : 'divide-slate-300'
          }`}>
            {children}
          </table>
        </div>
      );
    },
    
    th({ children }) {
      return (
        <th className={`px-4 py-2 text-left text-sm font-semibold ${
          darkMode ? 'bg-slate-800' : 'bg-slate-100'
        }`}>
          {children}
        </th>
      );
    },
    
    td({ children }) {
      return (
        <td className={`px-4 py-2 text-sm border-t ${
          darkMode ? 'border-slate-700' : 'border-slate-200'
        }`}>
          {children}
        </td>
      );
    },
    
    blockquote({ children }) {
      return (
        <blockquote className={`border-l-4 pl-4 my-4 italic ${
          darkMode 
            ? 'border-orange-500 text-slate-400' 
            : 'border-orange-500 text-slate-600'
        }`}>
          {children}
        </blockquote>
      );
    },
    
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:text-orange-600 underline decoration-orange-500/30 hover:decoration-orange-500 transition-colors"
        >
          {children}
        </a>
      );
    },
    
    img({ src, alt }) {
      return (
        <img
          src={src}
          alt={alt}
          className="max-w-full h-auto rounded-lg my-4 shadow-lg"
          loading="lazy"
        />
      );
    },
    
    hr() {
      return (
        <hr className={`my-8 border-t ${
          darkMode ? 'border-slate-700' : 'border-slate-300'
        }`} />
      );
    },
    
    ul({ children }) {
      return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
    },
    
    ol({ children }) {
      return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
    },
    
    li({ children }) {
      return <li className="leading-relaxed">{children}</li>;
    },
    
    h1({ children }) {
      return (
        <h1 className={`text-3xl font-bold mt-8 mb-4 pb-2 border-b ${
          darkMode ? 'border-slate-700' : 'border-slate-300'
        }`}>
          {children}
        </h1>
      );
    },
    
    h2({ children }) {
      return (
        <h2 className={`text-2xl font-bold mt-6 mb-3 pb-2 border-b ${
          darkMode ? 'border-slate-700' : 'border-slate-300'
        }`}>
          {children}
        </h2>
      );
    },
    
    h3({ children }) {
      return <h3 className="text-xl font-bold mt-5 mb-2">{children}</h3>;
    },
    
    h4({ children }) {
      return <h4 className="text-lg font-bold mt-4 mb-2">{children}</h4>;
    },
    
    p({ children }) {
      return <p className="my-3 leading-relaxed">{children}</p>;
    },
    
    input({ type, checked, ...props }) {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className={`mr-2 rounded ${
              darkMode 
                ? 'bg-slate-700 border-slate-600' 
                : 'bg-white border-slate-300'
            } ${checked ? 'accent-orange-500' : ''}`}
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },
  };

  return (
    <div className={`prose max-w-none p-6 md:p-8 ${
      darkMode ? 'prose-invert' : ''
    }`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content || '*No content yet...*'}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
