"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContactCreateInput } from "@/types/crm";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    contacts: ContactCreateInput[]
  ) => Promise<{ imported: number; skipped: number; errors: number } | null>;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  return lines.slice(1).map((line) => {
    // Simple CSV parsing (handles quoted values)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

// Auto-detect column mapping
const FIELD_ALIASES: Record<string, string[]> = {
  first_name: ["first_name", "first name", "firstname", "first", "given name", "name"],
  last_name: ["last_name", "last name", "lastname", "last", "surname", "family name"],
  email: ["email", "email address", "e-mail", "mail"],
  phone: ["phone", "phone number", "telephone", "tel", "mobile", "cell"],
  company: ["company", "company name", "organization", "org", "business"],
  title: ["title", "job title", "position", "role", "job"],
};

function mapRow(row: Record<string, string>): ContactCreateInput | null {
  const mapped: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (row[alias] && row[alias].trim()) {
        mapped[field] = row[alias].trim();
        break;
      }
    }
  }
  // first_name is required
  if (!mapped.first_name) {
    // Try splitting "name" field
    const name = row["name"] || row["full name"] || row["fullname"] || "";
    if (name) {
      const parts = name.trim().split(/\s+/);
      mapped.first_name = parts[0];
      if (parts.length > 1) mapped.last_name = parts.slice(1).join(" ");
    }
  }
  if (!mapped.first_name) return null;
  return {
    first_name: mapped.first_name,
    last_name: mapped.last_name,
    email: mapped.email,
    phone: mapped.phone,
    company: mapped.company,
    title: mapped.title,
    source: "csv_import",
  };
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [parsed, setParsed] = useState<ContactCreateInput[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const reset = () => {
    setParsed([]);
    setFileName("");
    setResult(null);
  };

  const handleFile = useCallback((file: File) => {
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const contacts = rows
        .map(mapRow)
        .filter((c): c is ContactCreateInput => c !== null);
      setParsed(contacts);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleImport = async () => {
    setImporting(true);
    const res = await onImport(parsed);
    setResult(res);
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="bg-onyx border-gunmetal sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-platinum flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-neonblue" />
            Import Contacts
          </DialogTitle>
          <DialogDescription className="text-silver">
            Upload a CSV file to import contacts. Columns are auto-detected.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Results view
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-automationgreen mx-auto" />
            <div>
              <p className="text-lg font-medium text-platinum">Import Complete</p>
              <div className="flex items-center justify-center gap-6 mt-3">
                <div>
                  <p className="text-2xl font-bold text-automationgreen">{result.imported}</p>
                  <p className="text-xs text-mist">Imported</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warningamber">{result.skipped}</p>
                  <p className="text-xs text-mist">Skipped</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-errorred">{result.errors}</p>
                  <p className="text-xs text-mist">Errors</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => { reset(); onOpenChange(false); }}
              className="bg-neonblue hover:bg-electricblue"
            >
              Done
            </Button>
          </div>
        ) : parsed.length === 0 ? (
          // Dropzone
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gunmetal rounded-xl p-12 text-center hover:border-neonblue/30 transition-colors cursor-pointer"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".csv";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
              };
              input.click();
            }}
          >
            <Upload className="h-10 w-10 text-mist mx-auto mb-3" />
            <p className="text-platinum font-medium">
              Drop CSV file here or click to browse
            </p>
            <p className="text-xs text-mist mt-2">
              Supports: first_name, last_name, email, phone, company, title
            </p>
          </div>
        ) : (
          // Preview
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-silver">
                <span className="text-platinum font-medium">{parsed.length}</span>{" "}
                contacts from <span className="text-neonblue">{fileName}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="border-gunmetal text-silver"
              >
                Clear
              </Button>
            </div>

            <div className="rounded-lg border border-gunmetal overflow-hidden max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gunmetal">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Phone</TableHead>
                    <TableHead className="text-xs">Company</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.slice(0, 20).map((c, i) => (
                    <TableRow key={i} className="border-gunmetal">
                      <TableCell className="text-sm text-platinum">
                        {c.first_name} {c.last_name || ""}
                      </TableCell>
                      <TableCell className="text-sm text-silver">
                        {c.email || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-silver">
                        {c.phone || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-silver">
                        {c.company || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsed.length > 20 && (
                <p className="text-xs text-mist text-center py-2">
                  ...and {parsed.length - 20} more
                </p>
              )}
            </div>

            {parsed.length > 500 && (
              <div className="flex items-center gap-2 text-warningamber text-sm">
                <AlertCircle className="h-4 w-4" />
                Maximum 500 contacts per import. Only the first 500 will be imported.
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { reset(); onOpenChange(false); }}
                className="border-gunmetal text-silver"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing}
                className="bg-neonblue hover:bg-electricblue text-white"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import {Math.min(parsed.length, 500)} Contacts
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
