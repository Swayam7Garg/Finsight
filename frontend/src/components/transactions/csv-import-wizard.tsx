"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";
import { Upload, FileText, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { useImportTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CsvImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRANSACTION_FIELDS = [
  { value: "skip", label: "-- Skip --" },
  { value: "date", label: "Date" },
  { value: "description", label: "Description" },
  { value: "amount", label: "Amount" },
  { value: "type", label: "Type" },
  { value: "category", label: "Category" },
  { value: "notes", label: "Notes" },
  { value: "tags", label: "Tags" },
];

type Step = "upload" | "mapping" | "preview" | "confirm";

export function CsvImportWizard({ open, onOpenChange }: CsvImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [defaultCategoryId, setDefaultCategoryId] = useState("");

  const importTransactions = useImportTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const activeAccounts = accounts.filter((a) => !a.isArchived);

  function reset() {
    setStep("upload");
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setColumnMapping({});
    setAccountId("");
    setDefaultCategoryId("");
  }

  function handleFileSelect(selectedFile: File) {
    if (!selectedFile.name.endsWith(".csv")) return;
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      preview: 51,
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length > 0) {
          setCsvHeaders(rows[0]);
          setCsvData(rows.slice(1).filter((row) => row.some((cell) => cell)));

          const autoMap: Record<string, string> = {};
          rows[0].forEach((header) => {
            const lower = header.toLowerCase().trim();
            if (lower.includes("date")) autoMap[header] = "date";
            else if (lower.includes("desc") || lower.includes("memo") || lower.includes("name"))
              autoMap[header] = "description";
            else if (lower.includes("amount") || lower.includes("value"))
              autoMap[header] = "amount";
            else if (lower.includes("type") || lower.includes("kind")) autoMap[header] = "type";
            else if (lower.includes("categ")) autoMap[header] = "category";
            else if (lower.includes("note")) autoMap[header] = "notes";
            else if (lower.includes("tag")) autoMap[header] = "tags";
            else autoMap[header] = "skip";
          });
          setColumnMapping(autoMap);
          setStep("mapping");
        }
      },
      error: () => {},
    });
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const mappedFieldCount = Object.values(columnMapping).filter((v) => v !== "skip").length;
  const hasRequiredFields =
    Object.values(columnMapping).includes("date") &&
    Object.values(columnMapping).includes("amount") &&
    Object.values(columnMapping).includes("description");

  const canImport = !!accountId && !!defaultCategoryId;

  async function handleImport() {
    if (!file || !accountId || !defaultCategoryId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountId", accountId);
    formData.append("defaultCategoryId", defaultCategoryId);
    formData.append("mapping", JSON.stringify(columnMapping));

    await importTransactions.mutateAsync(formData);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset();
        onOpenChange(val);
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col p-4 sm:max-w-[650px] sm:p-5">
        <DialogHeader className="pb-1">
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map columns to import transactions.
          </DialogDescription>
        </DialogHeader>

        {/* Steps Indicator */}
        <div className="flex items-center gap-1.5 border-b border-border py-3">
          {(["upload", "mapping", "preview", "confirm"] as Step[]).map((s, i) => {
            const steps = ["upload", "mapping", "preview", "confirm"] as Step[];
            const currentIdx = steps.indexOf(step);
            const done = currentIdx > i;
            const active = step === s;
            return (
              <div key={s} className="flex flex-1 items-center gap-1.5">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "hidden text-[10px] font-medium capitalize sm:block",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      "mb-4 h-0.5 flex-1 rounded transition-colors",
                      done ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          className={cn("min-h-0 py-1", step !== "confirm" ? "flex-1 overflow-y-auto" : "hidden")}
        >
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div
              className={cn(
                "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv";
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleFileSelect(f);
                };
                input.click();
              }}
            >
              <Upload className="mx-auto mb-5 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Drop your CSV file here</h3>
              <p className="text-sm text-muted-foreground">or click to browse files</p>
              <p className="mt-4 text-xs text-muted-foreground">
                Supports CSV files exported from most banks
              </p>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === "mapping" && (
            <div className="space-y-5 pt-1">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{file?.name}</span>
                <Badge variant="secondary">{csvData.length} rows</Badge>
              </div>

              {!hasRequiredFields && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Please map Date, Description, and Amount fields to continue.
                </div>
              )}

              <div className="space-y-4">
                {csvHeaders.map((header) => (
                  <div key={header} className="flex items-center gap-3 rounded-md px-1 py-0.5">
                    <div className="w-1/3">
                      <Label className="block truncate text-sm font-medium">{header}</Label>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        e.g. {csvData[0]?.[csvHeaders.indexOf(header)] ?? ""}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <Select
                        value={columnMapping[header] ?? "skip"}
                        onValueChange={(value) =>
                          setColumnMapping((prev) => ({ ...prev, [header]: value }))
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSACTION_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div className="space-y-4 pt-1">
              <p className="text-sm text-muted-foreground">
                Preview of the first {Math.min(csvData.length, 10)} rows to import:
              </p>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="min-w-max">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvHeaders
                          .filter((h) => columnMapping[h] !== "skip")
                          .map((h) => (
                            <TableHead key={h} className="whitespace-nowrap text-xs">
                              {columnMapping[h]}
                            </TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          {csvHeaders
                            .filter((h) => columnMapping[h] !== "skip")
                            .map((h) => (
                              <TableCell key={h} className="max-w-[180px] truncate text-xs">
                                {row[csvHeaders.indexOf(h)]}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Step 4: Confirm — outside the scroll container so Select portals have full viewport */}
        {step === "confirm" && (
          <div className="flex-1 space-y-6 py-3">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3.5 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{csvData.length}</span> transactions
                ready with <span className="font-semibold text-foreground">{mappedFieldCount}</span>{" "}
                mapped fields. Choose where to import them.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="import-account">
                  Target account <span className="text-destructive">*</span>
                </Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger id="import-account">
                    <SelectValue placeholder="Select an account…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  All imported transactions will be added to this account.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-category">
                  Default category <span className="text-destructive">*</span>
                </Label>
                <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
                  <SelectTrigger id="import-category">
                    <SelectValue placeholder="Select a fallback category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for rows where the CSV has no category or the name isn&apos;t recognized.
                </p>
              </div>
            </div>

            {!canImport && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Please select an account and a default category to continue.
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between border-t border-border pt-3 sm:justify-between">
          <div>
            {step !== "upload" && (
              <Button
                variant="outline"
                onClick={() => {
                  const steps: Step[] = ["upload", "mapping", "preview", "confirm"];
                  const idx = steps.indexOf(step);
                  if (idx > 0) setStep(steps[idx - 1]);
                }}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === "mapping" && (
              <Button
                onClick={() => setStep("preview")}
                disabled={!hasRequiredFields}
                className="gap-1"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === "preview" && (
              <Button onClick={() => setStep("confirm")} className="gap-1">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === "confirm" && (
              <Button onClick={handleImport} disabled={!canImport || importTransactions.isPending}>
                {importTransactions.isPending
                  ? "Importing..."
                  : `Import ${csvData.length} Transactions`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
