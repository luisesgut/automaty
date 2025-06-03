import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-medium">Cargando inventario de tarimas...</h2>
      <p className="text-muted-foreground">Por favor espere un momento</p>
    </div>
  )
}
