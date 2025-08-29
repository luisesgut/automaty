// components/releases/ReleasesTab.tsx
"use client"

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ReleaseDetail from "./ReleaseDetail";
import { 
  RefreshCw, 
  Search, 
  Calendar, 
  User, 
  Package, 
  FileText, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  BarChart3
} from "lucide-react";

// Tipos para Release
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

interface ReleasesTabProps {
  // Props si necesitas pasar algo desde el componente padre
}

type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "name" | "items";
type FilterStatus = "all" | "active" | "completed" | "pending";

export default function ReleasesTab({}: ReleasesTabProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Fetch releases del endpoint
  const fetchReleases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("http://172.16.10.31/api/ReleaseDestiny/releases");
      
      if (!response.ok) {
        throw new Error(`Error al cargar releases: ${response.status}`);
      }
      
      const data = await response.json();
      setReleases(data);
      
    } catch (err) {
      console.error("Error fetching releases:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast({
        title: "Error al cargar releases",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  // Función para volver a la lista
  const handleBackToList = () => {
    setSelectedReleaseId(null);
    fetchReleases();
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700';
      case 'pending':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700';
      case 'active':
      case 'activo':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700';
    }
  };

  // Función para obtener el ícono del estado
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'completado':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'pending':
      case 'pendiente':
        return <Clock className="h-3 w-3" />;
      case 'active':
      case 'activo':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  // Filtrar y ordenar releases
  const filteredAndSortedReleases = releases
    .filter(release => {
      const matchesSearch = release.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           release.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           release.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || release.status.toLowerCase() === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case "oldest":
          return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
        case "name":
          return a.fileName.localeCompare(b.fileName);
        case "items":
          return b.totalItems - a.totalItems;
        default:
          return 0;
      }
    });

  // Estadísticas rápidas
  const stats = {
    total: releases.length,
    completed: releases.filter(r => r.status.toLowerCase() === 'completed' || r.status.toLowerCase() === 'completado').length,
    pending: releases.filter(r => r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'pendiente').length,
    totalItems: releases.reduce((sum, r) => sum + r.totalItems, 0)
  };

  // Vista de carga
  if (loading && releases.length === 0) {
    return (
      <LoadingSpinner
        title="Cargando releases..."
        description="Obteniendo lista de releases del servidor"
        size="lg"
        className="h-96"
      />
    );
  }

  // Vista de error
  if (error && releases.length === 0) {
    return (
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Error al cargar releases
          </h2>
          <p className="text-red-600 dark:text-red-300 text-sm">
            {error}
          </p>
        </div>
        <Button onClick={fetchReleases} className="w-full">
          Reintentar
        </Button>
      </div>
    );
  }

  // Si hay un release seleccionado, mostrar detalle
  if (selectedReleaseId) {
    return (
      <ReleaseDetail
        releaseId={selectedReleaseId}
        onBack={handleBackToList}
      />
    );
  }

  // Vista principal: Lista de releases
  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Releases
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestiona y visualiza los releases generados por el sistema
            </p>
          </div>
          <Button
            onClick={fetchReleases}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Releases</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">Completados</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Total Items</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalItems.toLocaleString()}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Controles de filtrado y búsqueda */}
      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Búsqueda */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar releases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros */}
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-[150px]">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="oldest">Más antiguos</SelectItem>
                    <SelectItem value="name">Por nombre</SelectItem>
                    <SelectItem value="items">Por items</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selector de vista */}
            <div className="flex border rounded-lg p-1 bg-gray-100 dark:bg-gray-800">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de releases */}
      {filteredAndSortedReleases.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No hay releases
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== "all" 
                ? "No se encontraron releases que coincidan con los filtros aplicados."
                : "No hay releases disponibles en el sistema."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredAndSortedReleases.map((release) => (
            <Card
              key={release.id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl hover:-translate-y-1"
              onClick={() => setSelectedReleaseId(release.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {release.fileName}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {release.description}
                    </p>
                  </div>
                  <Badge className={`ml-2 ${getStatusColor(release.status)}`}>
                    {getStatusIcon(release.status)}
                    <span className="ml-1 capitalize">{release.status}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Información del release */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <User className="h-4 w-4 mr-2" />
                      <span className="truncate">{release.createdBy}</span>
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Package className="h-4 w-4 mr-2" />
                      <span>{release.totalItems} items</span>
                    </div>
                  </div>

                  <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(release.createdDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 group-hover:border-blue-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReleaseId(release.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:border-green-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Aquí agregar lógica de descarga
                        toast({
                          title: "Descarga iniciada",
                          description: `Descargando ${release.fileName}...`,
                        });
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}