// hooks/useTarimas.ts
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Tarima, TarimasDataSource, TarimasExcelImportReport } from '@/types';

const EXCEL_REQUIRED_HEADERS = [
    'Fecha',
    'PT',
    'Descripción',
    'Stock',
    'Unidad',
    'Peso bruto',
    'Peso neto',
    'Trazabilidad',
    'Orden BFX',
    'Lote cliente',
    'Piezas',
    'Pallet',
] as const;

const EXCEL_REQUIRED_ROW_FIELDS = ['PT', 'Trazabilidad', 'Lote cliente', 'Pallet'] as const;

const HEADER_ALIASES: Record<string, string[]> = {
    fecha: ['fecha'],
    pt: ['pt'],
    descripcion: ['descripcion', 'descripción'],
    stock: ['stock'],
    unidad: ['unidad'],
    pesoBruto: ['peso bruto', 'pesobruto', 'peso_bruto'],
    pesoNeto: ['peso neto', 'pesoneto', 'peso_neto'],
    trazabilidad: ['trazabilidad'],
    ordenBfx: ['orden bfx', 'ordenbfx'],
    loteCliente: ['lote cliente', 'lotecliente'],
    piezas: ['piezas'],
    pallet: ['pallet', 'palet'],
};

const normalizeHeaderKey = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
};

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
        const normalized = value.replace(/,/g, '').trim();

        if (!normalized) {
            return null;
        }

        const parsed = Number(normalized);
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
        trazabilidad: toNullableString(raw.trazabilidad),
        loteCliente: toNullableString(raw.loteCliente),
    };
};

const createHeaderMap = (headers: string[]) => {
    const map = new Map<string, string>();

    headers.forEach((header) => {
        const normalized = normalizeHeaderKey(header);

        if (normalized) {
            map.set(normalized, header);
        }
    });

    return map;
};

const getCellValue = (
    row: Record<string, unknown>,
    headerMap: Map<string, string>,
    aliases: string[]
): unknown => {
    for (const alias of aliases) {
        const sourceHeader = headerMap.get(normalizeHeaderKey(alias));

        if (sourceHeader && sourceHeader in row) {
            return row[sourceHeader];
        }
    }

    return null;
};

const buildExcelTarimas = (
    rows: Record<string, unknown>[],
    fileName: string
): { tarimas: Tarima[]; report: TarimasExcelImportReport } => {
    const headerMap = createHeaderMap(Object.keys(rows[0] ?? {}));
    const missingHeaders = EXCEL_REQUIRED_HEADERS.filter((requiredHeader) => {
        const requiredNormalized = normalizeHeaderKey(requiredHeader);
        return !Array.from(headerMap.keys()).includes(requiredNormalized);
    });

    if (missingHeaders.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
    }

    const tarimas: Tarima[] = [];
    const errors: string[] = [];
    const usedIds = new Set<number>();

    rows.forEach((row, index) => {
        const rowNumber = index + 2;

        const pt = toNullableString(getCellValue(row, headerMap, HEADER_ALIASES.pt));
        const descripcion = toNullableString(getCellValue(row, headerMap, HEADER_ALIASES.descripcion));
        const stock = toNullableNumber(getCellValue(row, headerMap, HEADER_ALIASES.stock));
        const unidad = toNullableString(getCellValue(row, headerMap, HEADER_ALIASES.unidad));
        const pesoBruto = toNullableNumber(getCellValue(row, headerMap, HEADER_ALIASES.pesoBruto));
        const pesoNeto = toNullableNumber(getCellValue(row, headerMap, HEADER_ALIASES.pesoNeto));
        const trazabilidad = toNullableString(getCellValue(row, headerMap, HEADER_ALIASES.trazabilidad));
        const ordenBfx = toNullableString(getCellValue(row, headerMap, HEADER_ALIASES.ordenBfx));
        const loteCliente = toNullableString(getCellValue(row, headerMap, HEADER_ALIASES.loteCliente));
        const piezas = toNullableNumber(getCellValue(row, headerMap, HEADER_ALIASES.piezas));
        const pallet = toNullableString(getCellValue(row, headerMap, HEADER_ALIASES.pallet));

        const missingRequiredValues = EXCEL_REQUIRED_ROW_FIELDS.filter((field) => {
            if (field === 'PT') return !pt;
            if (field === 'Trazabilidad') return !trazabilidad;
            if (field === 'Lote cliente') return !loteCliente;
            if (field === 'Pallet') return !pallet;
            return false;
        });

        if (missingRequiredValues.length > 0) {
            errors.push(`Fila ${rowNumber}: faltan campos requeridos (${missingRequiredValues.join(', ')}).`);
            return;
        }

        if (stock === null || pesoBruto === null || pesoNeto === null) {
            errors.push(`Fila ${rowNumber}: Stock, Peso bruto y Peso neto deben ser numéricos.`);
            return;
        }

        const itemNumber = pt;
        const individualUnits = piezas ?? 0;
        const totalUnits = stock * (individualUnits > 0 ? individualUnits : 1);
        const candidateId = 900000000 + index;
        let rfidId = candidateId;

        while (usedIds.has(rfidId)) {
            rfidId += 1;
        }

        usedIds.add(rfidId);

        tarimas.push({
            claveProducto: pt,
            lote: trazabilidad,
            nombreProducto: descripcion ?? pt,
            unidad,
            almacen: 'EXCEL',
            cantidad: stock,
            po: ordenBfx,
            pesoBruto,
            pesoNeto,
            cajas: stock,
            ordenSAP: ordenBfx,
            prodEtiquetaRFIDId: rfidId,
            itemNumber,
            individualUnits,
            totalUnits,
            uom: unidad,
            asignadoAentrega: false,
            trazabilidad,
            loteCliente,
        });
    });

    const report: TarimasExcelImportReport = {
        fileName,
        totalRows: rows.length,
        importedRows: tarimas.length,
        invalidRows: errors.length,
        errors,
        importedAt: new Date().toISOString(),
    };

    return { tarimas, report };
};

const findDestinySheetName = (sheetNames: string[]): string | null => {
    const match = sheetNames.find((sheetName) => sheetName.trim().toLowerCase() === 'destiny');
    return match ?? null;
};

export const useTarimas = () => {
    const [tarimas, setTarimas] = useState<Tarima[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImportingExcel, setIsImportingExcel] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<TarimasDataSource>('endpoint');
    const [excelImportReport, setExcelImportReport] = useState<TarimasExcelImportReport | null>(null);

    const fetchTarimas = async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://172.16.10.31/api/vwStockDestiny', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
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
            setDataSource('endpoint');
            setExcelImportReport(null);
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') {
                return;
            }

            console.error('Error fetching data:', err);

            if (err instanceof TypeError && err.message.includes('CORS')) {
                setError(
                    'Error de CORS: No se puede acceder al servidor. Contacte al administrador para habilitar CORS en el servidor.'
                );
            } else {
                setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const importTarimasFromExcel = async (file: File) => {
        setIsImportingExcel(true);

        try {
            const fileBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const destinySheetName = findDestinySheetName(workbook.SheetNames);

            if (!destinySheetName) {
                throw new Error('No se encontró la hoja "Destiny" en el archivo.');
            }

            const sheet = workbook.Sheets[destinySheetName];

            if (!sheet) {
                throw new Error('No se pudo leer la hoja "Destiny" del archivo.');
            }

            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
                defval: null,
                raw: false,
            });

            if (rows.length === 0) {
                throw new Error('El archivo no contiene registros para importar.');
            }

            const { tarimas: parsedTarimas, report } = buildExcelTarimas(rows, file.name);

            if (parsedTarimas.length === 0) {
                throw new Error('No se pudieron importar filas válidas del archivo.');
            }

            setTarimas(parsedTarimas);
            setDataSource('excel');
            setExcelImportReport(report);

            return report;
        } catch (err) {
            throw err;
        } finally {
            setIsImportingExcel(false);
        }
    };

    const updateTarimasStatus = (tarimasAProcesar: Tarima[]) => {
        setTarimas((prevTarimas) =>
            prevTarimas.map((t) =>
                tarimasAProcesar.some((procesada) => procesada.prodEtiquetaRFIDId === t.prodEtiquetaRFIDId)
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
        dataSource,
        excelImportReport,
        isImportingExcel,
        fetchTarimas,
        importTarimasFromExcel,
        updateTarimasStatus,
    };
};
