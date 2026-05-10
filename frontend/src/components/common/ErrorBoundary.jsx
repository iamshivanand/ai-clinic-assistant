import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Oops! Something went wrong.</h1>
            <p className="text-gray-500 mb-10 leading-relaxed font-medium">
              We encountered an unexpected error. Don't worry, your data is safe. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <RefreshCcw className="h-5 w-5" />
              <span>Refresh & Try Again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
