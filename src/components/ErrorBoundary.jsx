import React from 'react';
import { Icon, icons } from './Icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-surface-950 text-white">
          <div className="p-8 bg-surface-900 border border-red-500/20 rounded-2xl max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-400">
              <Icon d={icons.alert} className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-surface-200/60 text-sm mb-6">The application encountered an unexpected error. Please refresh the page.</p>
            <div className="text-left bg-black/40 p-3 rounded-lg overflow-x-auto mb-6">
              <code className="text-xs text-red-400 font-mono whitespace-pre-wrap">{this.state.error?.toString()}</code>
            </div>
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-colors">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
