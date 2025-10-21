"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import Image from "next/image";

import ParsedTransactionTable from "./parsed-transaction-table";
import BulkEditToolbar from "./bulk-edit-toolbar";

import { useCardEndpoint } from "@/hooks/useCardEndpoint";
import { useCategoryEndpoint } from "@/hooks/useCategoryEndpoint";
import { useImportTransactionEndpoint } from "@/hooks/useImportTransactionEndpoint";
import CustomModal from "@/components/shared/custom-modal/custom-modal";
import { TAddTransaction } from "@/types/transaction";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";
import { useDebounce } from "@/hooks/useDebounce";
import { getBankLogo } from "@/configs/bank";
import { FilterAndSortItem } from "@/types/global";


interface MultipleTxnModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedTransaction extends TAddTransaction {
  originalText: string;
  parsingStatus: "pending" | "success" | "error";
  errorMessage?: string;
}

export default function MultipleTxnModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: MultipleTxnModalProps) {
  const [inputText, setInputText] = useState("");
  const [parsedTxn, setParsedTxn] = useState<ParsedTransaction[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<number[]>([]);
  const [cardOptions, setCardOptions] = useState<FilterAndSortItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<TCategory[]>([]);
  const { useGetListCards } = useCardEndpoint();
  const { useGetCategories } = useCategoryEndpoint();
  const { useCreateMultipleTransactions } = useImportTransactionEndpoint();

  const {
    data: createMultipleResult,
    loading: creatingMultiple,
    error: createMultipleError,
    fetch: createMultipleTransactions,
  } = useCreateMultipleTransactions();

  const {
    data: fetchCardsResult,
    fetch: fetchCards,
  } = useGetListCards();

  const {
    data: fetchCategoriesResult,
    fetch: fetchCategories,
  } = useGetCategories();

  const parseTransactions = async () => {
    if (!bankNotificationTexts.trim()) return;

    setIsParsing(true);
    const lines = bankNotificationTexts.split('\n').filter(line => line.trim());

    const transactions: ParsedTransaction[] = lines.map(line => ({
      originalText: line.trim(),
      card_id: 0, // Will be set by user
      direction: "out", // Default to out, will be detected
      category_id: null,
      date: new Date().toISOString(),
      amount: 0,
      description: "",
      parsingStatus: "pending" as const,
    }));

    setParsedTxn(transactions);

    // Parse each transaction
    for (let i = 0; i < transactions.length; i++) {
      try {
        const parsed = await parseTransactionText(transactions[i].originalText);

        setParsedTxn(prev =>
          prev.map((t, index) =>
            index === i
              ? { ...t, ...parsed, parsingStatus: "success" as const }
              : t
          )
        );
      } catch {
        setParsedTxn(prev =>
          prev.map((t, index) =>
            index === i
              ? { ...t, parsingStatus: "error" as const, errorMessage: "Failed to parse transaction" }
              : t
          )
        );
      }
    }

    setIsParsing(false);
  };

  const bankNotificationTexts = useDebounce(inputText, 500);

  useEffect(() => {
    parseTransactions();
  }, [bankNotificationTexts]);

  // Parse amount with shorthand notations (50k, 1.2M, 1M250, 1T)
  const parseAmount = (amountStr: string): number => {
    // Remove commas and spaces
    let cleanStr = amountStr.replace(/,/g, '').replace(/\s/g, '').toUpperCase();

    // Handle shorthand notations: k (thousand), M (million), T (billion)
    const multipliers: { [key: string]: number } = {
      'K': 1000,
      'M': 1000000,
      'T': 1000000000,
    };

    for (const [suffix, multiplier] of Object.entries(multipliers)) {
      if (cleanStr.includes(suffix)) {
        // Split by suffix to handle cases like "1M250" (1,250,000)
        const parts = cleanStr.split(suffix);
        const beforeSuffix = parseFloat(parts[0]) || 0;
        const afterSuffix = parseFloat(parts[1]) || 0;

        // Calculate total: (before * multiplier) + after
        return Math.round(beforeSuffix * multiplier + afterSuffix);
      }
    }

    // No suffix, just parse as number
    return parseInt(cleanStr) || 0;
  };

  // Parse date from text (supports formats like DD/MM, DD/MM/YYYY, DD-MM-YYYY)
  const parseDate = (text: string): string => {
    const currentYear = new Date().getFullYear();

    // Pattern: DD/MM/YYYY or DD-MM-YYYY
    const fullDateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);

    if (fullDateMatch) {
      const [, day, month, year] = fullDateMatch;

      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
    }

    // Pattern: DD/MM or DD-MM (assume current year)
    const shortDateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})/);

    if (shortDateMatch) {
      const [, day, month] = shortDateMatch;

      return new Date(`${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
    }

    // Default to current date
    return new Date().toISOString();
  };

  // Simple regex-based parsing for common bank patterns
  const parseTransactionText = async (text: string): Promise<Partial<TAddTransaction>> => {
    // Common Vietnamese bank notification patterns
    const patterns = [
      // Pattern: "TK 1234: -500,000VND luc 10:30 15/10. SD: 1,500,000VND"
      {
        regex: /TK\s*\d+:\s*([+-]?)([\d,\.]+[KkMmTt]?)\s*VND.*?(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{4})?)/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseAmount(match[2]),
          direction: (match[1] === '+' ? "in" : "out") as "in" | "out",
          description: `Transaction from ${text.substring(0, 50)}...`,
          date: parseDate(match[3]),
        })
      },
      // Pattern: "Chuyen khoan den: 500,000VND" or "Chuyen khoan den: 50k"
      {
        regex: /Chuyen khoan den:\s*([\d,\.]+[KkMmTt]?)\s*VND/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseAmount(match[1]),
          direction: "out" as "in" | "out",
          description: "Chuyển khoản đi",
          date: parseDate(text),
        })
      },
      // Pattern: "Nhan chuyen khoan: 1,000,000VND" or "Nhan chuyen khoan: 1M"
      {
        regex: /Nhan chuyen khoan:\s*([\d,\.]+[KkMmTt]?)\s*VND/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseAmount(match[1]),
          direction: "in" as "in" | "out",
          description: "Nhận chuyển khoản",
          date: parseDate(text),
        })
      },
      // Pattern: Simple amount detection with VND
      {
        regex: /([+-]?)([\d,\.]+[KkMmTt]?)\s*VND/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseAmount(match[2]),
          direction: (match[1] === '+' ? "in" : "out") as "in" | "out",
          description: text.substring(0, 100),
          date: parseDate(text),
        })
      },
      // Pattern: Simple amount detection without VND
      {
        regex: /([+-]?)([\d,\.]+[KkMmTt]?)/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseAmount(match[2]),
          direction: (match[1] === '+' ? "in" : "out") as "in" | "out",
          description: text.substring(0, 100),
          date: parseDate(text),
        })
      }
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);

      if (match) {
        return pattern.handler(match);
      }
    }

    return {
      amount: 0,
      direction: "out" as "in" | "out",
      description: text.substring(0, 100),
      date: new Date().toISOString(),
    };
  };

  const handleUpdateTxn = (index: number, updates: Partial<TAddTransaction>) => {
    setParsedTxn(prev =>
      prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
    );
  };

  const handleBulkUpdate = (updates: Partial<TAddTransaction>) => {
    if (selectedTxn.length === 0) return;

    setParsedTxn(prev =>
      prev.map((t, i) =>
        selectedTxn.includes(i) ? { ...t, ...updates } : t
      )
    );
  };

  const handleRemoveTxn = (index: number) => {
    setParsedTxn(prev => prev.filter((_, i) => i !== index));
    setSelectedTxn(prev => prev.filter(i => i !== index));
  };

  const handleSelectionChange = (selected: number[]) => {
    setSelectedTxn(selected);
  };

  const handleSubmit = () => {
    const validTransactions = parsedTxn.filter(
      t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0
    );

    if (validTransactions.length === 0) {
      addToast({
        color: "warning",
        title: "No valid transactions",
        description: "Please ensure all transactions have valid amounts and are assigned to a card.",
      });

      return;
    }

    createMultipleTransactions({
      body: {
        list_transactions: validTransactions.map(({ originalText: _originalText, parsingStatus: _parsingStatus, errorMessage: _errorMessage, ...transaction }) => transaction),
      },
    });
  };

  useEffect(() => {
    fetchCards();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (fetchCardsResult) {
      setCardOptions(fetchCardsResult?.results?.map((card: TCard) => ({
        key: card.card_id.toString(),
        label: card.card_name,
        startIcon: (
          <Image
            alt={`card ${card.card_id} bank logo`}
            className={"w-4"}
            height={1200}
            src={getBankLogo(card.bank_code, 1)}
            width={1200}
          />
        ),
      })) ?? [])
    }
  }, [fetchCardsResult]);

  useEffect(() => {
    if (fetchCategoriesResult) {
      setCategoryOptions(fetchCategoriesResult.results ?? []);
    }
  }, [fetchCategoriesResult]);

  useEffect(() => {
    if (createMultipleResult) {
      addToast({
        color: "success",
        title: "Success",
        description: createMultipleResult.message,
      });

      setInputText("");
      setParsedTxn([]);
      setSelectedTxn([]);
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    }

    if (createMultipleError) {
      const parseError = JSON.parse(createMultipleError);

      addToast({
        color: "danger",
        title: "Error",
        description: parseError.message || "Failed to create transactions",
      });
    }
  }, [createMultipleResult, createMultipleError]);

  useEffect(() => {
    if (!isOpen) {
      setInputText("");
      setParsedTxn([]);
      setSelectedTxn([]);
    }
  }, [isOpen]);

  const hasValidTransactions = parsedTxn.some(
    t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0
  );

  return (
    <CustomModal
      isOpen={isOpen}
      size="5xl"
      title="Add Multiple Transactions"
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-4">
        <Alert
          color="primary"
          description={inputText.length > 0 ?
            "Review and edit the parsed transactions below before submitting."
            : "Try pasting your bank notification texts and see how we parse them automatically."}
          title={`Found ${parsedTxn.length} transactions`}
        />
        <div className="w-full flex flex-col gap-2 border-r pr-4">
          <Textarea
            label="Bank Notification Texts"
            minRows={6}
            placeholder="Paste bank notification texts here, one per line...
Example:
TK 1234: -500,000VND luc 10:30 15/10. SD: 1,500,000VND
Nhan chuyen khoan: 1,000,000VND
Chuyen khoan den: 200,000VND"
            value={inputText}
            variant="bordered"
            onValueChange={setInputText}
          />
          <Button
            color="primary"
            isDisabled={!inputText.trim() || isParsing}
            isLoading={isParsing}
            onPress={parseTransactions}
          >
            {isParsing ? "Parsing..." : "Parse Transactions"}
          </Button>
        </div>

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
            selectedTransactions={selectedTxn}
            transactions={parsedTxn}
            onSelectionChange={handleSelectionChange}
            onTransactionRemove={handleRemoveTxn}
            onTransactionUpdate={handleUpdateTxn}
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-default-500">
              {hasValidTransactions
                ? `${parsedTxn.filter(t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0).length} valid transactions ready to submit`
                : "No valid transactions to submit"
              }
            </div>
            <Button
              color="success"
              isDisabled={!hasValidTransactions || creatingMultiple}
              isLoading={creatingMultiple}
              onPress={handleSubmit}
            >
              {creatingMultiple ? "Creating..." : `Create ${parsedTxn.filter(t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0).length} Transactions`}
            </Button>
          </div>
        </div>
      </div>
    </CustomModal>
  );
}
