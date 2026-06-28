import  { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught component exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center p-6 relative">
          <div className="absolute w-[300px] h-[300px] bg-dark-accent/10 rounded-full blur-[100px] top-[20%] left-[20%]"></div>
          <div className="absolute w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[100px] bottom-[20%] right-[20%]"></div>

          <div className="max-w-md w-full glass-panel p-8 text-center relative z-10 space-y-6">
            <div className="bg-rose-500/10 text-rose-400 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/5">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white font-outfit">Something went wrong</h2>
              <p className="text-sm text-dark-muted leading-relaxed">
                An unexpected interface crash was intercepted. Relax, your database goal tracking and plans are secure.
              </p>
            </div>

            {this.state.error && (
              <pre className="text-left text-xs bg-dark-card border border-dark-border/40 p-4 rounded-lg text-rose-300 overflow-x-auto max-h-36 font-mono leading-relaxed">
                {this.state.error.toString()}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="btn-primary w-full flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
