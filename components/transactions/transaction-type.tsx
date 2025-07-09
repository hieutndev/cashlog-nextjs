import clsx from "clsx";
import {Radio, RadioProps} from "@heroui/radio";
import React from "react";

import {TTransaction} from "@/types/transaction";
import SYS_ICONS from "@/configs/icons";

interface TransactionTypeProps {
    type: TTransaction["direction"];
}

export default function TransactionType({type}: TransactionTypeProps) {
    const TypeColor: Record<TTransaction["direction"], RadioProps["color"]> = {
        out: "danger",
        in: "success",
    };

    return (
        <Radio
            classNames={{
                base: clsx(
                    "inline-flex m-0 bg-transparent items-center justify-between",
                    "w-full cursor-pointer rounded-xl gap-1 px-4 py-1.5 border-2",
                    {
                        "data-[selected=true]:border-success/40 data-[selected=true]:bg-success/30 border-success/20 hover:bg-success/10":
                            type === "in",
                        "data-[selected=true]:border-danger/40 data-[selected=true]:bg-danger/30 border-danger/20 hover:bg-danger/10":
                            type === "out"
                    }
                ),
                wrapper: clsx("h-3 w-3 border-2", {
                    "border-success/20": type === "in",
                    "border-danger/20": type === "out"
                }),
                control: "h-1.5 w-1.5",
                label: "text-sm"
            }}
            color={TypeColor[type]}
            value={type}
        >
            <div className={"flex gap-2 items-center capitalize"}>
                {type === "in" ? SYS_ICONS.INCOME.MD : SYS_ICONS.EXPENSE.MD}
                {type}
            </div>
        </Radio>
    );
}
