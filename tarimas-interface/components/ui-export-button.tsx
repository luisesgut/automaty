"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"

interface Tarima {
  claveProducto: string
  lote: string
  nombreProducto: string
  unidad: string
  almacen: string
  cantidad: number
  po: string
  pesoBruto: number
  pesoNeto: number
  cajas: number
  orden: string
  itemNumber: string
  individualUnits: number
  totalUnits: number
  uom: string
}

interface ExportButtonProps {
  data: Tarima[]
  filename?: string
}

export function ExportButton({ data, filename = "tarimas-seleccionadas" }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = () => {
    if (!data.length) return

    setExporting(true)

    try {
      // Definir las columnas que queremos exportar
      const headers = [
        "Clave Producto",
        "Lote",
        "Nombre Producto",
        "Unidad",
        "Almacén",
        "Cantidad",
        "PO",
        "Peso Bruto (kg)",
        "Peso Neto (kg)",
        "Cajas",
        "Orden",
        "Item Number",
        "Unidades Individuales",
        "Unidades Totales",
        "UOM",
      ]

      // Convertir los datos a filas CSV
      const csvRows = []

      // Añadir los encabezados
      csvRows.push(headers.join(","))

      // Añadir los datos
      for (const row of data) {
        const values = [
          `"${row.claveProducto}"`,
          `"${row.lote}"`,
          `"${row.nombreProducto.replace(/"/g, '""')}"`, // Escapar comillas dobles
          `"${row.unidad}"`,
          `"${row.almacen}"`,
          row.cantidad,
          `"${row.po}"`,
          row.pesoBruto,
          row.pesoNeto,
          row.cajas,
          `"${row.orden}"`,
          `"${row.itemNumber}"`,
          row.individualUnits,
          row.totalUnits,
          `"${row.uom}"`,
        ]
        csvRows.push(values.join(","))
      }

      // Combinar en una sola cadena CSV
      const csvString = csvRows.join("\n")

      // Crear un blob con los datos
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })

      // Crear un enlace para descargar
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute("download", `${filename}.csv`)
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al exportar datos:", error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      disabled={exporting || !data.length}
      className="w-full md:w-auto"
    >
      <Download className="h-4 w-4 mr-1" />
      {exporting ? "Exportando..." : "Exportar selección"}
    </Button>
  )
}
