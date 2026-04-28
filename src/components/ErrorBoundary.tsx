import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] p-8 text-center">
          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-serif">عذراً، حدث خطأ ما</h1>
            <p className="opacity-60">نحن نعمل على إصلاح المشكلة. يرجى المحاولة مرة أخرى لاحقاً.</p>
            <div className="bg-red-50 p-4 rounded-xl text-xs text-red-600 font-mono overflow-auto max-h-40">
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#3D2B1F] text-white px-8 py-3 rounded-full font-bold hover:bg-[#C5A028] transition-all"
            >
              إعادة التحميل
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
