"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Checkbox } from "@heroui/checkbox";
import { useFetch } from "hieutndev-toolkit";
import { parseDate } from '@internationalized/date';
import moment from "moment";

import { API_ENDPOINT } from "@/configs/api-endpoint";
import { TCrudTransaction } from "@/types/transaction";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";
import { IAPIResponse } from "@/types/global";
import TransactionType from "./transaction-type";

interface ParsedTransaction extends TCrudTransaction {
  originalText: string;
  parsingStatus: "pending" | "success" | "error";
  errorMessage?: string;
}

interface ParsedTransactionTableProps {
  transactions: ParsedTransaction[];
  onTransactionUpdate: (index: number, updates: Partial<TCrudTransaction>) => void;
  onTransactionRemove: (index: number) => void;
  selectedTransactions: number[];
  onSelectionChange: (selected: number[]) => void;
}

export default function ParsedTransactionTable({
  transactions,
  onTransactionUpdate,
  onTransactionRemove,
  selectedTransactions,
  onSelectionChange,
}: ParsedTransactionTableProps) {
  const [listCard, setListCard] = useState<TCard[]>([]);
  const [listCategories, setListCategories] = useState<TCategory[]>([]);

  // Fetch cards
  const {
    data: fetchCardsResult,
    loading: loadingCards,
    error: fetchCardsError,
    fetch: fetchCards,
  } = useFetch<IAPIResponse<TCard[]>>(API_ENDPOINT.CARDS.BASE, {
    skip: true,
  });

  // Fetch categories
  const {
    data: fetchCategoriesResult,
    error: fetchCategoriesError,
    fetch: fetchCategories,
  } = useFetch<IAPIResponse<TCategory[]>>(API_ENDPOINT.CATEGORIES.BASE, {
    skip: true,
  });

  useEffect(() => {
    fetchCards();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (fetchCardsResult) {
      setListCard(fetchCardsResult.results ?? []);
    }
  }, [fetchCardsResult]);

  useEffect(() => {
    if (fetchCategoriesResult) {
      setListCategories(fetchCategoriesResult.results ?? []);
    }
  }, [fetchCategoriesResult]);

  const getStatusColor = (status: ParsedTransaction["parsingStatus"]) => {
    switch (status) {
      case "success": return "success";
      case "error": return "danger";
      case "pending": return "warning";
      default: return "default";
    }
  };

  const getStatusText = (status: ParsedTransaction["parsingStatus"]) => {
    switch (status) {
      case "success": return "Success";
      case "error": return "Error";
      case "pending": return "Parsing";
      default: return "Unknown";
    }
  };

  const handleSelectionChange = (index: number, isSelected: boolean) => {
    if (isSelected) {
      onSelectionChange([...selectedTransactions, index]);
    } else {
      onSelectionChange(selectedTransactions.filter(i => i !== index));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      onSelectionChange(transactions.map((_, index) => index));
    } else {
      onSelectionChange([]);
    }
  };

  const isAllSelected = transactions.length > 0 && selectedTransactions.length === transactions.length;
  const isSomeSelected = selectedTransactions.length > 0 && selectedTransactions.length < transactions.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table aria-label="Parsed transactions table">
        <TableHeader>
          <TableColumn width={50}>
            <Checkbox
              isSelected={isAllSelected}
              isIndeterminate={isSomeSelected}
              onValueChange={handleSelectAll}
            />
          </TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Original Text</TableColumn>
          <TableColumn>Card</TableColumn>
          <TableColumn>Type</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Category</TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow key={index}>
              <TableCell>
                <Checkbox
                  isSelected={selectedTransactions.includes(index)}
                  onValueChange={(isSelected) => handleSelectionChange(index, isSelected)}
                />
              </TableCell>
              <TableCell>
                <Chip 
                  color={getStatusColor(transaction.parsingStatus)}
                  size="sm"
                >
                  {getStatusText(transaction.parsingStatus)}
                </Chip>
                {transaction.errorMessage && (
                  <div className="text-xs text-danger mt-1">
                    {transaction.errorMessage}
                  </div>
                )}
              </TableCell>
              
              <TableCell className="max-w-xs">
                <div className="text-sm text-default-500 truncate">
                  {transaction.originalText}
                </div>
              </TableCell>

              <TableCell>
                {loadingCards ? (
                  <Spinner size="sm" />
                ) : (
                  <Select
                    size="sm"
                    selectedKeys={new Set([transaction.card_id?.toString() || "0"])}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      onTransactionUpdate(index, { card_id: parseInt(selectedKey) });
                    }}
                  >
                    {listCard.map((card) => (
                      <SelectItem key={card.card_id} textValue={card.card_name}>
                        {card.card_name}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </TableCell>

              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    color={transaction.direction === "in" ? "success" : "default"}
                    variant={transaction.direction === "in" ? "solid" : "flat"}
                    onPress={() => onTransactionUpdate(index, { direction: "in" })}
                  >
                    In
                  </Button>
                  <Button
                    size="sm"
                    color={transaction.direction === "out" ? "danger" : "default"}
                    variant={transaction.direction === "out" ? "solid" : "flat"}
                    onPress={() => onTransactionUpdate(index, { direction: "out" })}
                  >
                    Out
                  </Button>
                </div>
              </TableCell>

              <TableCell>
                <Input
                  size="sm"
                  type="number"
                  value={transaction.amount?.toString() || "0"}
                  onValueChange={(value) => 
                    onTransactionUpdate(index, { amount: parseInt(value) || 0 })
                  }
                />
              </TableCell>

              <TableCell>
                <DatePicker
                  size="sm"
                  value={parseDate(moment(transaction.date).format("YYYY-MM-DD"))}
                  onChange={(date) => {
                    onTransactionUpdate(index, { 
                      date: new Date(date?.toString()!).toISOString() || new Date().toISOString()
                    });
                  }}
                />
              </TableCell>

              <TableCell>
                <Select
                  size="sm"
                  selectedKeys={new Set([transaction.category_id?.toString() || "-1"])}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    onTransactionUpdate(index, { 
                      category_id: selectedKey === "-1" ? null : parseInt(selectedKey)
                    });
                  }}
                >
                  {listCategories.map((category) => (
                    <SelectItem key={category.category_id} textValue={category.category_name}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </Select>
              </TableCell>

              <TableCell>
                <Input
                  size="sm"
                  value={transaction.description || ""}
                  onValueChange={(value) => 
                    onTransactionUpdate(index, { description: value })
                  }
                />
              </TableCell>

              <TableCell>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => onTransactionRemove(index)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
