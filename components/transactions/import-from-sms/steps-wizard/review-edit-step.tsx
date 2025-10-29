"use client";

import { useEffect, useState } from "react";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";

import BulkEditToolbar from "@/components/transactions/bulk-edit-toolbar";
import ParsedTransactionTable from "@/components/transactions/parsed-transaction-table";
import { TAddTransaction } from "@/types/transaction";
import { TCategory } from "@/types/category";
import { TCard } from "@/types/card";
import { FilterAndSortItem } from "@/types/global";

interface ParsedTransaction extends TAddTransaction {
  originalText: string;
  parsingStatus: "pending" | "success" | "error";
  errorMessage?: string;
}

interface ReviewEditStepProps {
  transactions: ParsedTransaction[];
  cardOptions: FilterAndSortItem[];
  categoryOptions: TCategory[];
  isLoading: boolean;
  inputMode: "sms" | "manual";
  allCards: TCard[];
  onTransactionUpdate: (index: number, updates: Partial<TAddTransaction>) => void;
  onTransactionRemove: (index: number) => void;
  onSelectionChange: (selected: number[]) => void;
  onBack: () => void;
  onImport: () => void;
}

export default function ReviewEditStep({
  transactions,
  cardOptions,
  categoryOptions,
  isLoading,
  inputMode,
  allCards,
  onTransactionUpdate,
  onTransactionRemove,
  onSelectionChange,
  onBack,
  onImport,
}: ReviewEditStepProps) {
  const [selectedTxn, setSelectedTxn] = useState<number[]>([]);

  const validTransactions = transactions.filter(
    (t) => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0
  );

  useEffect(() => {
    console.log("🚀 ~ ReviewEditStep ~ validTransactions:", validTransactions)

  }, [validTransactions]);

  const handleBulkUpdate = (updates: Partial<TAddTransaction>) => {
    if (selectedTxn.length === 0) return;

    selectedTxn.forEach((index) => {
      onTransactionUpdate(index, updates);
    });
  };

  const handleSelectionChange = (selected: number[]) => {
    setSelectedTxn(selected);
    onSelectionChange(selected);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <Alert
        color="primary"
        description="Review and customize the parsed transactions. You can edit individual fields or bulk update multiple transactions."
        title="Step 2: Review & Edit Transactions"
      />

      <div className="w-full flex flex-col gap-4">
        {selectedTxn.length > 0 && (
          <BulkEditToolbar
            listCards={cardOptions}
            listCategories={categoryOptions}
            selectedCount={selectedTxn.length}
            onBulkUpdate={handleBulkUpdate}
          />
        )}

        <ParsedTransactionTable
          allCards={allCards}
          inputMode={inputMode}
          selectedTransactions={selectedTxn}
          transactions={transactions}
          onSelectionChange={handleSelectionChange}
          onTransactionRemove={onTransactionRemove}
          onTransactionUpdate={onTransactionUpdate}
        />
      </div>

      <div className="w-full flex justify-between items-center gap-4">
        <div className="text-sm text-default-500">
          {validTransactions.length > 0
            ? `${validTransactions.length} valid transaction${validTransactions.length !== 1 ? "s" : ""} ready to import`
            : "No valid transactions to import"}
        </div>
        <div className="flex gap-2">
          <Button
            color="default"
            isDisabled={isLoading}
            variant="bordered"
            onPress={onBack}
          >
            Back
          </Button>
          <Button
            color="success"
            isDisabled={validTransactions.length === 0 || isLoading}
            isLoading={isLoading}
            onPress={onImport}
          >
            {isLoading ? "Importing..." : `Import ${validTransactions.length} Transaction${validTransactions.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

