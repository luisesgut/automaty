// hooks/useTarimas.ts
import { useState, useEffect } from 'react';
import { Tarima } from '@/types';

const toNullableString = (value: unknown): string | null => {
    if (value === null || value === undefined) {
        return null;
    }

    const stringValue = String(value).trim();
    return stringValue ? stringValue : null;
};

const toNullableNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
};

const toNullableBoolean = (value: unknown): boolean | null => {
    if (typeof value === 'boolean') {
        return value;
    }

    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'number') {
        return value === 1 ? true : value === 0 ? false : null;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
            return true;
        }
        if (normalized === 'false' || normalized === '0') {
            return false;
        }
    }

    return null;
};

const normalizeTarima = (raw: Record<string, unknown>): Tarima | null => {
    const prodEtiquetaRFIDId = toNullableNumber(raw.prodEtiquetaRFIDId);

    if (prodEtiquetaRFIDId === null) {
        return null;
    }

    return {
        claveProducto: toNullableString(raw.claveProducto),
        lote: toNullableString(raw.lote),
        nombreProducto: toNullableString(raw.nombreProducto),
        unidad: toNullableString(raw.unidad),
        almacen: toNullableString(raw.almacen),
        cantidad: toNullableNumber(raw.cantidad),
        po: toNullableString(raw.po),
        pesoBruto: toNullableNumber(raw.pesoBruto),
        pesoNeto: toNullableNumber(raw.pesoNeto),
        cajas: toNullableNumber(raw.cajas),
        ordenSAP: toNullableString(raw.ordenSAP),
        prodEtiquetaRFIDId,
        itemNumber: toNullableString(raw.itemNumber),
        individualUnits: toNullableNumber(raw.individualUnits),
        totalUnits: toNullableNumber(raw.totalUnits),
        uom: toNullableString(raw.uom),
        asignadoAentrega: toNullableBoolean(raw.asignadoAentrega),
    };
};

export const useTarimas = () => {
    const [tarimas, setTarimas] = useState<Tarima[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTarimas = async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("http://172.16.10.31/api/vwStockDestiny", {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
                signal,
            });

            if (!response.ok) {
                throw new Error(`Error al obtener datos: ${response.status}`);
            }

            const data = await response.json();

            if (signal?.aborted) {
                return;
            }

            const normalizedTarimas = Array.isArray(data)
                ? (data as Record<string, unknown>[]) 
                    .map(normalizeTarima)
                    .filter((item): item is Tarima => item !== null)
                : [];

            setTarimas(normalizedTarimas);

        } catch (err) {
            if ((err as Error)?.name === 'AbortError') {
                return;
            }

            console.error("Error fetching data:", err);

            if (err instanceof TypeError && err.message.includes("CORS")) {
                setError(
                    "Error de CORS: No se puede acceder al servidor. Contacte al administrador para habilitar CORS en el servidor."
                );
            } else {
                setError(err instanceof Error ? err.message : "Error desconocido al cargar datos");
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const updateTarimasStatus = (tarimasAProcesar: Tarima[]) => {
        setTarimas(prevTarimas =>
            prevTarimas.map(t =>
                tarimasAProcesar.some(procesada => procesada.prodEtiquetaRFIDId === t.prodEtiquetaRFIDId)
                    ? { ...t, asignadoAentrega: true }
                    : t
            )
        );
    };

    useEffect(() => {
        const controller = new AbortController();

        fetchTarimas(controller.signal);

        return () => {
            controller.abort();
        };
    }, []);

    return {
        tarimas,
        loading,
        error,
        fetchTarimas,
        updateTarimasStatus,
    };
};

// hooks/useSelection.ts
