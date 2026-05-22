import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, forward to an error monitoring service here (e.g. Sentry)
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReload() {
    window.location.reload();
  }

  handleGoHome() {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#003087"/>
              <path d="M7 19 L20 9 L33 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="8"  y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
              <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
              <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
            </svg>
          </div>

          <h1 className="text-gray-900 font-bold text-lg mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            An unexpected error occurred. Your account and funds are safe.
            Please reload the page or return to the dashboard.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-navy text-white font-semibold text-sm hover:bg-[#002066] transition-all"
            >
              Reload Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-all"
            >
              Go to Dashboard
            </button>
          </div>

          <p className="text-gray-400 text-xs mt-6">
            If this keeps happening, contact{' '}
            <a href="mailto:support@mctbank.online" className="text-navy hover:underline">
              support@mctbank.online
            </a>
          </p>
        </div>
      </div>
    );
  }
}
