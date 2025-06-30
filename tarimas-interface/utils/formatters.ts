// utils/formatters.ts

/**
 * Formatea números grandes con separadores de miles
 */
export const formatNumber = (num: number): string => {
    return num.toLocaleString('es-MX');
};

/**
 * Formatea pesos con unidad kg
 */
export const formatWeight = (weight: number): string => {
    return `${formatNumber(weight)} kg`;
};

/**
 * Formatea cantidades con su unidad correspondiente
 */
export const formatQuantity = (quantity: number, unit: string): string => {
    if (unit === "MIL") {
        return `${formatNumber(quantity)} Millares`;
    }
    return `${formatNumber(quantity)} ${unit}`;
};

/**
 * Trunca texto largo y añade elipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Formatea fechas para mostrar
 */
export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Formatea fechas y horas para mostrar
 */
export const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Determina la clase CSS para el estado de asignación
 */
export const getStatusBadgeClass = (isAssigned: boolean, variant: 'default' | 'outline' = 'default') => {
    const baseClasses = "whitespace-nowrap text-xs h-fit py-1.5 px-3 transition-all duration-200";

    if (isAssigned) {
        return `${baseClasses} bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 shadow-sm`;
    } else {
        return `${baseClasses} bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30`;
    }
};

/**
 * Genera un nombre de archivo único para las descargas
 */
export const generateFileName = (prefix: string, extension: string = 'xlsx'): string => {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${prefix}_${date}_${time}.${extension}`;
};