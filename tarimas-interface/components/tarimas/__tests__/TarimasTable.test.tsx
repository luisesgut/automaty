import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TarimasTable from '../TarimasTable';
import { Tarima } from '@/types';
import { toast } from '@/components/ui/use-toast';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/table', () => ({
  TableBody: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLTableSectionElement>>) => (
    <tbody {...props}>{children}</tbody>
  ),
  TableCell: ({ children, ...props }: React.PropsWithChildren<React.TdHTMLAttributes<HTMLTableCellElement>>) => (
    <td {...props}>{children}</td>
  ),
  TableHead: ({ children, ...props }: React.PropsWithChildren<React.ThHTMLAttributes<HTMLTableCellElement>>) => (
    <th {...props}>{children}</th>
  ),
  TableHeader: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLTableSectionElement>>) => (
    <thead {...props}>{children}</thead>
  ),
  TableRow: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLTableRowElement>>) => (
    <tr {...props}>{children}</tr>
  ),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, disabled }: { checked?: boolean; onCheckedChange?: () => void; disabled?: boolean }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onCheckedChange}
      disabled={disabled}
      aria-label="checkbox"
    />
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span>loader</span>,
  CheckCircle: () => <span>check</span>,
  AlertCircle: () => <span>alert</span>,
  Lock: () => <span>lock</span>,
}));

const mockedToast = vi.mocked(toast);

const createTarima = (overrides: Partial<Tarima> = {}): Tarima => ({
  claveProducto: 'CP-1',
  lote: 'LOTE1',
  nombreProducto: 'Producto A',
  unidad: 'CJ',
  almacen: 'ALM-1',
  cantidad: 10,
  po: 'PO-123',
  pesoBruto: 100,
  pesoNeto: 90,
  cajas: 5,
  ordenSAP: 'SAP-1',
  prodEtiquetaRFIDId: 1,
  itemNumber: 'ITEM-1',
  individualUnits: 12,
  totalUnits: 60,
  uom: 'CJ',
  asignadoAentrega: false,
  ...overrides,
});

describe('TarimasTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps = {
    filterSummary: '',
    loading: false,
    weightInfo: undefined,
    showAllTarimas: true,
    highlightMap: undefined,
  };

  it('renders "N/A" for null numeric fields without crashing', () => {
    const tarimaWithNulls = createTarima({
      cantidad: null,
      cajas: null,
      pesoBruto: null,
      pesoNeto: null,
      unidad: null,
      almacen: null,
    });

    render(
      <TarimasTable
        {...baseProps}
        tarimas={[tarimaWithNulls]}
        filteredTarimas={[tarimaWithNulls]}
        selectedTarimas={[]}
        onSelectTarima={vi.fn()}
      />
    );

    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('prevents selecting tarimas missing required data and emits toast', () => {
    const onSelectTarima = vi.fn();
    const incompleteTarima = createTarima({ nombreProducto: null });

    render(
      <TarimasTable
        {...baseProps}
        tarimas={[incompleteTarima]}
        filteredTarimas={[incompleteTarima]}
        selectedTarimas={[]}
        onSelectTarima={onSelectTarima}
      />
    );

    const row = screen.getByText('Datos incompletos').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(row!);

    expect(onSelectTarima).not.toHaveBeenCalled();
    expect(mockedToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('Tarima incompleta') })
    );
  });

  it('allows selecting tarima when data is complete', () => {
    const onSelectTarima = vi.fn();
    const tarima = createTarima();

    render(
      <TarimasTable
        {...baseProps}
        tarimas={[tarima]}
        filteredTarimas={[tarima]}
        selectedTarimas={[]}
        onSelectTarima={onSelectTarima}
      />
    );

    const row = screen.getByText('Producto A').closest('tr');
    expect(row).not.toBeNull();
    fireEvent.click(row!);

    expect(onSelectTarima).toHaveBeenCalledWith(tarima);
  });
});
