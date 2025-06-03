"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import FilteredResultItemDisplay from "@/components/FilteredResultItemDisplay"; // O la ruta relativa correcta
import PasteExcel from "@/components/pasteExcel"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Package, Truck, BarChart3, Loader2, X, ChevronDown, ChevronUp, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import SeleccionResumen from "@/components/SeleccionResumen"; // Ajusta la ruta si es necesario


// Actualizar la interfaz para incluir los nuevos campos
export interface Tarima {
  claveProducto: string;
  lote: string;
  nombreProducto: string;
  unidad: string;
  almacen: string;
  cantidad: number;
  po: string;
  pesoBruto: number;
  pesoNeto: number;
  cajas: number;
  ordenSAP: string; // <--- CAMBIO AQUÍ: de 'orden' a 'ordenSAP'
  prodEtiquetaRFIDId: number;
  itemNumber: string;
  individualUnits: number;
  totalUnits: number;
  uom: string;
  asignadoAentrega: boolean;
}
// Tipo para un par PO/ItemNumber parseado del Excel
interface ParsedExcelItem {
  PO: string;
  ItemNumber: string;
}

// Tipo para un solo resultado de la API (un elemento del array de respuesta)
interface ApiFilterResponseItem {
  filtroSolicitado: {
    po: string;
    itemNumber: string;
  };
  totalEncontrados: number;
  datos: Tarima[]; // Reutilizamos la interfaz Tarima que ya tienes
}

export default function Home() {
  const [tarimas, setTarimas] = useState<Tarima[]>([])
  const [selectedTarimas, setSelectedTarimas] = useState<Tarima[]>([])
  const [loading, setLoading] = useState(true)
  const [processingLoading, setProcessingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showPreview, setShowPreview] = useState(true)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"tarimas" | "excel">("tarimas")
   // NUEVOS ESTADOS PARA LA FUNCIONALIDAD DE FILTRADO POR EXCEL
   const [excelPastedText, setExcelPastedText] = useState<string>("");
  const [parsedExcelData, setParsedExcelData] = useState<ParsedExcelItem[]>([]);
  const [showExcelPreview, setShowExcelPreview] = useState<boolean>(false); // Para controlar visibilidad de la tabla de preview
   const [apiExcelResults, setApiExcelResults] = useState<ApiFilterResponseItem[] | null>(null);
   const [isFetchingApiExcelResults, setIsFetchingApiExcelResults] = useState<boolean>(false);
   const [apiExcelError, setApiExcelError] = useState<string | null>(null);
   const [excelFilteredResults, setExcelFilteredResults] = useState<Tarima[] | null>(null); // Para las tarimas encontradas
   const [excelSearchAttempted, setExcelSearchAttempted] = useState<boolean>(false); // Para saber si se intentó buscar

 

  
  const fetchTarimas = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("http://172.16.10.31/api/vwStockDestiny", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener datos: ${response.status}`)
      }

      const data = await response.json()
      setTarimas(data)
      
    } catch (err) {
      console.error("Error fetching data:", err)

      // Verificar si es un error de CORS
      if (err instanceof TypeError && err.message.includes("CORS")) {
        setError(
          "Error de CORS: No se puede acceder al servidor. Contacte al administrador para habilitar CORS en el servidor.",
        )
      } else {
        setError(err instanceof Error ? err.message : "Error desconocido al cargar datos")
      }

    } finally {
      setLoading(false)
    }
    
  }

  useEffect(() => {
    fetchTarimas();
  }, []);
  
//////////
const fetchFilteredStockFromApi = async () => {
  if (parsedExcelData.length === 0) {
    toast({
      title: "No hay datos para buscar",
      description: "Verifica los datos pegados primero.",
      variant: "default",
    });
    return;
  }

  setIsFetchingApiExcelResults(true);
  setApiExcelResults(null);
  setApiExcelError(null);

  try {
    // El formato para el API es [ { "PO": "...", "ItemNumber": "..." }, ... ]
    // parsedExcelData ya tiene este formato.
    const filtersParam = encodeURIComponent(JSON.stringify(parsedExcelData));
    const url = `http://172.16.10.31/api/vwStockDestiny/FilteredStockDestinyGrouped?filters=${filtersParam}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json", // o 'application/json' si el API lo requiere
      },
    });

    if (!response.ok) {
      const errorData = await response.text(); // Intenta obtener más detalles del error
      console.error("API Error Response:", errorData);
      throw new Error(`Error al buscar en API: ${response.status} - ${response.statusText}. Detalles: ${errorData.substring(0,100)}`);
    }

    const data: ApiFilterResponseItem[] = await response.json();
    setApiExcelResults(data);

    const totalItemsFoundAcrossFilters = data.reduce((sum, item) => sum + item.totalEncontrados, 0);
    if (totalItemsFoundAcrossFilters > 0) {
       toast({
        title: "Búsqueda completada",
        description: `Se procesaron ${data.length} filtros. Total de tarimas encontradas: ${totalItemsFoundAcrossFilters}.`,
      });
    } else {
       toast({
        title: "Búsqueda completada",
        description: "No se encontraron tarimas para los filtros proporcionados.",
        variant: "default"
      });
    }

  } catch (err) {
    console.error("Error fetching filtered stock:", err);
    const errorMessage = err instanceof Error ? err.message : "Error desconocido al conectar con la API.";
    setApiExcelError(errorMessage);
    toast({
      title: "Error en la Búsqueda",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsFetchingApiExcelResults(false);
  }
};

  const parsePastedData = (text: string): ParsedExcelItem[] => {
    if (!text.trim()) return [];
  
    const lines = text.trim().split('\n');
    const parsed: ParsedExcelItem[] = [];
  
    lines.forEach(line => {
      const parts = line.split(/\s+/); // Divide por uno o más espacios/tabs
      if (parts.length >= 2) {
        const po = parts[0].trim();
        // Asumimos que ItemNumber puede contener espacios si hay más de 2 partes,
        // y es todo lo que sigue después del PO.
        const itemNumber = parts.slice(1).join(' ').trim();
        if (po && itemNumber) { // Asegurarse que ambos tienen valor después de trim
          parsed.push({ PO: po, ItemNumber: itemNumber });
        }
      }
      // Ignorar líneas que no tengan al menos PO e ItemNumber
    });
    return parsed;
  };
  
  const handleVerifyPastedData = () => {
    const parsed = parsePastedData(excelPastedText);
    setParsedExcelData(parsed);
    setShowExcelPreview(true); // Mostrar la tabla de vista previa
    setApiExcelResults(null); // Limpiar resultados anteriores de API si se verifica de nuevo
    setApiExcelError(null);
  
    if (parsed.length === 0 && excelPastedText.trim() !== "") {
      toast({
        title: "Datos no reconocidos",
        description: "No se pudieron extraer pares PO/ItemNumber del texto. Asegúrate que cada línea tenga PO y luego ItemNumber.",
        variant: "destructive",
      });
    } else if (parsed.length > 0) {
       toast({
        title: "Datos Verificados",
        description: `Se han parseado ${parsed.length} pares PO/ItemNumber para la búsqueda. Revisa la vista previa.`,
      });
    }
  };
  
  // Opcional: Parsear automáticamente al cambiar el texto del textarea
  useEffect(() => {
    if (excelPastedText.trim() === "") {
      setParsedExcelData([]);
      setShowExcelPreview(false);
      setApiExcelResults(null);
    } else {
      // Podrías llamar a parsePastedData aquí si quieres una preview "live"
      // o mantenerlo solo con el botón "Verificar"
      // Por ahora, lo dejamos con el botón para un control explícito.
    }
  }, [excelPastedText]);

  // Función para procesar las tarimas seleccionadas
  // Función para procesar las tarimas seleccionadas
// page.tsx
// ... (dentro de tu componente Home)

const processTarimas = async () => {
  // 1. Filtrar solo las tarimas seleccionadas que NO están asignadas aún
  const tarimasAProcesar = selectedTarimas.filter(t => !t.asignadoAentrega);

  if (tarimasAProcesar.length === 0) {
    toast({
      title: "Nada que procesar",
      description: "Todas las tarimas seleccionadas ya están asignadas o no hay tarimas seleccionadas válidas.",
      variant: "default",
    });
    return; // Salir si no hay nada que procesar
  }

  setProcessingLoading(true); // Iniciar indicador de carga para el proceso completo
  let statusActualizadoExitosamente = false;

  // --- PARTE 1: Actualizar el estado de las tarimas ---
  try {
    const rfidIds = tarimasAProcesar.map(tarima => tarima.prodEtiquetaRFIDId);
    const urlActualizacionEstado = "http://172.16.10.31/api/LabelDestiny/UpdateProdExtrasDestinyStatus?marcado=true";
    
    const responseEstado = await fetch(urlActualizacionEstado, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(rfidIds),
    });

    if (!responseEstado.ok) {
      const errorMsg = await responseEstado.text();
      throw new Error(`Error al actualizar estado: ${responseEstado.status}. ${errorMsg}`);
    }

    // Actualizar estado local de las tarimas en la UI para reflejar el cambio
    setTarimas(prevTarimas =>
      prevTarimas.map(t =>
        tarimasAProcesar.some(procesada => procesada.prodEtiquetaRFIDId === t.prodEtiquetaRFIDId)
          ? { ...t, asignadoAentrega: true } // Marcar como asignada
          : t
      )
    );
    setSelectedTarimas(prevSeleccionadas => // También actualizar en la lista de seleccionadas si es necesario
      prevSeleccionadas.map(t =>
        tarimasAProcesar.some(procesada => procesada.prodEtiquetaRFIDId === t.prodEtiquetaRFIDId)
          ? { ...t, asignadoAentrega: true }
          : t
      )
    );

    toast({
      title: "Estado Actualizado",
      description: `${tarimasAProcesar.length} tarima(s) marcada(s) como asignada(s) a entrega.`,
      variant: "default",
    });
    statusActualizadoExitosamente = true; // Marcar que esta parte fue exitosa

  } catch (err) {
    console.error("Error al actualizar estado de tarimas:", err);
    toast({
      title: "Error en Actualización de Estado",
      description: err instanceof Error ? err.message : "Error desconocido al actualizar estado.",
      variant: "destructive",
    });
    setProcessingLoading(false); // Detener carga si la actualización de estado falla
    setShowProcessModal(false); // Cerrar el modal
    return; // No continuar a la generación de Excel si esto falla
  }

  // --- PARTE 2: Preparar JSON y descargar Excel ---
  // Solo proceder si la actualización de estado fue exitosa
  if (statusActualizadoExitosamente) {
    try {
      // Agrupar tarimas por 'ordenSAP'
      const tarimasAgrupadasPorOrden: Record<string, Tarima[]> = {};
      for (const tarima of tarimasAProcesar) {
        const claveOrden = tarima.ordenSAP || "SIN_ORDEN_SAP"; // <--- CAMBIO AQUÍ: usar tarima.ordenSAP
        if (!tarimasAgrupadasPorOrden[claveOrden]) {
          tarimasAgrupadasPorOrden[claveOrden] = [];
        }
        tarimasAgrupadasPorOrden[claveOrden].push(tarima);
      }

      const tablasParaExcel = Object.entries(tarimasAgrupadasPorOrden).map(([ordenSapNum, tarimasDeEstaOrden]) => { // 'ordenSapNum' es el valor de tarima.ordenSAP
        // Dentro de cada 'orden SAP', agrupar por producto (PO + ItemNumber)
        const productosEnOrden: Record<string, Tarima[]> = {};
        for (const tarima of tarimasDeEstaOrden) {
          const claveProducto = `${tarima.po}-${tarima.itemNumber}`;
          if (!productosEnOrden[claveProducto]) {
            productosEnOrden[claveProducto] = [];
          }
          productosEnOrden[claveProducto].push(tarima);
        }

        const itemsDeEnvio = Object.values(productosEnOrden).map(tarimasDelProducto => {
          const primeraTarima = tarimasDelProducto[0]; // Tomar datos base de la primera tarima del producto
          const totalPesoBruto = tarimasDelProducto.reduce((sum, t) => sum + t.pesoBruto, 0);
          const totalPesoNeto = tarimasDelProducto.reduce((sum, t) => sum + t.pesoNeto, 0);
          const totalPallets = tarimasDelProducto.length; // Número de tarimas seleccionadas para este producto
          const cajasPorPallet = primeraTarima.cajas; 

          // ---- ¡ATENCIÓN AQUÍ! CAMPOS POR DEFINIR O COMPLETAR ----
          const company = "BioFlex"; // EJEMPLO: Reemplazar o definir cómo obtener este valor
          const shipDate = new Date().toISOString(); // EJEMPLO: Usar fecha actual o la que corresponda
          const unitPrice = 0.0; // EJEMPLO: Necesita una fuente real para el precio unitario
          const quantityAlreadyShipped = "0"; // EJEMPLO: Definir cómo obtener esto
          const itemType = "Bag Wicket"; // EJEMPLO
          const salesCSRNames = "Equipo Ventas"; // EJEMPLO
          // Para 'unitsPerCase': Tu ejemplo JSON dice 3000, pero tu `tarima.individualUnits` puede ser 1000.
          // DEBES ACLARAR cuál es el valor correcto o cómo se calcula. Uso individualUnits por ahora.
          const unitsPerCase = primeraTarima.individualUnits || 0; 
          // ---- FIN DE CAMPOS POR DEFINIR ----
          const sapValue = primeraTarima.ordenSAP; // <--- CAMBIO AQUÍ: usar primeraTarima.ordenSAP
          if (!sapValue || sapValue.trim() === "") {
            // Puedes lanzar un error o manejarlo como prefieras si falta un SAP crítico
            console.warn(`ADVERTENCIA: El campo SAP (ordenSAP) está vacío para PO: ${primeraTarima.po}, Item: ${primeraTarima.itemNumber}. Usando 'N/A_SAP_VACIO' como placeholder.`);
            // Si el API no acepta un placeholder, este item podría causar un error.
            // Considera lanzar un error aquí para detener la generación si SAP es absolutamente mandatorio y no puede ser un placeholder.
            // throw new Error(`El campo SAP (ordenSAP) es requerido y falta para el producto PO: ${primeraTarima.po}, Item: ${primeraTarima.itemNumber}`);
          }

          return {
            company: company,
            shipDate: shipDate,
            poNumber: primeraTarima.po,
            sap: sapValue, // Usando el campo 'orden' de tu interfaz Tarima
            unitPrice: unitPrice,
            customerItemNumber: primeraTarima.itemNumber,
            itemDescription: primeraTarima.nombreProducto,
            quantityAlreadyShipped: quantityAlreadyShipped,
            pallets: totalPallets,
            casesPerPallet: cajasPorPallet,
            unitsPerCase: unitsPerCase, 
            grossWeight: totalPesoBruto,
            netWeight: totalPesoNeto,
            itemType: itemType,
            salesCSRNames: salesCSRNames,
          };
        });

        return {
          tableName: `LOAD ${ordenSapNum === "SIN_ORDEN_SAP" ? `DESCONOCIDO-${Date.now()}` : ordenSapNum}`,
          shippingItems: itemsDeEnvio,
        };
      });

      const payloadExcel = { tables: tablasParaExcel };
      // Usar un nombre de archivo más descriptivo o permitir que el usuario lo ingrese
      const nombreArchivoSugerido = `Release_${new Date().toISOString().split('T')[0]}.xlsx`;
      const urlExcel = `http://172.16.10.31/api/vwStockDestiny/downloadRelease?fileName=${encodeURIComponent(nombreArchivoSugerido)}`;

      const responseExcel = await fetch(urlExcel, {
        method: 'POST',
        headers: {
          'accept': '*/*', // El API parece aceptar cualquier cosa
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadExcel),
      });

      if (!responseExcel.ok) {
        const errorMsg = await responseExcel.text(); // Obtener el cuerpo del error si es posible
        throw new Error(`Error al generar Excel: ${responseExcel.status}. ${errorMsg.substring(0, 200)}`); // Limitar longitud del mensaje de error
      }

      // Proceso de descarga del archivo en el navegador
      const blob = await responseExcel.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const disposition = responseExcel.headers.get('content-disposition');
      let finalFileName = nombreArchivoSugerido; // Usar el nombre sugerido como fallback
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          finalFileName = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      link.download = finalFileName; 
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl); // Limpiar el objeto URL

      toast({
        title: "Excel Solicitado",
        description: `El archivo ${finalFileName} debería empezar a descargarse.`,
        variant: "default",
      });

    } catch (err) {
      console.error("Error en la generación/descarga de Excel:", err);
      toast({
        title: "Error al Generar Excel",
        description: err instanceof Error ? err.message : "Error desconocido al generar el archivo Excel.",
        variant: "destructive",
      });
      // Nota: El estado de las tarimas ya fue actualizado. No se revierte.
    }
  }

  setProcessingLoading(false); // Finalizar indicador de carga del proceso completo
  setShowProcessModal(false); // Cerrar el modal al final de todo
};


  const handleSelectTarima = (tarima: Tarima) => {
    setSelectedTarimas((prev) => {
      // Check if tarima is already selected
      const isSelected = prev.some((item) => item.prodEtiquetaRFIDId === tarima.prodEtiquetaRFIDId)

      if (isSelected) {
        // Remove from selection
        return prev.filter((item) => item.prodEtiquetaRFIDId !== tarima.prodEtiquetaRFIDId)
      } else {
        // Add to selection
        return [...prev, tarima]
      }
    })
  }

  const clearSelection = () => {
    setSelectedTarimas([])
  }

  const handleProcessExcelPaste = () => {
    if (!excelPastedText.trim()) {
      toast({
        title: "Campo vacío",
        description: "Por favor, pega algunos datos de Excel para buscar.",
        variant: "default", // o "warning" si tienes esa variante
      });
      setExcelFilteredResults([]); // Limpiar resultados si el campo está vacío
      setExcelSearchAttempted(true);
      return;
    }

    // Asumimos que se pega una lista de prodEtiquetaRFIDId, uno por línea.
    // Convertimos el texto pegado en un array de IDs (números).
    const idsFromPaste = excelPastedText
      .split('\n')
      .map(idStr => parseInt(idStr.trim(), 10))
      .filter(id => !isNaN(id)); // Filtramos los que no son números válidos

    if (idsFromPaste.length === 0) {
      toast({
        title: "Datos no válidos",
        description: "No se encontraron IDs de RFID válidos en el texto pegado.",
        variant: "destructive",
      });
      setExcelFilteredResults([]);
      setExcelSearchAttempted(true);
      return;
    }

    const handleResetAndRefresh = () => {
  // 1. Resetear estados de la pestaña "Inventario de Tarimas"
  setSearchTerm("");
  setSelectedTarimas([]);
  setShowPreview(true); // O tu valor por defecto para la vista previa

  // 2. Resetear estados de la pestaña "Filtrar por Excel"
  setExcelPastedText("");
  setParsedExcelData([]);
  setShowExcelPreview(false);
  setApiExcelResults(null);
  setIsFetchingApiExcelResults(false); // Asegurar que se detiene cualquier carga
  setApiExcelError(null);
  
  // 3. Opcional: volver a la pestaña por defecto
  setActiveTab("tarimas"); 

  // 4. Mostrar un mensaje al usuario
  toast({
    title: "Proceso Reiniciado",
    description: "Se han limpiado los campos y filtros. Actualizando lista de tarimas...",
  });

  // 5. Actualizar la lista principal de tarimas
  // fetchTarimas ya maneja el estado de 'loading' por sí mismo.
  fetchTarimas(); 
};

    // Filtramos la lista completa de 'tarimas' usando los IDs obtenidos.
    const foundTarimas = tarimas.filter(tarima => 
      idsFromPaste.includes(tarima.prodEtiquetaRFIDId)
    );

    setExcelFilteredResults(foundTarimas);
    setExcelSearchAttempted(true); // Marcamos que se intentó una búsqueda

    if (foundTarimas.length > 0) {
      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${foundTarimas.length} tarima(s) que coinciden con los datos pegados.`,
        variant: "default", // Shadcn UI usa "default" para éxito, verde usualmente
      });
    } else {
      toast({
        title: "Sin coincidencias",
        description: "No se encontraron tarimas que coincidan con los datos pegados.",
        variant: "default",
      });
    }
  };

  const handleResetAndRefresh = () => {
    // 1. Resetear estados de la pestaña "Inventario de Tarimas"
    setSearchTerm("");
    setSelectedTarimas([]);
    setShowPreview(true); // O tu valor por defecto para la vista previa
  
    // 2. Resetear estados de la pestaña "Filtrar por Excel"
    setExcelPastedText("");
    setParsedExcelData([]);
    setShowExcelPreview(false);
    setApiExcelResults(null);
    setIsFetchingApiExcelResults(false); // Asegurar que se detiene cualquier carga
    setApiExcelError(null);
    
    // 3. Opcional: volver a la pestaña por defecto
    setActiveTab("tarimas"); 
  
    // 4. Mostrar un mensaje al usuario
    toast({
      title: "Proceso Reiniciado",
      description: "Se han limpiado los campos y filtros. Actualizando lista de tarimas...",
    });
  
    // 5. Actualizar la lista principal de tarimas
    // fetchTarimas ya maneja el estado de 'loading' por sí mismo.
    fetchTarimas(); 
  };

  // Si el usuario cambia de pestaña o el texto pegado, podemos resetear los resultados
  useEffect(() => {
    if (activeTab !== "excel") {
      setExcelPastedText("");
      setExcelFilteredResults(null);
      setExcelSearchAttempted(false);
    }
  }, [activeTab]);

  const isTarimaSelected = (prodEtiquetaRFIDId: number) => {
    return selectedTarimas.some((tarima) => tarima.prodEtiquetaRFIDId === prodEtiquetaRFIDId)
  }

  const filteredTarimas = tarimas.filter((tarima) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      tarima.nombreProducto.toLowerCase().includes(searchLower) ||
      tarima.lote.toLowerCase().includes(searchLower) ||
      tarima.itemNumber.toLowerCase().includes(searchLower) ||
      tarima.claveProducto.toLowerCase().includes(searchLower)
    )
  })

  const totalCajas = selectedTarimas.reduce((sum, tarima) => sum + tarima.cajas, 0)
  const totalPesoBruto = selectedTarimas.reduce((sum, tarima) => sum + tarima.pesoBruto, 0)
  const totalPesoNeto = selectedTarimas.reduce((sum, tarima) => sum + tarima.pesoNeto, 0)
  const totalCantidad = selectedTarimas.reduce((sum, tarima) => sum + tarima.cantidad, 0)

  // Determinar la unidad de medida predominante
  const unidadesMedida = selectedTarimas.map((tarima) => tarima.unidad)
  const unidadPredominante =
    unidadesMedida.length > 0
      ? unidadesMedida
          .sort((a, b) => unidadesMedida.filter((v) => v === a).length - unidadesMedida.filter((v) => v === b).length)
          .pop() || ""
      : ""

  // Formatear la cantidad total con la unidad de medida
  const formatearCantidadTotal = () => {
    if (!selectedTarimas.length) return "0"

    if (unidadPredominante === "MIL") {
      return `${totalCantidad.toLocaleString()} Millares`
    } else {
      return `${totalCantidad.toLocaleString()} ${unidadPredominante}`
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-medium">Cargando inventario de tarimas...</h2>
        <p className="text-muted-foreground">Por favor espere un momento</p>
      </div>
    )
  }

  // page.tsx
// Asegúrate de tener todos los imports necesarios, incluyendo Textarea si no lo tenías:
// import { Textarea } from "@/components/ui/textarea";
// ... (el resto de tus imports, estados incluyendo los nuevos para la pestaña Excel, y funciones)

// --- INICIO DEL RETURN DEL COMPONENTE Home ---
return (
  <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
    <Toaster />
    <header className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto py-4 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Sistema de Gestión de Tarimas</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {tarimas.length} tarimas disponibles
            </Badge>
            <Button 
  size="sm" 
  variant="outline" 
  onClick={handleResetAndRefresh} // <--- CAMBIO AQUÍ
  disabled={loading} // 'loading' se refiere al estado de carga de fetchTarimas
>
  {loading ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <RefreshCw className="h-4 w-4 mr-2" />
  )}
  Reiniciar y Actualizar {/* <--- TEXTO SUGERIDO */}
</Button>
          </div>
        </div>
      </div>
    </header>

    {/* Pestañas */}
    <div className="container mx-auto">
      <div className="flex border-b dark:border-slate-700 mb-6 px-4 mt-4">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("tarimas")}
          className={`py-3 px-4 rounded-none font-medium 
                        ${activeTab === "tarimas" 
                          ? "border-b-2 border-primary text-primary" 
                          : "text-muted-foreground hover:text-primary"}`}
        >
          <Package className="h-4 w-4 mr-2" />
          Inventario de Tarimas
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("excel")}
          className={`py-3 px-4 rounded-none font-medium 
                        ${activeTab === "excel" 
                          ? "border-b-2 border-primary text-primary" 
                          : "text-muted-foreground hover:text-primary"}`}
        >
          <Search className="h-4 w-4 mr-2" /> {/* Cambiado icono para más sentido */}
          Filtrar por Excel
        </Button>
      </div>
    </div>

    <main className="container mx-auto py-6 px-4">
      {/* ====================================================================== */}
      {/* =================== CONTENIDO DE LA PESTAÑA "TARIMAS" ================ */}
      {/* ====================================================================== */}
      {activeTab === "tarimas" && (
        <div className="grid grid-cols-1 gap-6">
          {/* Sección de búsqueda y filtros (para la pestaña "tarimas") */}
          <Card className="shadow-md dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:max-w-md"> {/* Ajustado ancho */}
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por producto, lote, item, clave..."
                    className="pl-10" // Ajustado padding para el icono
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap"> {/* flex-wrap para móviles */}
                  {selectedTarimas.length > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowProcessModal(true)}
                      className="w-full sm:w-auto"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Procesar ({selectedTarimas.length})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full sm:w-auto"
                    disabled={selectedTarimas.length === 0}
                  >
                    {showPreview ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Ocultar Selección
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Mostrar Selección
                      </>
                    )}
                  </Button>
                  {selectedTarimas.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearSelection} className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 w-full sm:w-auto">
                      <X className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vista previa de selección (si hay tarimas seleccionadas y showPreview es true) */}
          {selectedTarimas.length > 0 && showPreview && (
            <Card className="border-primary/30 bg-primary/5 dark:bg-primary/10 dark:border-primary/40 shadow-md">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-lg flex items-center">
                  <Package className="h-5 w-5 mr-2 text-primary" />
                  Tarimas Seleccionadas ({selectedTarimas.length})
                </CardTitle>
                <CardDescription>Resumen de las tarimas seleccionadas para procesamiento.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Contenido de resumen (Total Cajas, Cantidad, Peso) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  {/* Card Total Cajas */}
                  <Card className="dark:bg-slate-700/50 dark:border-slate-600">
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Cajas</p>
                          <p className="text-2xl font-bold">{totalCajas}</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-full">
                          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Card Cantidad Total */}
                  <Card className="dark:bg-slate-700/50 dark:border-slate-600">
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Cantidad Total</p>
                          <p className="text-2xl font-bold" style={{ wordBreak: "break-word" }}>
                            {formatearCantidadTotal()}
                          </p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-500/20 p-2.5 rounded-full">
                          <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Card Peso Bruto */}
                  <Card className="dark:bg-slate-700/50 dark:border-slate-600">
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Peso Bruto</p>
                          <p className="text-2xl font-bold">{totalPesoBruto.toLocaleString()} kg</p>
                        </div>
                        <div className="bg-yellow-100 dark:bg-yellow-500/20 p-2.5 rounded-full">
                          <Truck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /> {/* Asumiendo que pesa bruto */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Card Peso Neto */}
                  <Card className="dark:bg-slate-700/50 dark:border-slate-600">
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Peso Neto</p>
                          <p className="text-2xl font-bold">{totalPesoNeto.toLocaleString()} kg</p>
                        </div>
                        <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2.5 rounded-full">
                          <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> {/* Icono ejemplo */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* ScrollArea con detalle de tarimas seleccionadas */}
                <ScrollArea className="h-[200px] rounded-md border dark:border-slate-600 p-1">
                  <div className="p-3">
                    <h3 className="font-medium mb-2 text-md">Detalle de la Selección:</h3>
                    {selectedTarimas.map((tarima, index) => (
                      <div key={tarima.prodEtiquetaRFIDId}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5">
                          <div className="flex-1 min-w-0"> {/* min-w-0 para elipsis */}
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate" title={tarima.nombreProducto}>{tarima.nombreProducto}</p>
                              <Badge
                                variant={tarima.asignadoAentrega ? "default" : "destructive"}
                                className={`whitespace-nowrap text-xs h-fit py-0.5 px-1.5
                                            ${tarima.asignadoAentrega ? "bg-green-500 border-green-500 text-white" : ""}`}
                              >
                                {tarima.asignadoAentrega ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                {tarima.asignadoAentrega ? "Asignado" : "No asignado"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              <span>Lote: <span className="font-semibold">{tarima.lote}</span></span>
                              <span>Item: <span className="font-semibold">{tarima.itemNumber}</span></span>
                              <span>Cajas: <span className="font-semibold">{tarima.cajas}</span></span>
                              <span>RFID: <span className="font-semibold">{tarima.prodEtiquetaRFIDId}</span></span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 sm:mt-0 text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-500/10 px-2 py-1 self-start sm:self-center"
                            onClick={() => handleSelectTarima(tarima)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Quitar
                          </Button>
                        </div>
                        {index < selectedTarimas.length - 1 && <Separator className="dark:bg-slate-700" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Tabla principal de tarimas */}
          <Card className="shadow-md dark:bg-slate-800 dark:border-slate-700">
  <CardHeader className="pb-2 pt-4">
    <CardTitle className="text-lg">Inventario General de Tarimas</CardTitle>
    <CardDescription>
      {filteredTarimas.length} de {tarimas.length} tarimas encontradas.
      {searchTerm && ` (Filtrando por: "${searchTerm}")`}
    </CardDescription>
  </CardHeader>
  <CardContent className="pt-4">
    <div className="rounded-md border dark:border-slate-700 overflow-hidden">
      {/* Scroll horizontal y vertical combinados */}
      <div className="max-h-[600px] lg:max-h-[700px] overflow-auto">
        <div className="min-w-[1200px]"> {/* Fuerza ancho mínimo para habilitar scroll horizontal */}
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-700/50 z-[1]">
              <TableRow>
                <TableHead className="w-12 text-center" />
                <TableHead>Producto (Clave)</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Item Num.</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Cajas</TableHead>
                <TableHead className="text-right">Peso Neto</TableHead>
                <TableHead className="text-right">Peso Bruto</TableHead>
                <TableHead>Almacén</TableHead>
                <TableHead>PO</TableHead>
                <TableHead className="text-right">RFID ID</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && tarimas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                    Cargando inventario...
                  </TableCell>
                </TableRow>
              ) : filteredTarimas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center text-muted-foreground">
                    No se encontraron tarimas que coincidan con la búsqueda
                    {searchTerm && ` "${searchTerm}"`}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTarimas.map((tarima) => (
                  <TableRow
                    key={tarima.prodEtiquetaRFIDId}
                    className={`transition-colors ${isTarimaSelected(tarima.prodEtiquetaRFIDId) ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-700/40"}`}
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isTarimaSelected(tarima.prodEtiquetaRFIDId)}
                        onCheckedChange={() => handleSelectTarima(tarima)}
                        aria-label={`Seleccionar tarima ${tarima.nombreProducto}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="max-w-xs truncate" title={tarima.nombreProducto}>
                        {tarima.nombreProducto}
                      </div>
                      <div className="text-xs text-muted-foreground">{tarima.claveProducto}</div>
                    </TableCell>
                    <TableCell>{tarima.lote}</TableCell>
                    <TableCell>{tarima.itemNumber}</TableCell>
                    <TableCell className="text-right">{tarima.cantidad.toLocaleString()}</TableCell>
                    <TableCell>{tarima.unidad}</TableCell>
                    <TableCell className="text-right">{tarima.cajas}</TableCell>
                    <TableCell className="text-right">{tarima.pesoNeto.toLocaleString()} kg</TableCell>
                    <TableCell className="text-right">{tarima.pesoBruto.toLocaleString()} kg</TableCell>
                    <TableCell>{tarima.almacen}</TableCell>
                    <TableCell>{tarima.po}</TableCell>
                    <TableCell className="text-right">{tarima.prodEtiquetaRFIDId}</TableCell>
                    <TableCell>
                      <Badge
                        variant={tarima.asignadoAentrega ? "default" : "outline"}
                        className={`whitespace-nowrap text-xs h-fit py-0.5 px-1.5
                          ${tarima.asignadoAentrega
                            ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                            : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"}`}
                      >
                        {tarima.asignadoAentrega ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {tarima.asignadoAentrega ? "Asignado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

        </div>
      )} {/* Fin de activeTab === "tarimas" */}

      {/* ====================================================================== */}
      {/* ================= CONTENIDO DE LA PESTAÑA "FILTRAR POR EXCEL" ======== */}
      {/* ====================================================================== */}
      {activeTab === "excel" && (
        <div className="space-y-8"> {/* Contenedor principal para la pestaña con un poco más de espaciado */}
          
          {/* Card para Entrada de Datos desde Excel */}
          <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl">Entrada de Datos desde Excel</CardTitle>
              <CardDescription>
                Pega aquí los datos de tu hoja de cálculo (dos columnas: PO y Customer Item/ItemNumber). Cada par debe estar en una nueva línea.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <label htmlFor="excelPasteArea" className="block text-sm font-medium mb-1">
                  Pega aquí los datos (PO seguido de ItemNumber por línea):
                </label>
                <Textarea
                  id="excelPasteArea"
                  placeholder="Ejemplo:
12793 002-00-55115-04
12813 1318
12833 CF-004
..."
                  value={excelPastedText}
                  onChange={(e) => {
                    setExcelPastedText(e.target.value);
                    setShowExcelPreview(false); 
                    setApiExcelResults(null);
                    setApiExcelError(null);
                  }}
                  rows={10}
                  className="shadow-sm focus:ring-primary focus:border-primary dark:bg-slate-700 dark:border-slate-600 dark:focus:border-primary"
                />
              </div>
              <Button onClick={handleVerifyPastedData} className="w-full sm:w-auto" disabled={!excelPastedText.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificar Datos Pegados
              </Button>
            </CardContent>
          </Card>

          {/* Vista Previa de Datos Parseados */}
          {showExcelPreview && parsedExcelData.length > 0 && (
            <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Vista Previa de Datos para Búsqueda</CardTitle>
                <CardDescription>
                  Verifica que los siguientes {parsedExcelData.length} pares PO/ItemNumber se hayan interpretado correctamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ScrollArea className="max-h-[300px] border dark:border-slate-600 rounded-md">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-100 dark:bg-slate-700">
                      <TableRow>
                        <TableHead className="w-[150px] px-3">PO #</TableHead>
                        <TableHead className="px-3">Customer Item / ItemNumber</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedExcelData.map((item, index) => (
                        <TableRow key={index} className="dark:hover:bg-slate-700/50">
                          <TableCell className="font-medium px-3">{item.PO}</TableCell>
                          <TableCell className="px-3">{item.ItemNumber}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <Button onClick={fetchFilteredStockFromApi} className="w-full sm:w-auto mt-4" disabled={isFetchingApiExcelResults || parsedExcelData.length === 0}>
                  {isFetchingApiExcelResults && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Buscar Productos en Inventario
                </Button>
              </CardContent>
            </Card>
          )}
          {showExcelPreview && parsedExcelData.length === 0 && excelPastedText.trim() !== "" && (
             <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="pt-6 text-center text-muted-foreground">
                    <p>No se pudieron parsear datos válidos del texto pegado. Por favor, revisa el formato.</p>
                </CardContent>
             </Card>
          )}

          {/* Estado de Carga para Resultados de la Búsqueda en API */}
          {isFetchingApiExcelResults && (
            <div className="flex flex-col items-center justify-center h-40 p-6 border rounded-lg bg-slate-50 dark:bg-slate-800/30">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg font-semibold">Buscando tarimas en el inventario...</p>
              <p className="text-sm text-muted-foreground">Esto puede tardar un momento.</p>
            </div>
          )}

          {/* Mensaje de Error de la Búsqueda en API */}
          {apiExcelError && !isFetchingApiExcelResults && ( // Solo mostrar si no está cargando
            <Card className="shadow-lg bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400 text-lg flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" /> Error en la Búsqueda
                </CardTitle>
              </CardHeader>
              <CardContent className="text-red-600 dark:text-red-300">
                <p>Ocurrió un problema al intentar obtener los datos:</p>
                <pre className="mt-2 p-2 bg-red-100 dark:bg-red-800/40 rounded text-xs whitespace-pre-wrap break-all">
                  {apiExcelError}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Resultados de la Búsqueda en API (cuando hay resultados y no hay error) */}
          {apiExcelResults && !isFetchingApiExcelResults && !apiExcelError && (
            <div className="space-y-4 pt-2">
              <Separator className="dark:bg-slate-700"/>
              <h2 className="text-xl font-semibold">Resultados de la Búsqueda en Inventario</h2>
              {apiExcelResults.length === 0 && (
                <p className="text-muted-foreground py-4 text-center">
                    No se encontraron tarimas que coincidan con los criterios de PO e ItemNumber proporcionados.
                </p>
              )}
              {apiExcelResults.map((resultItem, index) => (
                <FilteredResultItemDisplay
                  key={`${resultItem.filtroSolicitado.po}-${resultItem.filtroSolicitado.itemNumber}-${index}`}
                  filterResult={resultItem}
                  selectedTarimas={selectedTarimas}
                  onSelectTarima={handleSelectTarima} // Tu función global para seleccionar
                />
              ))}
            </div>
          )}

          {/* ===================================================================== */}
          {/* == RESUMEN DE TARIMAS SELECCIONADAS (GLOBAL) EN LA PESTAÑA DE EXCEL == */}
          {/* ===================================================================== */}
          {selectedTarimas.length > 0 && showPreview && (
            <div className="mt-10 pt-8 border-t-2 border-dashed dark:border-slate-700"> {/* Separador visual más prominente */}
              
              {/* Aquí usamos el componente SeleccionResumen que creaste (o donde pegarías el código del resumen) */}
              <SeleccionResumen
                selectedTarimas={selectedTarimas}
                onQuitarTarima={handleSelectTarima} 
                totalCajas={totalCajas} 
                cantidadTotalFormateada={formatearCantidadTotal()} 
                totalPesoBruto={totalPesoBruto}
                totalPesoNeto={totalPesoNeto}
              />

              {/* Botones de acción para la selección global, relevantes en esta pestaña */}
              <div className="mt-6 flex items-center gap-3 flex-wrap justify-center sm:justify-start"> {/* Centrado en móvil, inicio en sm */}
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setShowProcessModal(true)}
                  disabled={selectedTarimas.length === 0}
                  className="flex-grow xs:flex-grow-0 min-w-[180px]" // Ancho mínimo y responsive
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Procesar Selección ({selectedTarimas.length})
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => setShowPreview(!showPreview)} 
                  disabled={selectedTarimas.length === 0}
                  className="flex-grow xs:flex-grow-0 min-w-[180px]"
                >
                  {showPreview ? ( // El estado showPreview es global
                    <ChevronUp className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  {showPreview ? "Ocultar" : "Mostrar"} Resumen
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSelection} 
                  className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 flex-grow xs:flex-grow-0 min-w-[180px]"
                  disabled={selectedTarimas.length === 0}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar Selección
                </Button>
              </div>
            </div>
          )}
          {/* Fin del resumen de selección global */}

        </div> // Fin del div principal de la pestaña de Exce
      )}
    </main>

    {/* Modal de confirmación para procesar tarimas (sigue igual) */}
    <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
      <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle>Procesar Tarimas Seleccionadas</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas procesar las {selectedTarimas.length} tarima(s) seleccionada(s)? Esta acción las marcará como asignadas a entrega.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[300px] mt-4 mb-6 border dark:border-slate-700 rounded-md p-1">
          <div className="space-y-2 p-3">
            {selectedTarimas.map((tarima) => (
              <Card key={tarima.prodEtiquetaRFIDId} className="p-3 dark:bg-slate-700/50 dark:border-slate-600">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0"> {/* Para elipsis */}
                    <p className="font-medium text-sm truncate" title={tarima.nombreProducto}>{tarima.nombreProducto}</p>
                    <div className="text-xs text-muted-foreground">
                      Lote: {tarima.lote} | RFID: {tarima.prodEtiquetaRFIDId}
                    </div>
                  </div>
                  <Badge
                      variant={tarima.asignadoAentrega ? "default" : "outline"}
                      className={`whitespace-nowrap text-xs h-fit py-0.5 px-1.5
                                  ${tarima.asignadoAentrega 
                                    ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30" 
                                    : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"}`}
                    >
                      {tarima.asignadoAentrega ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {tarima.asignadoAentrega ? "Asignado" : "Pendiente"}
                    </Badge>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
          <Button variant="outline" onClick={() => setShowProcessModal(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={processTarimas} 
            disabled={processingLoading || selectedTarimas.length === 0}
          >
            {processingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar y Procesar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);
}
// --- FIN DEL RETURN DEL COMPONENTE Home ---