// hooks/useExcelData.ts
import { useState, useEffect } from 'react';
import { ParsedExcelItem, ApiFilterResponseItem, ExcelState } from '@/types';
import { toast } from '@/components/ui/use-toast';

export const useExcelData = () => {
    const [state, setState] = useState<ExcelState>({
        pastedText: "",
        parsedData: [],
        showPreview: false,
        apiResults: null,
        isFetching: false,
        error: null,
        searchAttempted: false,
    });

    // Función para parsear los datos pegados
    const parsePastedData = (text: string): ParsedExcelItem[] => {
        if (!text.trim()) return [];

        const lines = text.trim().split('\n');
        const parsed: ParsedExcelItem[] = [];

        lines.forEach(line => {
            const parts = line.split(/\s+/); // Divide por uno o más espacios/tabs
            if (parts.length >= 2) {
                const po = parts[0].trim();
                // ItemNumber puede contener espacios si hay más de 2 partes
                const itemNumber = parts.slice(1).join(' ').trim();
                if (po && itemNumber) {
                    parsed.push({ PO: po, ItemNumber: itemNumber });
                }
            }
        });
        return parsed;
    };

    // Función para verificar los datos pegados
    const handleVerifyPastedData = () => {
        const parsed = parsePastedData(state.pastedText);

        setState(prev => ({
            ...prev,
            parsedData: parsed,
            showPreview: true,
            apiResults: null,
            error: null,
        }));

        if (parsed.length === 0 && state.pastedText.trim() !== "") {
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

    // Función para buscar en la API
    const fetchFilteredStockFromApi = async () => {
        if (state.parsedData.length === 0) {
            toast({
                title: "No hay datos para buscar",
                description: "Verifica los datos pegados primero.",
                variant: "default",
            });
            return;
        }

        setState(prev => ({ ...prev, isFetching: true, error: null, apiResults: null }));

        try {
            const filtersParam = encodeURIComponent(JSON.stringify(state.parsedData));
            const url = `http://172.16.10.31/api/vwStockDestiny/FilteredStockDestinyGrouped?filters=${filtersParam}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("API Error Response:", errorData);
                throw new Error(`Error al buscar en API: ${response.status} - ${response.statusText}. Detalles: ${errorData.substring(0,100)}`);
            }

            const data: ApiFilterResponseItem[] = await response.json();

            setState(prev => ({
                ...prev,
                apiResults: data,
                searchAttempted: true,
            }));

            const totalItemsFound = data.reduce((sum, item) => sum + item.totalEncontrados, 0);

            if (totalItemsFound > 0) {
                toast({
                    title: "Búsqueda completada",
                    description: `Se procesaron ${data.length} filtros. Total de tarimas encontradas: ${totalItemsFound}.`,
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

            setState(prev => ({ ...prev, error: errorMessage }));

            toast({
                title: "Error en la Búsqueda",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setState(prev => ({ ...prev, isFetching: false }));
        }
    };

    // Función para reiniciar el estado
    const resetExcelData = () => {
        setState({
            pastedText: "",
            parsedData: [],
            showPreview: false,
            apiResults: null,
            isFetching: false,
            error: null,
            searchAttempted: false,
        });
    };

    // Función para actualizar el texto pegado
    const updatePastedText = (text: string) => {
        setState(prev => ({
            ...prev,
            pastedText: text,
            showPreview: false,
            apiResults: null,
            error: null,
            searchAttempted: false,
        }));
    };

    // Limpiar datos cuando el texto está vacío
    useEffect(() => {
        if (state.pastedText.trim() === "") {
            setState(prev => ({
                ...prev,
                parsedData: [],
                showPreview: false,
                apiResults: null,
                error: null,
            }));
        }
    }, [state.pastedText]);

    return {
        ...state,
        handleVerifyPastedData,
        fetchFilteredStockFromApi,
        resetExcelData,
        updatePastedText,
    };
};