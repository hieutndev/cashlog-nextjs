import clsx from "clsx";
import Image from "next/image";

import { getBankLogo } from "@/configs/bank";
import { TColor } from "@/types/global";
import { TBankCode } from "@/types/bank";
import { SITE_CONFIG } from "@/configs/site-config";

interface BankCardProps {
	cardName: string;
	cardBalance: number;
	color: TColor;
	bankCode?: TBankCode;
	className?: string;
	cardNumber?: string;
}

export default function BankCard({ cardName, cardBalance, color, bankCode = "VIETCOMBANK", className, cardNumber }: BankCardProps) {

	return (
		<div
			className={clsx(
				"overflow-hidden p-8 h-56 rounded-2xl relative text-white transition-transform transform bg-gradient-to-br sm:max-w-96 md:max-w-88 lg:max-w-92 xl:max-w-full w-full",
				`bankcard-${color}`,
				className,
			)}
		>
			{/* background bank logo: variant 1, absolute right, scaled to 75% of container height */}
			<Image
				alt="Bank Logo"
				aria-hidden="true"
				className="absolute -right-0 top-1/2 -translate-y-1/2 h-full w-auto scale-150 opacity-25 pointer-events-none select-none"
				height={1000}
				priority={false}
				src={getBankLogo(bankCode, 1)}
				width={1000}
			/>
			<div className="relative w-full h-full flex items-end">
				<div className="flex flex-col gap-2">
					<p className="text-left text-md uppercase font-semibold">{cardName} {cardNumber && `- ${cardNumber}`}</p>
					<h1 className="text-4xl font-bold text-white z-0 pointer-events-none">
						{cardBalance.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}
					</h1>
				</div>
			</div>
		</div>
	);
}
