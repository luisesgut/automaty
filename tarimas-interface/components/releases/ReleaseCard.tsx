"use client"

import { useState } from "react";
import { Eye } from "lucide-react";
import PreviewModal from "./PreviewModal";

interface Release {
  id: number;
  fileName: string;
  description: string;
  createdDate: string;
  createdBy: string;
  status: string;
  releaseDate: string | null;
  tablesCount: number;
  totalItems: number;
}

interface ReleaseCardProps {
  release: Release;
  onClick: () => void;
}

export default function ReleaseCard({ release, onClick }: ReleaseCardProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se active el onClick del card
    setShowPreviewModal(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Solo activar onClick si no se hizo clic en el botón de preview
    if (!(e.target as HTMLElement).closest('[data-preview-button]')) {
      onClick();
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary"
      >
        {/* Header del card */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 truncate pr-2">
            {release.fileName}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(release.status)}`}>
              {release.status}
            </span>
            <button
              data-preview-button
              onClick={handlePreviewClick}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title="Vista previa"
            >
              <Eye className="w-4 h-4 text-slate-500 hover:text-primary" />
            </button>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
          {release.description || "Sin descripción"}
        </p>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {release.tablesCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Tablas
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {release.totalItems}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Items
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div>Creado por: {release.createdBy}</div>
          <div>Fecha: {formatDate(release.createdDate)}</div>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        releaseId={release.id}
        releaseName={release.fileName}
      />
    </>
  );
}