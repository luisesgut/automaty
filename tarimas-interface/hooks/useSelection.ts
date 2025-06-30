import { useState } from 'react';
import { Tarima, TarimasStats } from '@/types';
import { toast } from '@/components/ui/use-toast';

const PESO_MAXIMO_TONELADAS = 20;
const PESO_MAXIMO_KG = PESO_MAXIMO_TONELADAS * 1000; // 20,000 kg

export const useSelection = () => {
    const [selectedTarimas, setSelectedTarimas] = useState<Tarima[]>([]);

    const handleSelectTarima = (tarima: Tarima) => {
        setSelectedTarimas((prev) => {
            const isSelected = prev.some((item) => item.prodEtiquetaRFIDId === tarima.prodEtiquetaRFIDId);

            if (isSelected) {
                // Si está seleccionada, la removemos (siempre permitido)
                return prev.filter((item) => item.prodEtiquetaRFIDId !== tarima.prodEtiquetaRFIDId);
            } else {
                // Si no está seleccionada, verificamos el peso antes de agregar
                const pesoActual = prev.reduce((sum, item) => sum + item.pesoBruto, 0);
                const nuevoPeso = pesoActual + tarima.pesoBruto;

                if (nuevoPeso > PESO_MAXIMO_KG) {
                    // Calcular cuánto peso falta para llegar al límite
                    const pesoDisponible = PESO_MAXIMO_KG - pesoActual;
                    const pesoExcedente = nuevoPeso - PESO_MAXIMO_KG;

                    toast({
                        title: "⚠️ Límite de Peso Excedido",
                        description: `No se puede agregar esta tarima. Peso actual: ${(pesoActual / 1000).toFixed(1)}T. La tarima pesa ${(tarima.pesoBruto / 1000).toFixed(1)}T y excedería el límite de ${PESO_MAXIMO_TONELADAS}T por ${(pesoExcedente / 1000).toFixed(1)}T.`,
                        variant: "destructive",
                    });

                    return prev; // No agregar la tarima
                }

                // Mostrar advertencia cuando se acerque al límite (90% o más)
                const porcentajePeso = (nuevoPeso / PESO_MAXIMO_KG) * 100;
                if (porcentajePeso >= 90) {
                    const pesoRestante = PESO_MAXIMO_KG - nuevoPeso;
                    toast({
                        title: "🚨 Acercándose al Límite",
                        description: `Peso actual: ${(nuevoPeso / 1000).toFixed(1)}T de ${PESO_MAXIMO_TONELADAS}T (${porcentajePeso.toFixed(1)}%). Capacidad restante: ${(pesoRestante / 1000).toFixed(1)}T.`,
                        variant: "default",
                    });
                }

                // Agregar la tarima
                return [...prev, tarima];
            }
        });
    };

    const clearSelection = () => {
        setSelectedTarimas([]);
    };

    const updateSelectedTarimasStatus = (tarimasAProcesar: Tarima[]) => {
        setSelectedTarimas(prevSeleccionadas =>
            prevSeleccionadas.map(t =>
                tarimasAProcesar.some(procesada => procesada.prodEtiquetaRFIDId === t.prodEtiquetaRFIDId)
                    ? {...t, asignadoAentrega: true}
                    : t
            )
        );
    };

    const getStats = (): TarimasStats => {
        const totalCajas = selectedTarimas.reduce((sum, tarima) => sum + tarima.cajas, 0);
        const totalPesoBruto = selectedTarimas.reduce((sum, tarima) => sum + tarima.pesoBruto, 0);
        const totalPesoNeto = selectedTarimas.reduce((sum, tarima) => sum + tarima.pesoNeto, 0);
        const totalCantidad = selectedTarimas.reduce((sum, tarima) => sum + tarima.cantidad, 0);

        const unidadesMedida = selectedTarimas.map((tarima) => tarima.unidad);
        const unidadPredominante = unidadesMedida.length > 0
            ? unidadesMedida
            .sort((a, b) => unidadesMedida.filter((v) => v === a).length - unidadesMedida.filter((v) => v === b).length)
            .pop() || ""
            : "";

        const cantidadFormateada = !selectedTarimas.length ? "0" :
            unidadPredominante === "MIL"
                ? `${totalCantidad.toLocaleString()} Millares`
                : `${totalCantidad.toLocaleString()} ${unidadPredominante}`;

        return {
            totalCajas,
            totalPesoBruto,
            totalPesoNeto,
            totalCantidad,
            unidadPredominante,
            cantidadFormateada,
        };
    };

    // Función auxiliar para obtener información del peso
    const getWeightInfo = () => {
        const totalPesoBruto = selectedTarimas.reduce((sum, tarima) => sum + tarima.pesoBruto, 0);
        const porcentajeUsado = (totalPesoBruto / PESO_MAXIMO_KG) * 100;
        const pesoRestante = PESO_MAXIMO_KG - totalPesoBruto;

        return {
            totalPesoBruto,
            pesoMaximo: PESO_MAXIMO_KG,
            porcentajeUsado,
            pesoRestante,
            cercaDelLimite: porcentajeUsado >= 80,
            enLimite: porcentajeUsado >= 95
        };
    };

    return {
        selectedTarimas,
        handleSelectTarima,
        clearSelection,
        updateSelectedTarimasStatus,
        getStats,
        getWeightInfo,
        PESO_MAXIMO_TONELADAS,
        PESO_MAXIMO_KG,
    };
};