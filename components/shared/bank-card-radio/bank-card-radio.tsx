import clsx from "clsx";
import React from "react";
import { Radio } from "@heroui/radio";
import { useWindowSize } from "hieutndev-toolkit";

import BankCard from "../bank-card/bank-card";

import { TBankCode } from "@/types/bank";
import { BREAK_POINT } from "@/configs/break-point";
import { TCard } from "@/types/card";


export interface AccountCardProps {
	card_id: TCard["card_id"];
	card_name: string;
	card_balance: number;
	bank_code: TBankCode;
	card_color: TCard["card_color"];
	compact?: boolean;
}

export default function BankCardRadio({ card_id, card_name, card_balance, bank_code, card_color, compact = false }: AccountCardProps) {
	const { width } = useWindowSize();

	return (
		<Radio
			classNames={{
				base: clsx(
					"m-0 bg-transparent items-center justify-between",
					"flex-row cursor-pointer rounded-lg p-0 opacity-20 transition-opacity duration-200",
					"data-[selected=true]:opacity-100 hover:opacity-100 rounded-lg",

					{
						"max-w-sm": width <= BREAK_POINT.SM,
					}
				),
				wrapper: "hidden",
				control: "hidden",
				labelWrapper: clsx("sm-0", {
					"w-64": compact,
					"w-96": !compact
					
				})
			}}
			color={"primary"}
			value={card_id.toString()}
		>
			<BankCard
				bankCode={bank_code}
				cardBalance={card_balance}
				cardName={card_name}
				className={compact ? "!h-36 !p-3 !rounded-xl [&_p]:!text-xs [&_p]:truncate [&_h1]:!text-xl [&>div]:gap-1" : "h-36 !p-4 !rounded-xl"}
				color={card_color}
			/>
		</Radio>
	);
}
