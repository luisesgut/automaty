import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useSelection } from '../useSelection';
import { Tarima } from '@/types';

const createTarima = (overrides: Partial<Tarima> = {}): Tarima => ({
  claveProducto: 'CP-1',
  lote: 'L1',
  nombreProducto: 'Producto Test',
  unidad: 'CJ',
  almacen: 'A1',
  cantidad: 10,
  po: 'PO-10',
  pesoBruto: 100,
  pesoNeto: 90,
  cajas: 5,
  ordenSAP: 'SAP-1',
  prodEtiquetaRFIDId: overrides.prodEtiquetaRFIDId ?? Math.floor(Math.random() * 1000) + 1,
  itemNumber: 'IT-1',
  individualUnits: 10,
  totalUnits: 100,
  uom: 'CJ',
  asignadoAentrega: false,
  ...overrides,
});

describe('useSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles tarima selection and removes it on second click', () => {
    const tarima = createTarima({ prodEtiquetaRFIDId: 1 });
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.handleSelectTarima(tarima);
    });

    expect(result.current.selectedTarimas).toHaveLength(1);

    act(() => {
      result.current.handleSelectTarima(tarima);
    });

    expect(result.current.selectedTarimas).toHaveLength(0);
  });

  it('handles null numeric values when computing stats', () => {
    const tarima = createTarima({
      cajas: null,
      pesoBruto: null,
      pesoNeto: null,
      cantidad: null,
      totalUnits: null,
      individualUnits: null,
    });

    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.handleSelectTarima(tarima);
    });

    const stats = result.current.getStats();

    expect(stats.totalCajas).toBe(0);
    expect(stats.totalPesoBruto).toBe(0);
    expect(stats.totalPesoNeto).toBe(0);
    expect(stats.totalUnidades).toBe(0);
  });

  it('removes processed tarimas via clearProcessedTarimas', () => {
    const processed = createTarima({ prodEtiquetaRFIDId: 2, asignadoAentrega: true });
    const pending = createTarima({ prodEtiquetaRFIDId: 3, asignadoAentrega: false });

    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.handleSelectTarima(processed);
      result.current.handleSelectTarima(pending);
    });

    expect(result.current.selectedTarimas).toHaveLength(2);

    act(() => {
      result.current.clearProcessedTarimas();
    });

    expect(result.current.selectedTarimas).toEqual([pending]);
  });

  it('computes weight info ignoring null values', () => {
    const tarima = createTarima({ pesoBruto: null });
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.handleSelectTarima(tarima);
    });

    const weightInfo = result.current.getWeightInfo();
    expect(weightInfo.totalPesoBruto).toBe(0);
    expect(weightInfo.excedeReferencia).toBe(false);
  });
});
