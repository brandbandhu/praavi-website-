import { Component, ErrorInfo, ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Praavi page render failed", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <section className="min-h-[60vh] section-padding">
          <div className="container-max">
            <div className="service-card">
              <h1 className="font-display text-2xl font-bold mb-3">Page could not load</h1>
              <p className="text-sm text-muted-foreground mb-4">
                A frontend error stopped this page from rendering. Refresh the page after the latest code reloads.
              </p>
              <pre className="overflow-auto rounded-lg border border-border bg-background p-4 text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
