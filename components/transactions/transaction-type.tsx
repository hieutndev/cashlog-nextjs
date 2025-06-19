import clsx from "clsx";
import { Radio, RadioProps } from "@heroui/radio";
import React from "react";

import { TTransactionType } from "@/types/transaction";

interface TransactionTypeProps {
  type: TTransactionType;
}

export default function TransactionType({ type }: TransactionTypeProps) {
  const TypeColor: Record<TTransactionType, RadioProps["color"]> = {
    receive: "success",
    repay_received: "success",
    borrow: "success",
    lend: "danger",
    spend: "danger",
    repay_sent: "danger",
    init: "default"
  };

  return (
    <Radio
      classNames={{
        base: clsx(
          "inline-flex m-0 bg-transparent items-center justify-between",
          "w-full cursor-pointer rounded-xl gap-1 px-4 py-1.5 border-2",
          {
            "data-[selected=true]:border-success/40 data-[selected=true]:bg-success/30 border-success/20 hover:bg-success/10":
              ["receive", "repay_received", "borrow"].includes(type),
            "data-[selected=true]:border-danger/40 data-[selected=true]:bg-danger/30 border-danger/20 hover:bg-danger/10":
              ["spend", "repay_sent", "lend"].includes(type)
          }
        ),
        wrapper: clsx("h-3 w-3 border-2", {
          "border-success/20": ["receive", "repay_received", "borrow"].includes(
            type
          ),
          "border-danger/20": ["spend", "repay_sent", "lend"].includes(type)
        }),
        control: "h-1.5 w-1.5",
        label: "text-sm"
      }}
      color={TypeColor[type]}
      value={type}
    >
      <div className={"flex gap-2 items-center capitalize"}>
        {/*{type === "income" ? <FaArrowTrendUp /> : <FaArrowTrendDown />}{" "}*/}
        {type.replace("_", " ").toLowerCase()}
      </div>
    </Radio>
  );
}
