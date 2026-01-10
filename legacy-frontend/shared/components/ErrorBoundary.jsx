import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents the entire app from crashing
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error("❌ [ErrorBoundary] Caught error:", error);
    console.error("📋 [ErrorBoundary] Error info:", errorInfo);

    // Store error details in state
    this.setState({
      error,
      errorInfo,
    });

    // In production, you should log to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback UI
 * Shown when an error is caught by the Error Boundary
 */
function ErrorFallback({ error, errorInfo, onReset }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onReset();
    navigate("/");
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-800 rounded-2xl shadow-2xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Oops! Something went wrong
        </h1>

        {/* Description */}
        <p className="text-neutral-400 mb-6">
          We're sorry, but something unexpected happened. Don't worry, your data
          is safe. Try refreshing the page or going back home.
        </p>

        {/* Error details (only in development) */}
        {process.env.NODE_ENV === "development" && error && (
          <div className="mb-6 p-4 bg-neutral-900 rounded-lg text-left">
            <p className="text-xs font-mono text-red-400 mb-2">
              <strong>Error:</strong> {error.toString()}
            </p>
            {errorInfo && (
              <details className="text-xs font-mono text-neutral-500">
                <summary className="cursor-pointer hover:text-neutral-400">
                  Stack trace
                </summary>
                <pre className="mt-2 overflow-auto max-h-40">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReload}
            className="flex-1 bg-brand hover:bg-brand/90 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Page
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        </div>

        {/* Support message */}
        <p className="text-xs text-neutral-500 mt-6">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}

export default ErrorBoundary;

