import { AppErrorPage } from '@/pages/errors/AppErrorPage';
import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error;
  info: any;
}

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: new Error(), info: {} };
  }

  static getDerivedStateFromError(err: Error) {
    // TODO: proper error reporting and logging
    console.log(err);
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    // Example "componentStack":
    //   in ComponentThatThrows (created by App)
    //   in ErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    console.log(error);
    console.log(info);
    this.setState({ error, info });
    // TODO: proper error reporting and logging
    // logErrorToMyService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || <AppErrorPage error={this.state.error} info={this.state.info} />;
    }

    return this.props.children;
  }
}
