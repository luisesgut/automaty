// components/releases/EditableShippingTable.tsx
"use client"

import { useState } from "react";

interface ShippingItem {
  id: number;
  company: string;
  shipDate: string;
  poNumber: string;
  sap: string;
  claveProducto: string;
  customerItemNumber: string;
  itemDescription: string;
  quantityAlreadyShipped: string;
  pallets: number;
  casesPerPallet: number;
  unitsPerCase: number;
  grossWeight: number;
  netWeight: number;
  itemType: string;
  salesCSRNames: string;
  createdDate: string;
  modifiedDate: string | null;
  modifiedBy: string;
  quantityOnFloor: number;
  precioPorUnidad: number;
  pesoPorPieza: number;
  costoTotal: number;
  valorAduanal: number;
}

interface EditableShippingTableProps {
  items: ShippingItem[];
  onUpdateItem: (item: ShippingItem) => void;
}

interface EditingCell {
  itemId: number;
  field: keyof ShippingItem;
}

export default function EditableShippingTable({ items, onUpdateItem }: EditableShippingTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Campos editables principales
  const editableFields: Array<{
    key: keyof ShippingItem;
    label: string;
    type: 'text' | 'number' | 'date';
    width: string;
  }> = [
    { key: 'company', label: 'Compañía', type: 'text', width: 'w-32' },
    { key: 'poNumber', label: 'PO Number', type: 'text', width: 'w-28' },
    { key: 'sap', label: 'SAP', type: 'text', width: 'w-24' },
    { key: 'claveProducto', label: 'Clave Producto', type: 'text', width: 'w-32' },
    { key: 'customerItemNumber', label: 'Item Number', type: 'text', width: 'w-32' },
    { key: 'itemDescription', label: 'Descripción', type: 'text', width: 'w-48' },
    { key: 'quantityAlreadyShipped', label: 'Cantidad Enviada', type: 'text', width: 'w-28' },
    { key: 'pallets', label: 'Pallets', type: 'number', width: 'w-20' },
    { key: 'casesPerPallet', label: 'Cajas/Pallet', type: 'number', width: 'w-24' },
    { key: 'unitsPerCase', label: 'Unidades/Caja', type: 'number', width: 'w-28' },
    { key: 'grossWeight', label: 'Peso Bruto', type: 'number', width: 'w-24' },
    { key: 'netWeight', label: 'Peso Neto', type: 'number', width: 'w-24' },
    { key: 'itemType', label: 'Tipo Item', type: 'text', width: 'w-28' },
    { key: 'salesCSRNames', label: 'Vendedor', type: 'text', width: 'w-32' },
  ];

  const handleCellClick = (itemId: number, field: keyof ShippingItem) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setEditingCell({ itemId, field });
      setEditValue(String(item[field] || ''));
    }
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    const item = items.find(i => i.id === editingCell.itemId);
    if (!item) return;

    const field = editableFields.find(f => f.key === editingCell.field);
    if (!field) return;

    let newValue: any = editValue;
    
    // Convertir tipos según el campo
    if (field.type === 'number') {
      newValue = parseFloat(editValue) || 0;
    }

    const updatedItem = {
      ...item,
      [editingCell.field]: newValue
    };

    onUpdateItem(updatedItem);
    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '';
    
    if (type === 'number' && typeof value === 'number') {
      return value.toLocaleString('es-MX', { 
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2 
      });
    }
    
    return String(value);
  };

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 dark:text-slate-400">
        No hay items para mostrar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">
              ID
            </th>
            {editableFields.map((field) => (
              <th 
                key={field.key}
                className={`px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider ${field.width}`}
              >
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                {item.id}
              </td>
              {editableFields.map((field) => (
                <td 
                  key={field.key}
                  className={`px-4 py-3 text-sm ${field.width}`}
                >
                  {editingCell?.itemId === item.id && editingCell?.field === field.key ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleSaveEdit}
                        autoFocus
                        className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary dark:bg-slate-700 dark:border-slate-600"
                        step={field.type === 'number' ? '0.01' : undefined}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => handleCellClick(item.id, field.key)}
                      className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 px-2 py-1 rounded transition-colors min-h-[24px] flex items-center"
                      title="Click para editar"
                    >
                      <span className={`${!item[field.key] ? 'text-slate-400 italic' : 'text-slate-900 dark:text-slate-100'}`}>
                        {item[field.key] ? formatValue(item[field.key], field.type) : 'Sin valor'}
                      </span>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Instrucciones de uso */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600">
        <div className="flex items-center space-x-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-slate-100 dark:bg-slate-600 rounded border"></div>
            <span>Click en cualquier celda para editar</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs">Enter</kbd>
            <span>Guardar</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs">Esc</kbd>
            <span>Cancelar</span>
          </div>
        </div>
      </div>
    </div>
  );
}