"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, Home as HomeIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error("🛑 Error atrapado en app/error.tsx:", error);
    toast({
      title: "Error inesperado",
      description: error.message || "Se produjo un error desconocido.",
      variant: "destructive",
    });
  }, [error]);

  const handleReload = () => {
    reset();
  };

  const navigateHome = () => {
    router.push("/");
  };

  return (
    <html>
      <body className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center px-4">
        <Toaster />
        <Card className="max-w-xl w-full shadow-lg border border-red-200 dark:border-red-500/40">
          <CardHeader className="flex flex-col items-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <CardTitle className="text-center text-xl">Algo salió mal</CardTitle>
            <CardDescription className="text-center text-sm">
              Nuestro equipo fue notificado. Puedes intentar recargar la vista o volver al inicio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-300 text-center break-words">
              Detalles técnicos: {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Código de seguimiento: {error.digest}
              </p>
            )}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button onClick={handleReload} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reintentar
              </Button>
              <Button variant="outline" onClick={navigateHome} className="gap-2">
                <HomeIcon className="w-4 h-4" />
                Ir al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
