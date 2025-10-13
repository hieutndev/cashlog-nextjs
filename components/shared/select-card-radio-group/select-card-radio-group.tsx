"use client";

import { RadioGroup } from "@heroui/radio";
import { Skeleton } from "@heroui/skeleton";

import BankCardRadio from "@/components/shared/bank-card-radio/bank-card-radio";
import HorizontalScrollContainer from "@/components/shared/horizontal-scroll-container/horizontal-scroll-container";
import { TCard } from "@/types/card";

interface SelectCardRadioGroupProps {
	label?: string;
	value: string | number;
	cards: TCard[];
	loading?: boolean;
	onValueChange: (value: string) => void;
	compact?: boolean;
}

export default function SelectCardRadioGroup({
	label = "Select Card",
	value,
	cards,
	loading = false,
	onValueChange,
	compact = true,
}: SelectCardRadioGroupProps) {
	return (
		<RadioGroup
			classNames={{
				wrapper: "flex flex-nowrap gap-4"
			}}
			label={label}
			orientation="horizontal"
			value={value.toString()}
			onValueChange={onValueChange}
		>
			<HorizontalScrollContainer className="flex flex-row gap-4 flex-nowrap">
				{loading ? (
					<Skeleton
						className="w-96 h-36 rounded-2xl flex justify-start items-center"
					/>
				) : (
					cards.map((card) => (
						<BankCardRadio
							key={card.card_id}
							bank_code={card.bank_code}
							card_balance={card.card_balance}
							card_color={card.card_color}
							card_id={card.card_id}
							card_name={card.card_name}
							compact={compact}
						/>
					))
				)}
			</HorizontalScrollContainer>
		</RadioGroup>
	);
}

