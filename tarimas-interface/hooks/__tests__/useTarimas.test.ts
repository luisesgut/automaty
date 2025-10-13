import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useTarimas } from '../useTarimas';

describe('useTarimas', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes incoming API data and filters invalid entries', async () => {
    const mockResponse = [
      {
        prodEtiquetaRFIDId: '10',
        nombreProducto: ' Producto A ',
        claveProducto: 'CP-10',
        lote: 'L1',
        unidad: 'CJ',
        almacen: 'ALM',
        cantidad: '5',
        po: 'PO-1',
        pesoBruto: '100',
        pesoNeto: '90',
        cajas: '2',
        ordenSAP: 'SAP-1',
        itemNumber: 'IT-1',
        individualUnits: '10',
        totalUnits: '50',
        uom: 'CJ',
        asignadoAentrega: 'false',
      },
      {
        prodEtiquetaRFIDId: null,
        nombreProducto: 'Should be filtered',
      },
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as unknown as Response));

    const { result } = renderHook(() => useTarimas());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tarimas).toHaveLength(1);
    expect(result.current.tarimas[0].prodEtiquetaRFIDId).toBe(10);
    expect(result.current.tarimas[0].nombreProducto).toBe('Producto A');
    expect(result.current.tarimas[0].pesoBruto).toBe(100);
  });
});
