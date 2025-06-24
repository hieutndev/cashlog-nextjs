import clsx from "clsx";
import Image from "next/image";

import { getBankLogo } from "@/configs/bank";
import { TColor } from "@/types/global";
import { TBankCode } from "@/types/bank";
import useScreenSize from "@/hooks/useScreenSize";
import { BREAK_POINT } from "@/configs/break-point";

interface BankCardProps {
	cardName: string;
	cardBalance: number;
	color: TColor;
	bankCode?: TBankCode;
	className?: string;
}

export default function BankCard({ cardName, cardBalance, color, bankCode = "VIETCOMBANK", className }: BankCardProps) {
	const { width } = useScreenSize();

	return (
		<div
			className={clsx(
				"h-56 rounded-2xl relative text-white transition-transform transform bg-gradient-to-br",
				`bankcard-${color}`,
				className,
				{
					"w-full max-w-96": width < BREAK_POINT.S,
					"w-96": width >= BREAK_POINT.S,
				}
			)}
		>
			<div className={"absolute top-8 right-8"}>
				<Image
					alt={"Bank Logo"}
					className={"w-24 h-auto"}
					height={1200}
					src={getBankLogo(bankCode, 2)}
					width={1200}
				/>
			</div>
			<div className="w-full h-full p-8 flex flex-col justify-end gap-4">
				<p className="text-xl font-medium tracking-widest">{cardName}</p>
				<h1 className="font-semibold text-2xl">{cardBalance.toLocaleString()} VND</h1>
			</div>
		</div>
	);
}
