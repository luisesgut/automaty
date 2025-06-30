// hooks/useTarimas.ts
import { useState, useEffect } from 'react';
import { Tarima } from '@/types';
import { toast } from '@/components/ui/use-toast';

export const useTarimas = () => {
    const [tarimas, setTarimas] = useState<Tarima[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTarimas = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("http://172.16.10.31/api/vwStockDestiny", {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Error al obtener datos: ${response.status}`);
            }

            const data = await response.json();
            setTarimas(data);

        } catch (err) {
            console.error("Error fetching data:", err);

            if (err instanceof TypeError && err.message.includes("CORS")) {
                setError(
                    "Error de CORS: No se puede acceder al servidor. Contacte al administrador para habilitar CORS en el servidor."
                );
            } else {
                setError(err instanceof Error ? err.message : "Error desconocido al cargar datos");
            }
        } finally {
            setLoading(false);
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
        fetchTarimas();
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
