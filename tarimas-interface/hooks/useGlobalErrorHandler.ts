import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

const formatMessage = (value: unknown): string => {
  if (value instanceof Error) {
    return value.message || "Error desconocido.";
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "Error desconocido.";
  }
};

export const useGlobalErrorHandler = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      toast({
        title: "Se produjo un error inesperado",
        description: formatMessage(event.error ?? event.message),
        variant: "destructive",
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      toast({
        title: "Operación no completada",
        description: formatMessage(event.reason),
        variant: "destructive",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
};

export default useGlobalErrorHandler;
