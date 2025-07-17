"use client";

import clsx from "clsx";

interface EnhancedProgressProps {
	value: number;
	className?: string;
	showGradient?: boolean;
	animated?: boolean;
}

export function EnhancedProgress({ value, className, showGradient = true, animated = true }: EnhancedProgressProps) {
	return (
		<div className={clsx("w-full bg-gray-200 rounded-full h-3 overflow-hidden", className)}>
			<div
				className={clsx(
					"h-full rounded-full transition-all duration-700 ease-out relative",
					showGradient
						? "bg-gradient-to-r from-success-500 from-25% via-primary-600 to-primary-500"
						: "bg-success-500",
					animated && "transition-transform"
				)}
				style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
			>
				{/* Shine effect */}
				{animated && value > 0 && (
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
				)}

				{/* Completion glow */}
				{value >= 100 && (
					<div className="absolute inset-0 bg-green-400 animate-pulse opacity-50 rounded-full" />
				)}
			</div>
		</div>
	);
}
