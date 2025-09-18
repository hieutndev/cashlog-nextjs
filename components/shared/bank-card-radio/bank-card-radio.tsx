import clsx from "clsx";
import React from "react";
import { Radio } from "@heroui/radio";
import Image from "next/image";

import { getBankLogo } from "@/configs/bank";
import { cutString } from "@/utils/text-transform";
import { TBankCode } from "@/types/bank";
import useScreenSize from "@/hooks/useScreenSize";
import { BREAK_POINT } from "@/configs/break-point";
import { TCard } from "@/types/card";
import { SITE_CONFIG } from "@/configs/site-config";

export interface AccountCardProps {
	card_id: TCard["card_id"];
	card_name: string;
	card_balance: number;
	bank_code: TBankCode;
}

export default function BankCardRadio({ card_id, card_name, card_balance, bank_code }: AccountCardProps) {
	const { width } = useScreenSize();

	return (
		<Radio
			classNames={{
				base: clsx(
					"inline-flex m-0 bg-transparent items-center justify-between h-max w-full",
					"flex-row cursor-pointer rounded-lg px-4 py-2 border-2 border-dark/50",
					"data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 hover:border-primary hover:bg-primary/10 rounded-2xl",

					{
						"max-w-sm": width <= BREAK_POINT.SM,
					}
				),
				wrapper: "rounded-xl h-3 w-3",
				control: "h-1.5 w-1.5",
			}}
			color={"primary"}
			value={card_id.toString()}
		>
			<div className={"sm:w-96 flex w-full sm:justify-between justify-start gap-2 items-center"}>
				<div className={"flex items-center gap-2"}>
					<p className={"text-sm min-w-max"}>{cutString(card_name, 12)}</p>
					<p className={"text-sm min-w-max"}>|</p>
					<p className={"text-sm"}>{card_balance.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}</p>
				</div>
				<Image
					alt={card_name}
					className={"w-max h-4"}
					height={1200}
					src={getBankLogo(bank_code, 1)}
					width={1200}
				/>
			</div>
		</Radio>
	);
}
