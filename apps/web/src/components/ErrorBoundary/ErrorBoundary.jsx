import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { lang = 'zh' } = this.props;
      
      const messages = {
        zh: {
          title: '出错了',
          description: '应用程序遇到了一个错误。请尝试刷新页面或返回首页。',
          reload: '刷新页面',
          home: '返回首页',
          details: '错误详情',
        },
        en: {
          title: 'Something went wrong',
          description: 'The application encountered an error. Please try refreshing the page or go back to home.',
          reload: 'Reload Page',
          home: 'Go Home',
          details: 'Error Details',
        },
      };
      
      const t = messages[lang] || messages.zh;

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex p-4 rounded-full bg-red-500/20 text-red-500 mb-6">
              <AlertTriangle size={48} />
            </div>
            
            <h1 className="text-2xl font-bold mb-3">{t.title}</h1>
            <p className="text-slate-400 mb-6">{t.description}</p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                {t.reload}
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Home size={18} />
                {t.home}
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400">
                  {t.details}
                </summary>
                <pre className="mt-2 p-4 bg-slate-800 rounded-lg text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
