import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-2xl p-6 border border-border shadow-warm text-center">
          <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold mb-1">Oups, quelque chose s'est mal passé</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Nous avons rencontré une erreur inattendue. Vous pouvez réessayer ou revenir à l'accueil.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={this.reset} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
              <RefreshCw className="h-4 w-4" /> Réessayer
            </button>
            <a href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/70">
              <Home className="h-4 w-4" /> Accueil
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
