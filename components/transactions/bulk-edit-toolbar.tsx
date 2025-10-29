"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { DatePicker } from "@heroui/date-picker";
import { Chip } from "@heroui/chip";
import { parseDate } from '@internationalized/date';
import moment from "moment";

import { TAddTransaction } from "@/types/transaction";
import { TCategory } from "@/types/category";
import { FilterAndSortItem } from "@/types/global";

interface BulkEditToolbarProps {
  selectedCount: number;
  onBulkUpdate: (updates: Partial<TAddTransaction>) => void;
  listCards: FilterAndSortItem[];
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

    let updates: Partial<TAddTransaction> = {};

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
    <div className="flex flex-col gap-4 p-4 bg-default-50 border border-default-200 rounded-2xl">
      <div className="w-full flex items-center gap-4">
        <div className="flex items-center gap-4">
          <Chip color="primary" size="sm" variant="flat">
            {selectedCount} selected
          </Chip>
          <span className="text-sm text-default-600">Select a field to bulk edit:</span>
        </div>
        {/* {selectedField && (
          <Button color="danger" size="sm" variant="flat" onPress={resetForm}>
            Cancel
          </Button>
        )} */}
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <Select
          className="w-48"
          placeholder="Select field"
          selectedKeys={selectedField ? [selectedField] : []}
          size="sm"
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
            items={listCards}
            placeholder="Choose card"
            renderValue={(cards) => (
              <div className="flex items-center gap-2">
                {cards.map((card, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1"
                  >
                    {card.props?.startContent}
                    {card.rendered}
                  </div>
                ))}
              </div>
            )}
            selectedKeys={cardValue ? [cardValue] : []}

            size="sm"
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;

              setCardValue(key || "");
            }}
          >
            {(card) => (
              <SelectItem
                key={card.key}
                startContent={card.startIcon}
              >
                {card.label}
              </SelectItem>
            )}
          </Select>
        )}

        {selectedField === "category" && (
          <Select
            className="w-48"
            placeholder="Choose category"
            selectedKeys={categoryValue ? [categoryValue] : []}
            size="sm"
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
            placeholder="Choose type"
            selectedKeys={directionValue ? [directionValue] : []}
            size="sm"
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
            size="sm"
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
            placeholder="Enter description"
            size="sm"
            value={descriptionValue}
            onValueChange={setDescriptionValue}
          />
        )}

        {selectedField && (
          <Button
            color="primary"
            isDisabled={!canApply}
            size="sm"
            onPress={handleApply}
          >
            Apply
          </Button>
        )}
      </div>
    </div>
  );
}
