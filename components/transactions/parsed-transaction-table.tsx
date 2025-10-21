"use client";

import { useState, useEffect } from "react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Checkbox } from "@heroui/checkbox";
import { RadioGroup } from "@heroui/radio";
import { parseDate } from '@internationalized/date';
import moment from "moment";

import { useCardEndpoint } from "@/hooks/useCardEndpoint";
import { useCategoryEndpoint } from "@/hooks/useCategoryEndpoint";
import { TAddTransaction } from "@/types/transaction";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";
import ICONS from "@/configs/icons";
import { SITE_CONFIG } from "@/configs/site-config";
import TransactionType from "@/components/transactions/transaction-type";
import SelectCardRadioGroup from "@/components/shared/select-card-radio-group/select-card-radio-group";


interface ParsedTransaction extends TAddTransaction {
  originalText: string;
  parsingStatus: "pending" | "success" | "error";
  errorMessage?: string;
}

interface ParsedTransactionTableProps {
  transactions: ParsedTransaction[];
  onTransactionUpdate: (index: number, updates: Partial<TAddTransaction>) => void;
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
  const { useGetListCards } = useCardEndpoint();
  const { useGetCategories } = useCategoryEndpoint();

  // Fetch cards
  const {
    data: fetchCardsResult,
    loading: loadingCards,
    fetch: fetchCards,
  } = useGetListCards();

  // Fetch categories
  const {
    data: fetchCategoriesResult,
    fetch: fetchCategories,
  } = useGetCategories();

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

  const handleSelectionChange = (index: number, isSelected: boolean) => {
    if (isSelected) {
      onSelectionChange([...selectedTransactions, index]);
    } else {
      onSelectionChange(selectedTransactions.filter(i => i !== index));
    }
  };

  // Get direction display info
  const getDirectionInfo = (direction: "in" | "out") => {
    if (direction === "in") {
      return {
        color: "success" as const,
        label: "In",
      };
    }

    return {
      color: "danger" as const,
      label: "Out",
    };
  };

  // Format amount with currency
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`;
  };

  // Get card name by ID
  const getCardName = (cardId: number) => {
    const card = listCard.find(c => c.card_id === cardId);

    return card?.card_name || "Select card";
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId || categoryId === -1) return "No category";
    const category = listCategories.find(c => c.category_id === categoryId);

    return category?.category_name || "No category";
  };

  if (loadingCards) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg">Loading cards and categories...</Spinner>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Accordion selectionMode="multiple" variant="splitted">
        {transactions.map((transaction, index) => {
          const hasCard = transaction.card_id > 0;
          const hasDate = !!transaction.date;

          return (
            <AccordionItem
              key={index}
              classNames={{
                // base: "border rounded-lg",
                title: "flex items-center gap-2 flex-wrap",
              }}
              startContent={
                <Checkbox
                  isSelected={selectedTransactions.includes(index)}
                  onValueChange={(isSelected) => handleSelectionChange(index, isSelected)}
                />
              }
              title={
                <div className="flex items-center justify-between gap-2 flex-1">
                  {/* Left side - Chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Chip
                      color={hasCard ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {getCardName(transaction.card_id)}
                    </Chip>
                    <Chip
                      color={hasDate ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {moment(transaction.date).format("DD/MM/YYYY")}
                    </Chip>

                    <Chip
                      color={transaction.amount > 0 ? "success" : "danger"}
                      size="sm"
                      variant="flat"
                    >
                      {transaction.direction === "in" ? "+ " : "- "}{formatAmount(transaction.amount)}
                    </Chip>



                    <Chip
                      size="sm"
                      variant="flat"
                    >
                      {getCategoryName(transaction.category_id)}
                    </Chip>
                  </div>

                  {/* Right side - Delete button */}
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="flat"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTransactionRemove(index);
                    }}
                  >
                    {ICONS.TRASH.SM}
                  </Button>
                </div>
              }
            >
              <div className="w-full flex flex-col gap-4 p-4">
                {/* Card Selection */}
                <SelectCardRadioGroup
                  compact
                  cards={listCard}
                  label="From Account"
                  value={transaction.card_id ?? 0}
                  onValueChange={(e) =>
                    onTransactionUpdate(index, { card_id: parseInt(e) })
                  }
                />

                <RadioGroup
                  isRequired
                  classNames={{
                    wrapper: "min-w-max flex flex-row items-center gap-2",
                  }}
                  label="Transaction Type"
                  value={transaction.direction}
                  onValueChange={(e) => {
                    onTransactionUpdate(index, { direction: e as "in" | "out" });
                  }}
                >
                  <TransactionType key="in" type="in" />
                  <TransactionType key="out" type="out" />
                </RadioGroup>
                <div className="w-full flex flex-row items-start gap-4">
                  {/* Transaction Type */}


                  {/* Amount */}
                  <Input
                    isRequired
                    endContent={SITE_CONFIG.CURRENCY_STRING}
                    label="Amount"
                    labelPlacement="outside"
                    placeholder="Enter amount"
                    type="number"
                    value={transaction.amount?.toString() ?? "0"}
                    variant="bordered"
                    onValueChange={(e) =>
                      onTransactionUpdate(index, { amount: parseInt(e) || 0 })
                    }
                    className="w-48"
                  />
                  <Select
                    className="w-48"
                    items={listCategories}
                    label="Select category"
                    labelPlacement="outside"
                    placeholder="Select category"
                    selectedKeys={[transaction.category_id?.toString() ?? "-1"]}
                    variant="bordered"
                    onChange={(e) =>
                      onTransactionUpdate(index, {
                        category_id: parseInt(e.target.value)
                      })
                    }
                  >
                    {(category) => (
                      <SelectItem
                        key={category.category_id}
                        textValue={category.category_name}
                      >
                        {category.category_name}
                      </SelectItem>
                    )}
                  </Select>

                  <DatePicker
                    disableAnimation
                    hideTimeZone
                    isRequired
                    showMonthAndYearPickers
                    aria-label="Date"
                    className="w-48"
                    label="Transaction Date"
                    labelPlacement="outside"
                    value={parseDate(moment(transaction.date).format("YYYY-MM-DD"))}
                    variant="bordered"
                    onChange={(date) => {
                      onTransactionUpdate(index, {
                        date: new Date(date?.toString()!).toISOString() || new Date().toISOString()
                      });
                    }}
                  />
                </div>

                {/* Description */}
                <Textarea
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Enter description"
                  value={transaction.description?.toString()}
                  variant="bordered"
                  onValueChange={(e) =>
                    onTransactionUpdate(index, { description: e })
                  }
                />

                {/* Error Message */}
                {transaction.errorMessage && (
                  <div className="text-sm text-danger">
                    {transaction.errorMessage}
                  </div>
                )}
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
