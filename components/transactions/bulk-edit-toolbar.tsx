"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { Chip } from "@heroui/chip";
import { parseDate } from '@internationalized/date';
import moment from "moment";

import { TCrudTransaction } from "@/types/transaction";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";

interface BulkEditToolbarProps {
  selectedCount: number;
  onBulkUpdate: (updates: Partial<TCrudTransaction>) => void;
  listCards: TCard[];
  listCategories: TCategory[];
}

type BulkEditField = "card" | "category" | "direction" | "date" | "description" | "";

export default function BulkEditToolbar({
  selectedCount,
  onBulkUpdate,
  listCards,
  listCategories,
}: BulkEditToolbarProps) {
  const [selectedField, setSelectedField] = useState<BulkEditField>("");
  const [cardValue, setCardValue] = useState<string>("");
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [directionValue, setDirectionValue] = useState<"in" | "out" | "">("");
  const [dateValue, setDateValue] = useState<string>("");
  const [descriptionValue, setDescriptionValue] = useState<string>("");

  const handleApply = () => {
    if (selectedField === "") return;

    let updates: Partial<TCrudTransaction> = {};

    switch (selectedField) {
      case "card":
        if (cardValue) {
          updates.card_id = parseInt(cardValue);
        }
        break;
      case "category":
        if (categoryValue === "-1") {
          updates.category_id = null;
        } else if (categoryValue) {
          updates.category_id = parseInt(categoryValue);
        }
        break;
      case "direction":
        if (directionValue) {
          updates.direction = directionValue;
        }
        break;
      case "date":
        if (dateValue) {
          updates.date = new Date(dateValue).toISOString();
        }
        break;
      case "description":
        if (descriptionValue) {
          updates.description = descriptionValue;
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      onBulkUpdate(updates);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedField("");
    setCardValue("");
    setCategoryValue("");
    setDirectionValue("");
    setDateValue("");
    setDescriptionValue("");
  };

  const canApply = selectedField !== "" && selectedCount > 0;

  return (
    <div className="bg-default-50 border border-default-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Chip color="primary" variant="flat">
            {selectedCount} selected
          </Chip>
          <span className="text-sm text-default-600">Select a field to bulk edit:</span>
        </div>
        {selectedField && (
          <Button size="sm" color="danger" variant="flat" onPress={resetForm}>
            Cancel
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <Select
          className="w-48"
          label="Field to edit"
          placeholder="Select field"
          selectedKeys={selectedField ? [selectedField] : []}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as BulkEditField;
            setSelectedField(key || "");
          }}
        >
          <SelectItem key="card">Card</SelectItem>
          <SelectItem key="category">Category</SelectItem>
          <SelectItem key="direction">Transaction Type</SelectItem>
          <SelectItem key="date">Date</SelectItem>
          <SelectItem key="description">Description</SelectItem>
        </Select>

        {selectedField === "card" && (
          <Select
            className="w-48"
            label="Select Card"
            placeholder="Choose card"
            selectedKeys={cardValue ? [cardValue] : []}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;
              setCardValue(key || "");
            }}
          >
            {listCards.map((card) => (
              <SelectItem key={card.card_id.toString()} textValue={card.card_name}>
                {card.card_name}
              </SelectItem>
            ))}
          </Select>
        )}

        {selectedField === "category" && (
          <Select
            className="w-48"
            label="Select Category"
            placeholder="Choose category"
            selectedKeys={categoryValue ? [categoryValue] : []}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;
              setCategoryValue(key || "");
            }}
          >
            {[
              <SelectItem key="-1" textValue="No category">
                No category
              </SelectItem>,
              ...listCategories.map((category) => (
                <SelectItem key={category.category_id.toString()} textValue={category.category_name}>
                  {category.category_name}
                </SelectItem>
              ))
            ]}
          </Select>
        )}

        {selectedField === "direction" && (
          <Select
            className="w-48"
            label="Transaction Type"
            placeholder="Choose type"
            selectedKeys={directionValue ? [directionValue] : []}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as "in" | "out";
              setDirectionValue(key || "");
            }}
          >
            <SelectItem key="in" textValue="In">
              In
            </SelectItem>
            <SelectItem key="out" textValue="Out">
              Out
            </SelectItem>
          </Select>
        )}

        {selectedField === "date" && (
          <DatePicker
            className="w-48"
            label="Transaction Date"
            value={dateValue ? parseDate(moment(dateValue).format("YYYY-MM-DD")) : undefined}
            onChange={(date) => {
              if (date) {
                setDateValue(date.toString());
              }
            }}
          />
        )}

        {selectedField === "description" && (
          <Input
            className="w-48"
            label="Description"
            placeholder="Enter description"
            value={descriptionValue}
            onValueChange={setDescriptionValue}
          />
        )}

        {selectedField && (
          <Button
            color="primary"
            isDisabled={!canApply}
            onPress={handleApply}
          >
            Apply to {selectedCount} transactions
          </Button>
        )}
      </div>
    </div>
  );
}
