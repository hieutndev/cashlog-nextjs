"use client";

import { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { parseDate } from '@internationalized/date';
import moment from "moment";

import { useCategoryEndpoint } from "@/hooks/useCategoryEndpoint";
import { TAddTransaction } from "@/types/transaction";
import { TCategory } from "@/types/category";
import ICONS from "@/configs/icons";
import { SITE_CONFIG } from "@/configs/site-config";


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

interface EditingCell {
  rowIndex: number;
  field: "amount" | "date" | "category_id" | "description" | null;
}

export default function ParsedTransactionTable({
  transactions,
  onTransactionUpdate,
  onTransactionRemove,
  selectedTransactions,
  onSelectionChange,
}: ParsedTransactionTableProps) {
  const [listCategories, setListCategories] = useState<TCategory[]>([]);
  const [editingCell, setEditingCell] = useState<EditingCell>({ rowIndex: -1, field: null });

  const { useGetCategories } = useCategoryEndpoint();

  // Fetch categories
  const {
    data: fetchCategoriesResult,
    fetch: fetchCategories,
  } = useGetCategories();

  useEffect(() => {
    fetchCategories();
  }, []);


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

  // Format amount with currency
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`;
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId || categoryId === -1) return "No category";
    const category = listCategories.find(c => c.category_id === categoryId);

    return category?.category_name || "No category";
  };

  const allSelected = transactions.length > 0 && selectedTransactions.length === transactions.length;
  const someSelected = selectedTransactions.length > 0 && !allSelected;

  // Handle select all toggle
  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all
      onSelectionChange(transactions.map((_, index) => index));
    }
  };

  const isEditing = (rowIndex: number, field: "card_id" | "amount" | "date" | "category_id" | "description") => {
    return editingCell.rowIndex === rowIndex && editingCell.field === field;
  };

  const startEditing = (rowIndex: number, field: "amount" | "date" | "category_id" | "description") => {
    setEditingCell({ rowIndex, field });
  };

  const stopEditing = () => {
    setEditingCell({ rowIndex: -1, field: null });
  };

  const columns = [
    { key: "checkbox", label: "" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "date", label: "Date" },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {transactions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-default-100 rounded-lg border border-default-200">
          <Checkbox
            isIndeterminate={someSelected}
            isSelected={allSelected}
            onValueChange={handleSelectAll}
          />
          <span className="text-sm text-default-700 font-medium">
            {allSelected
              ? `All ${transactions.length} transactions selected`
              : someSelected
                ? `${selectedTransactions.length} of ${transactions.length} transactions selected`
                : `Select all ${transactions.length} transactions`
            }
          </span>
        </div>
      )}

      <div className="">
        <Table
          isHeaderSticky
          // shadow="none"
          aria-label="Parsed transactions table"
          className="max-h-96"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                align={column.key === "actions" ? "center" : "start"}
                className={column.key === "checkbox" ? "w-12" : ""}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="text-center py-8 text-default-500">
                No transactions to display
              </div>
            }
            items={transactions.map((t, idx) => ({ ...t, _index: idx }))}
          >
            {(transaction: ParsedTransaction & { _index: number }) => {
              const rowIndex = transaction._index;

              return (
                <TableRow key={`row-${rowIndex}`}>
                  {(columnKey) => {
                    switch (columnKey) {
                      case "checkbox":
                        return (
                          <TableCell>
                            <Checkbox
                              isSelected={selectedTransactions.includes(rowIndex)}
                              onValueChange={(isSelected) => handleSelectionChange(rowIndex, isSelected)}
                            />
                          </TableCell>
                        );

                      case "type":
                        return (
                          <TableCell>
                            <Button
                              className="min-w-16"
                              color={transaction.direction === "in" ? "success" : "danger"}
                              size="sm"
                              variant="flat"
                              onPress={() => {
                                onTransactionUpdate(rowIndex, {
                                  direction: transaction.direction === "in" ? "out" : "in"
                                });
                              }}
                            >
                              {transaction.direction === "in" ? "Income" : "Expense"}
                            </Button>
                          </TableCell>
                        );

                      case "amount":
                        return (
                          <TableCell>
                            {isEditing(rowIndex, "amount") ? (
                              <Input
                                className="w-32"
                                endContent={SITE_CONFIG.CURRENCY_STRING}
                                placeholder="0"
                                size="sm"
                                type="number"
                                value={transaction.amount?.toString() ?? "0"}
                                variant="bordered"
                                onBlur={stopEditing}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") stopEditing();
                                  if (e.key === "Escape") stopEditing();
                                }}
                                onValueChange={(e) =>
                                  onTransactionUpdate(rowIndex, { amount: parseInt(e) || 0 })
                                }
                              />
                            ) : (
                              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/jsx-sort-props
                              <div
                                className="cursor-pointer px-2 py-1 rounded hover:bg-default-100 transition-colors"
                                role="button"
                                tabIndex={0}
                                onBlur={() => { }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(rowIndex, "amount");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    startEditing(rowIndex, "amount");
                                  }
                                }}
                              >
                                {formatAmount(transaction.amount)}
                              </div>
                            )}
                          </TableCell>
                        );

                      case "date":
                        return (
                          <TableCell>
                            {isEditing(rowIndex, "date") ? (
                              <DatePicker
                                hideTimeZone
                                showMonthAndYearPickers
                                aria-label="Date"
                                className="w-40"
                                size="sm"
                                value={parseDate(moment(transaction.date).format("YYYY-MM-DD"))}
                                variant="bordered"
                                onChange={(date) => {
                                  onTransactionUpdate(rowIndex, {
                                    date: new Date(date?.toString()!).toISOString() || new Date().toISOString()
                                  });
                                  stopEditing();
                                }}
                              />
                            ) : (
                              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/jsx-sort-props
                              <div
                                className="cursor-pointer px-2 py-1 rounded hover:bg-default-100 transition-colors"
                                role="button"
                                tabIndex={0}
                                onBlur={() => { }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(rowIndex, "date");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    startEditing(rowIndex, "date");
                                  }
                                }}
                              >
                                {moment(transaction.date).format("DD/MM/YYYY")}
                              </div>
                            )}
                          </TableCell>
                        );

                      case "category": {
                        const categoryOptions = [
                          { category_id: -1, category_name: "No category" },
                          ...listCategories
                        ];

                        return (
                          <TableCell>
                            {isEditing(rowIndex, "category_id") ? (
                              <Select
                                className="w-40"
                                items={categoryOptions}
                                placeholder="Select category"
                                selectedKeys={[transaction.category_id?.toString() ?? "-1"]}
                                size="sm"
                                variant="bordered"
                                onBlur={stopEditing}
                                onClick={(e) => e.stopPropagation()}
                                onSelectionChange={(keys) => {
                                  const key = Array.from(keys)[0] as string;

                                  onTransactionUpdate(rowIndex, {
                                    category_id: key === "-1" ? null : parseInt(key)
                                  });
                                  stopEditing();
                                }}
                              >
                                {(category) => (
                                  <SelectItem
                                    key={category.category_id.toString()}
                                    textValue={category.category_name}
                                  >
                                    {category.category_name}
                                  </SelectItem>
                                )}
                              </Select>
                            ) : (
                              <div
                                className="cursor-pointer px-2 py-1 rounded hover:bg-default-100 transition-colors"
                                role="button"
                                tabIndex={0}
                                onBlur={() => { }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(rowIndex, "category_id");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    startEditing(rowIndex, "category_id");
                                  }
                                }}
                              >
                                {getCategoryName(transaction.category_id)}
                              </div>
                            )}
                          </TableCell>
                        );
                      }

                      case "description":
                        return (
                          <TableCell>
                            {isEditing(rowIndex, "description") ? (
                              <Input
                                className="min-w-48"
                                placeholder="Enter description"
                                size="sm"
                                type="text"
                                value={transaction.description ?? ""}
                                variant="bordered"
                                onBlur={stopEditing}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") stopEditing();
                                  if (e.key === "Escape") stopEditing();
                                }}
                                onValueChange={(value) =>
                                  onTransactionUpdate(rowIndex, { description: value })
                                }
                              />
                            ) : (
                              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/jsx-sort-props
                              <div
                                className="cursor-pointer px-2 py-1 rounded hover:bg-default-100 transition-colors min-w-48"
                                role="button"
                                tabIndex={0}
                                onBlur={() => { }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(rowIndex, "description");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    startEditing(rowIndex, "description");
                                  }
                                }}
                              >
                                {transaction.description || <span className="text-default-400 italic">Click to add description</span>}
                              </div>
                            )}
                          </TableCell>
                        );

                      case "actions":
                        return (
                          <TableCell>
                            <Button
                              isIconOnly
                              color="danger"
                              size="sm"
                              variant="flat"
                              onPress={() => onTransactionRemove(rowIndex)}
                            >
                              {ICONS.TRASH.SM}
                            </Button>
                          </TableCell>
                        );

                      default:
                        return <TableCell>-</TableCell>;
                    }
                  }}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
