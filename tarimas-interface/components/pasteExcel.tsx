"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tarima } from "@/types";

interface PasteExcelProps {
  onSelectTarimaAction: (tarima: Tarima) => void; // Cambiado el nombre para seguir la convención
}

export default function PasteExcel({ onSelectTarimaAction }: PasteExcelProps) {
  const [pastedData, setPastedData] = useState("");

  const handlePaste = () => {
    // Lógica para procesar datos pegados
    console.log("Datos pegados:", pastedData);
  };

  return (
      <Card>
        <CardHeader>
          <CardTitle>Pegar Datos de Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
              placeholder="Pega aquí los datos de Excel..."
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              rows={10}
          />
          <Button onClick={handlePaste} disabled={!pastedData.trim()}>
            Procesar Datos
          </Button>
        </CardContent>
      </Card>
  );
}