import packageJson from "../package.json";

export type VersionChange = {
  version: string;
  date?: string;
  description?: string;
  changes: string[];
};

const resolvedVersion = "1.8.10";

export const versionHistory: VersionChange[] = [
  {
    version: resolvedVersion,
    date: "Septiembre 2025",
    description: "",
    changes: [
      "Consolidamos las pestañas de Tarimas, Excel y Releases bajo una navegación unificada.",
      "Actualizamos el modal de procesamiento para guiar el flujo de asignación de tarimas.",
      "Añadimos métricas y previsualización en la importación de datos Excel para validar antes de procesar.",
    ],
  },
];

export const currentVersion = versionHistory[0];
