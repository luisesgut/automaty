"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ErrorBoundaryProps {
  fallbackTitle?: string;
  fallbackDescription?: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Ocurrió un error inesperado.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🛑 Error capturado por ErrorBoundary:", error, errorInfo);
    toast({
      title: "Error en la aplicación",
      description: error.message || "Ocurrió un error inesperado.",
      variant: "destructive",
    });
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: "" });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const title = this.props.fallbackTitle ?? "Algo salió mal";
    const description =
      this.props.fallbackDescription ??
      "Hemos capturado el error y puedes intentar recargar la página.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <Card className="max-w-lg w-full shadow-xl border border-red-200 dark:border-red-500/40">
          <CardHeader className="flex flex-col items-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <CardTitle className="text-center text-xl">{title}</CardTitle>
            <CardDescription className="text-center text-sm">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-300 text-center">
              Detalles técnicos: {this.state.errorMessage}
            </p>
            <div className="flex justify-center">
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Recargar página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;
