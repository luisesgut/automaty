import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ReleasesTab() {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : [json];
        setData(arr);
        setColumns(Object.keys(arr[0] || {}));
      } catch (err) {
        console.error("Error parsing JSON", err);
      }
    };
    reader.readAsText(file);
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...data];
    newData[rowIndex][key] = value;
    setData(newData);
  };

  return (
    <div className="space-y-4">
      <Input type="file" accept=".json" onChange={handleFileChange} />
      {data.length > 0 && (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => (
                    <TableCell key={col} className="p-1">
                      <Input
                        value={row[col] as string}
                        onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
