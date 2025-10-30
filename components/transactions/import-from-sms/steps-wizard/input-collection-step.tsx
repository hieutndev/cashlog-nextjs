"use client";

import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Alert } from "@heroui/alert";
import Image from "next/image";
import { useState } from "react";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { useWindowSize } from "hieutndev-toolkit";

import { getBankLogo } from "@/configs/bank";
import { TCard } from "@/types/card";
import { FilterAndSortItem } from "@/types/global";
import { BREAK_POINT } from "@/configs/break-point";

interface InputCollectionStepProps {
  smsText: string;
  selectedCardId: number;
  cardOptions: FilterAndSortItem[];
  cards: TCard[];
  isLoading: boolean;
  manualText?: string;
  onSmsTextChange: (text: string) => void;
  onCardIdChange: (cardId: number) => void;
  onNext: () => void;
  onManualTextChange?: (text: string) => void;
  onManualInputSubmit?: () => void;
}

export default function InputCollectionStep({
  smsText,
  selectedCardId,
  cardOptions,
  cards,
  isLoading,
  manualText = "",
  onSmsTextChange,
  onCardIdChange,
  onNext,
  onManualTextChange,
  onManualInputSubmit,
}: InputCollectionStepProps) {
  const [inputMode, setInputMode] = useState<"sms" | "manual">("manual");

  const { width } = useWindowSize();

  const smsCharCount = smsText.length;
  const manualCharCount = manualText.length;
  const isValidSMS = smsText.trim().length > 0 && selectedCardId > 0;
  const isValidManual = manualText.trim().length > 0;
  const isValid = inputMode === "sms" ? isValidSMS : isValidManual;

  const handleNext = () => {
    if (inputMode === "sms") {
      onNext();
    } else {
      onManualInputSubmit?.();
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <Alert
        color="primary"
        description={
          inputMode === "sms"
            ? "Select a card and paste the SMS messages you received from your bank. We'll parse them automatically."
            : "Enter transactions manually using the pipe-delimited format. Each line represents one transaction."
        }
        title="Step 1: Input Collection"
      />

      {/* Input Mode Toggle */}
      <div className="w-full lg:max-w-2xl flex lg:justify-start justify-center gap-2">
        <Button
          className="flex-1"
          color={inputMode === "manual" ? "primary" : "default"}
          variant={inputMode === "manual" ? "solid" : "ghost"}
          onPress={() => setInputMode("manual")}
        >
          Manual Input
        </Button>
        <Button
          className="flex-1"
          color={inputMode === "sms" ? "primary" : "default"}
          variant={inputMode === "sms" ? "solid" : "ghost"}
          onPress={() => setInputMode("sms")}
        >
          SMS Import
        </Button>

      </div>

      {/* SMS Import Mode */}
      {inputMode === "sms" && (
        <div className="w-full flex flex-col gap-4">
          <Select
            label="Select Card"
            labelPlacement="outside"
            placeholder="Choose a card"
            renderValue={(items) => {
              return (
                <div className="flex items-center gap-2">
                  {items.map((item) => {
                    const card = cards.find(c => c.card_id.toString() === item.key);

                    return (
                      <div key={item.key} className="flex items-center gap-1">
                        {card && (
                          <Image
                            alt={`card ${card.card_id} bank logo`}
                            className={"w-4"}
                            height={1200}
                            src={getBankLogo(card.bank_code, 1)}
                            width={1200}
                          />
                        )}
                        {item.rendered}
                      </div>
                    );
                  })}
                </div>
              );
            }}
            selectedKeys={[selectedCardId.toString()]}
            variant="bordered"
            onChange={(e) => onCardIdChange(parseInt(e.target.value))}
          >
            {cardOptions.map((card) => {
              const cardData = cards.find(c => c.card_id.toString() === card.key);

              return (
                <SelectItem
                  key={card.key}
                  startContent={
                    cardData && (
                      <Image
                        alt={`card ${cardData.card_id} bank logo`}
                        className={"w-4"}
                        height={1200}
                        src={getBankLogo(cardData.bank_code, 1)}
                        width={1200}
                      />
                    )
                  }
                >
                  {card.label}
                </SelectItem>
              );
            })}
          </Select>

          <Textarea
            description={`${smsCharCount} characters`}
            label="SMS Messages"
            labelPlacement="outside"
            maxRows={20}
            minRows={20}
            placeholder="Paste SMS messages from your bank here. One message per line."
            value={smsText}
            variant="bordered"
            onValueChange={onSmsTextChange}
          />
        </div>
      )}

      {/* Manual Input Mode */}
      {inputMode === "manual" && (
        <div className="w-full flex lg:flex-row flex-col-reverse gap-4">
          <Textarea
            className="lg:w-2/3 w-full"
            description={`${manualCharCount} characters`}
            label="Manual Transactions"
            labelPlacement="outside"
            maxRows={20}
            minRows={20}
            placeholder="Enter transactions in the format shown above. One transaction per line."
            value={manualText}
            variant="bordered"
            onValueChange={onManualTextChange}
          />
          <div className="lg:w-1/3 w-full flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-lg p-4 lg:mt-6">
            <h6 className="text-base font-semibold text-blue-900">Format Instructions:</h6>
            <div className="flex flex-col gap-1">
              <p className=" text-sm text-blue-800">
                Each line represents one transaction with pipe-delimited fields:
              </p>
              <code className="text-sm  bg-white border border-blue-200 rounded p-2 block mb-3 overflow-x-auto">
                card_identifier | amount | date | description | category_name
              </code>
            </div>


            <div className="flex flex-col gap-2 text-sm text-blue-800 space-y-1">
              <p><Chip size="sm">card_identifier</Chip>: Full card number or some last digits (use <strong>*</strong> prefix for last digit match)</p>
              <p><Chip size="sm">amount</Chip>: <strong>Positive (+)</strong> for income, <strong>Negative (-)</strong> for expenses</p>
              <p><Chip size="sm">date</Chip>: Accept <strong>`YYYY-MM-DD`</strong>, <strong>`DD/MM/YYYY`</strong>, <strong>`DD/MM/YY`</strong>, <strong>`DD/MM`</strong> format</p>
              <p><Chip size="sm">description</Chip>: Transaction description</p>
              <p><Chip size="sm">category_name</Chip>: Exact category name</p>
            </div>

            <Divider />

            <h6 className="text-base  text-blue-900 font-semibold">Example:</h6>

            <code className="text-sm  bg-white border border-blue-200 rounded p-2 block">
              1234 |50000 | 2025-01-15 | Coffee | Food & Dining<br />
              *5678 | 1000000 | 2025-01-16 | Salary | Income
            </code>
          </div>
        </div>
      )}

      <div className="w-full flex justify-end gap-2">
        <Button
          color="primary"
          fullWidth={width < BREAK_POINT.LG}
          isDisabled={!isValid || isLoading}
          isLoading={isLoading}
          onPress={handleNext}
        >
          {isLoading ? "Parsing..." : "Next"}
        </Button>
      </div>
    </div>
  );
}

