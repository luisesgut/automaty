import { useState } from 'react';
import { Tarima, TarimasStats } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { coerceBoolean } from '@/utils/formatters';

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
                // Agregar la tarima sin restricciones de peso
                const pesoActual = prev.reduce((sum, item) => sum + (item.pesoBruto ?? 0), 0);
                const nuevoPeso = pesoActual + (tarima.pesoBruto ?? 0);

                // Solo mostrar información cuando exceda el límite anterior (ya no como restricción)
                if (nuevoPeso > PESO_MAXIMO_KG && pesoActual <= PESO_MAXIMO_KG) {
                    // Solo mostrar la primera vez que se excede el límite informativo
                    toast({
                        title: "ℹ️ Información de Peso",
                        description: `Has superado las ${PESO_MAXIMO_TONELADAS}T de referencia. Peso actual: ${(nuevoPeso / 1000).toFixed(1)}T. El sistema permite continuar agregando tarimas.`,
                        variant: "default",
                    });
                }

                // Mostrar notificación informativa cada 5T adicionales después del límite
                const excesoAnterior = Math.floor((pesoActual - PESO_MAXIMO_KG) / 5000);
                const excesoNuevo = Math.floor((nuevoPeso - PESO_MAXIMO_KG) / 5000);
                
                if (nuevoPeso > PESO_MAXIMO_KG && excesoNuevo > excesoAnterior && excesoNuevo > 0) {
                    const excesoTotal = nuevoPeso - PESO_MAXIMO_KG;
                    toast({
                        title: `📊 Actualización de Peso`,
                        description: `Peso actual: ${(nuevoPeso / 1000).toFixed(1)}T (exceso de ${(excesoTotal / 1000).toFixed(1)}T sobre las ${PESO_MAXIMO_TONELADAS}T de referencia).`,
                        variant: "default",
                    });
                }

                // Agregar la tarima (sin restricciones)
                return [...prev, tarima];
            }
        });
    };

    const clearSelection = () => {
        setSelectedTarimas([]);
    };

    // NUEVA: Función para limpiar solo las tarimas procesadas (asignadas)
    const clearProcessedTarimas = () => {
        setSelectedTarimas(prev => {
            const tarimasAManetener = prev.filter(tarima => !coerceBoolean(tarima.asignadoAentrega));
            const tarimasEliminadas = prev.length - tarimasAManetener.length;
            
            if (tarimasEliminadas > 0) {
                toast({
                    title: "🧹 Selección Limpiada",
                    description: `Se eliminaron ${tarimasEliminadas} tarima(s) procesada(s) de la selección.`,
                    variant: "default",
                });
            }
            
            return tarimasAManetener;
        });
    };

    // NUEVA: Función para remover una tarima específica
    const removeTarima = (tarimaToRemove: Tarima) => {
        setSelectedTarimas(prev => 
            prev.filter(tarima => tarima.prodEtiquetaRFIDId !== tarimaToRemove.prodEtiquetaRFIDId)
        );
    };

    const updateSelectedTarimasStatus = (tarimasAProcesar: Tarima[]) => {
        setSelectedTarimas(prevSeleccionadas =>
            prevSeleccionadas.map(t =>
                tarimasAProcesar.some(procesada => procesada.prodEtiquetaRFIDId === t.prodEtiquetaRFIDId)
                    ? { ...t, asignadoAentrega: true }
                    : t
            )
        );
    };

    const getStats = (): TarimasStats => {
        const totalCajas = selectedTarimas.reduce((sum, tarima) => sum + (tarima.cajas ?? 0), 0);
        const totalPesoBruto = selectedTarimas.reduce((sum, tarima) => sum + (tarima.pesoBruto ?? 0), 0);
        const totalPesoNeto = selectedTarimas.reduce((sum, tarima) => sum + (tarima.pesoNeto ?? 0), 0);
        const totalCantidad = selectedTarimas.reduce((sum, tarima) => sum + (tarima.cantidad ?? 0), 0);

        const unidadesMedida = selectedTarimas
            .map((tarima) => tarima.unidad)
            .filter((value): value is string => Boolean(value));
        const unidadPredominante = unidadesMedida.length > 0
            ? unidadesMedida
            .sort((a, b) => unidadesMedida.filter((v) => v === a).length - unidadesMedida.filter((v) => v === b).length)
            .pop() || ""
            : "";

        const cantidadFormateada = !selectedTarimas.length ? "0" :
            unidadPredominante === "MIL"
                ? `${totalCantidad.toLocaleString()} Millares`
                : `${totalCantidad.toLocaleString()} ${unidadPredominante}`;

        // NUEVO: Separar por estado para las estadísticas
        const tarimasPendientes = selectedTarimas.filter(t => !coerceBoolean(t.asignadoAentrega));
        const tarimasAsignadas = selectedTarimas.filter(t => coerceBoolean(t.asignadoAentrega));

        return {
            totalCajas,
            totalPesoBruto,
            totalPesoNeto,
            totalCantidad,
            unidadPredominante,
            cantidadFormateada,
            // NUEVOS: Estadísticas por estado
            totalTarimas: selectedTarimas.length,
            productosUnicos: new Set(selectedTarimas.map(t => `${t.po ?? ""}-${t.itemNumber ?? ""}`)).size,
            totalUnidades: selectedTarimas.reduce((sum, t) => sum + (t.totalUnits ?? 0), 0),
            tarimasPendientes: tarimasPendientes.length,
            tarimasAsignadas: tarimasAsignadas.length,
        };
    };

    // Función auxiliar para obtener información del peso (ahora solo informativo)
    const getWeightInfo = () => {
        const totalPesoBruto = selectedTarimas.reduce((sum, tarima) => sum + (tarima.pesoBruto ?? 0), 0);
        const porcentajeUsado = (totalPesoBruto / PESO_MAXIMO_KG) * 100;
        const pesoRestante = PESO_MAXIMO_KG - totalPesoBruto;

        return {
            totalPesoBruto,
            pesoMaximo: PESO_MAXIMO_KG,
            porcentajeUsado,
            pesoRestante,
            // Estos campos ahora son solo informativos, no restrictivos
            cercaDelLimite: porcentajeUsado >= 80,
            enLimite: porcentajeUsado >= 95,
            excedeReferencia: totalPesoBruto > PESO_MAXIMO_KG, // Nuevo campo para indicar si excede
            excesoReferencia: totalPesoBruto > PESO_MAXIMO_KG ? totalPesoBruto - PESO_MAXIMO_KG : 0 // Cuánto excede
        };
    };

    return {
        selectedTarimas,
        handleSelectTarima,
        clearSelection,
        clearProcessedTarimas,    // NUEVA FUNCIÓN
        removeTarima,             // NUEVA FUNCIÓN
        updateSelectedTarimasStatus,
        getStats,
        getWeightInfo,
        PESO_MAXIMO_TONELADAS,
        PESO_MAXIMO_KG,
    };
};
