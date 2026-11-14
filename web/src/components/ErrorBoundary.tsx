import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Keeps a render error from blanking the whole page. Shows a readable message
 * with a reload button instead of an empty screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Broca crashed while rendering:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="single">
          <div className="inner">
            <h1>Something broke</h1>
            <p className="lede">
              This page hit an error while rendering. Reloading usually fixes it.
            </p>
            <div className="head" style={{ marginTop: 20, justifyContent: "flex-start", gap: 10 }}>
              <button className="btn primary" onClick={() => window.location.reload()}>
                Reload
              </button>
              <a className="btn" href="/">
                Back to questions
              </a>
            </div>
            <pre className="code" style={{ marginTop: 18 }}>{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
