// components/layout/TabNavigation.tsx
import { Button } from "@/components/ui/button";
import { Package, Search } from "lucide-react";
import { ActiveTab } from "@/types";

interface TabNavigationProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
    selectedCount?: number;
}

export default function TabNavigation({ activeTab, onTabChange, selectedCount }: TabNavigationProps) {
    const tabs = [
        {
            id: "tarimas" as ActiveTab,
            label: "Inventario de Tarimas",
            icon: Package,
            description: "Gestiona el inventario completo"
        },
        {
            id: "excel" as ActiveTab,
            label: "Filtrar por Excel",
            icon: Search,
            description: "Busca productos específicos"
        }
    ];

    return (
        <div className="container mx-auto">
            <div className="flex border-b dark:border-slate-700 mb-6 px-4 mt-4 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            onClick={() => onTabChange(tab.id)}
                            className={`py-4 px-6 rounded-none font-medium whitespace-nowrap relative transition-all duration-200
                        ${isActive
                                ? "border-b-2 border-primary text-primary bg-primary/5"
                                : "text-muted-foreground hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                        >
                            <Icon className="h-4 w-4 mr-2" />
                            <div className="flex flex-col items-start">
                                <span>{tab.label}</span>
                                {selectedCount && selectedCount > 0 && tab.id === "tarimas" && (
                                    <span className="text-xs text-primary font-normal">
                    {selectedCount} seleccionadas
                  </span>
                                )}
                            </div>

                            {/* Indicador visual mejorado */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                            )}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}