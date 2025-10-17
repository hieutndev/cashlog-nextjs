"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";
import { useFetch } from "hieutndev-toolkit";

import ParsedTransactionTable from "./parsed-transaction-table";
import BulkEditToolbar from "./bulk-edit-toolbar";

import CustomModal from "@/components/shared/custom-modal/custom-modal";
import { API_ENDPOINT } from "@/configs/api-endpoint";
import { TCrudTransaction } from "@/types/transaction";
import { IAPIResponse } from "@/types/global";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";


interface MultiTransactionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedTransaction extends TCrudTransaction {
  originalText: string;
  parsingStatus: "pending" | "success" | "error";
  errorMessage?: string;
}

export default function MultiTransactionModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: MultiTransactionModalProps) {
  const [inputText, setInputText] = useState("");
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [listCards, setListCards] = useState<TCard[]>([]);
  const [listCategories, setListCategories] = useState<TCategory[]>([]);

  // Handle bulk transaction creation
  const {
    data: createMultipleResult,
    loading: creatingMultiple,
    error: createMultipleError,
    fetch: createMultipleTransactions,
  } = useFetch<IAPIResponse>(API_ENDPOINT.TRANSACTIONS.CREATES, {
    method: "POST",
    skip: true,
  });

  // Fetch cards
  const {
    data: fetchCardsResult,
    fetch: fetchCards,
  } = useFetch<IAPIResponse<TCard[]>>(API_ENDPOINT.CARDS.BASE, {
    skip: true,
  });

  // Fetch categories
  const {
    data: fetchCategoriesResult,
    fetch: fetchCategories,
  } = useFetch<IAPIResponse<TCategory[]>>(API_ENDPOINT.CATEGORIES.BASE, {
    skip: true,
  });

  // Parse transactions from input text
  const parseTransactions = async () => {
    if (!inputText.trim()) return;

    setIsParsing(true);
    const lines = inputText.split('\n').filter(line => line.trim());

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

    setParsedTransactions(transactions);

    // Parse each transaction
    for (let i = 0; i < transactions.length; i++) {
      try {
        const parsed = await parseTransactionText(transactions[i].originalText);

        setParsedTransactions(prev =>
          prev.map((t, index) =>
            index === i
              ? { ...t, ...parsed, parsingStatus: "success" as const }
              : t
          )
        );
      } catch (error: unknown) {
        setParsedTransactions(prev =>
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

  // Simple regex-based parsing for common bank patterns
  const parseTransactionText = async (text: string): Promise<Partial<TCrudTransaction>> => {
    // Common Vietnamese bank notification patterns
    const patterns = [
      // Pattern: "TK 1234: -500,000VND luc 10:30 15/10. SD: 1,500,000VND"
      {
        regex: /TK\s*\d+:\s*([+-]?)([\d,]+)VND.*?(\d{1,2}\/\d{1,2})/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseInt(match[2].replace(/,/g, '')),
          direction: (match[1] === '+' ? "in" : "out") as "in" | "out",
          description: `Transaction from ${text.substring(0, 50)}...`,
        })
      },
      // Pattern: "Chuyen khoan den: 500,000VND"
      {
        regex: /Chuyen khoan den:\s*([\d,]+)VND/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseInt(match[1].replace(/,/g, '')),
          direction: "out" as "in" | "out",
          description: "Chuyển khoản đi",
        })
      },
      // Pattern: "Nhan chuyen khoan: 1,000,000VND"
      {
        regex: /Nhan chuyen khoan:\s*([\d,]+)VND/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseInt(match[1].replace(/,/g, '')),
          direction: "in" as "in" | "out",
          description: "Nhận chuyển khoản",
        })
      },
      // Pattern: Simple amount detection
      {
        regex: /([+-]?)([\d,]+)\s*VND/i,
        handler: (match: RegExpMatchArray) => ({
          amount: parseInt(match[2].replace(/,/g, '')),
          direction: (match[1] === '+' ? "in" : "out") as "in" | "out",
          description: text.substring(0, 100),
        })
      }
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);

      if (match) {
        return pattern.handler(match);
      }
    }

    // Fallback: Use OpenAI for complex parsing
    try {
      const response = await fetch(API_ENDPOINT.TRANSACTIONS.OPENAI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (response.ok) {
        const data = await response.json();

        return {
          amount: data.results?.transaction_amount || 0,
          direction: data.results?.direction || "out",
          description: data.results?.description || text.substring(0, 100),
          date: data.results?.transaction_date || new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("OpenAI parsing failed:", error);
    }

    // Final fallback
    return {
      amount: 0,
      direction: "out" as "in" | "out",
      description: text.substring(0, 100),
    };
  };

  // Handle transaction updates from the table
  const handleTransactionUpdate = (index: number, updates: Partial<TCrudTransaction>) => {
    setParsedTransactions(prev =>
      prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
    );
  };

  // Handle bulk transaction updates
  const handleBulkUpdate = (updates: Partial<TCrudTransaction>) => {
    if (selectedTransactions.length === 0) return;
    
    setParsedTransactions(prev =>
      prev.map((t, i) => 
        selectedTransactions.includes(i) ? { ...t, ...updates } : t
      )
    );
  };

  // Handle transaction removal
  const handleTransactionRemove = (index: number) => {
    setParsedTransactions(prev => prev.filter((_, i) => i !== index));
    // Remove from selected transactions if it was selected
    setSelectedTransactions(prev => prev.filter(i => i !== index));
  };

  // Handle selection change
  const handleSelectionChange = (selected: number[]) => {
    setSelectedTransactions(selected);
  };

  // Submit all valid transactions
  const handleSubmit = () => {
    const validTransactions = parsedTransactions.filter(
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
        list_transactions: validTransactions.map(({ originalText, parsingStatus, errorMessage, ...transaction }) => transaction),
      },
    });
  };

  // Fetch cards and categories on mount
  useEffect(() => {
    fetchCards();
    fetchCategories();
  }, []);

  // Update cards and categories state
  useEffect(() => {
    if (fetchCardsResult) {
      setListCards(fetchCardsResult.results ?? []);
    }
  }, [fetchCardsResult]);

  useEffect(() => {
    if (fetchCategoriesResult) {
      setListCategories(fetchCategoriesResult.results ?? []);
    }
  }, [fetchCategoriesResult]);

  // Handle creation result
  useEffect(() => {
    if (createMultipleResult) {
      addToast({
        color: "success",
        title: "Success",
        description: `Created ${createMultipleResult.results?.success_count || 0} transactions successfully`,
      });

      // Reset form and close modal
      setInputText("");
      setParsedTransactions([]);
      setSelectedTransactions([]);
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    }

    if (createMultipleError) {
      const parseError = JSON.parse(createMultipleError);

      addToast({
        color: "danger",
        title: "Error",
        description: parseError.message || "Failed to create transactions",
      });
    }
  }, [createMultipleResult, createMultipleError, onOpenChange, onSuccess]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInputText("");
      setParsedTransactions([]);
      setSelectedTransactions([]);
    }
  }, [isOpen]);

  const hasValidTransactions = parsedTransactions.some(
    t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0
  );

  return (
    <CustomModal
      isOpen={isOpen}
      size="full"
      title="Add Multiple Transactions"
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-4">
        {/* Input Section */}
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
        {/* Parsing Results */}
        {parsedTransactions.length > 0 ? (
          <div className="w-full flex flex-col gap-4">
            <Alert
              color="primary"
              description="Review and edit the parsed transactions below before submitting."
              title={`Found ${parsedTransactions.length} transactions`}
            />

            {selectedTransactions.length > 0 && (
              <BulkEditToolbar
                listCards={listCards}
                listCategories={listCategories}
                selectedCount={selectedTransactions.length}
                onBulkUpdate={handleBulkUpdate}
              />
            )}

            <ParsedTransactionTable
              selectedTransactions={selectedTransactions}
              transactions={parsedTransactions}
              onSelectionChange={handleSelectionChange}
              onTransactionRemove={handleTransactionRemove}
              onTransactionUpdate={handleTransactionUpdate}
            />

            {/* Submit Section */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-default-500">
                {hasValidTransactions
                  ? `${parsedTransactions.filter(t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0).length} valid transactions ready to submit`
                  : "No valid transactions to submit"
                }
              </div>
              <Button
                color="success"
                isDisabled={!hasValidTransactions || creatingMultiple}
                isLoading={creatingMultiple}
                onPress={handleSubmit}
              >
                {creatingMultiple ? "Creating..." : `Create ${parsedTransactions.filter(t => t.parsingStatus === "success" && t.amount > 0 && t.card_id > 0).length} Transactions`}
              </Button>
            </div>
          </div>
        ) : <p className="w-full text-center text-default-500">No transactions to display</p>}
      </div>
    </CustomModal>
  );
}
