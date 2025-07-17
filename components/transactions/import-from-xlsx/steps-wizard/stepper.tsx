"use client";

import clsx from "clsx";
import { LuCheck, LuX } from "react-icons/lu";

import { EnhancedProgress } from "./enhanced-progress";

export interface Step {
	id: number;
	title: string;
	description?: string;
	status: "pending" | "current" | "completed" | "error";
}

interface StepperProps {
	steps: Step[];
}

export default function Stepper({ steps }: StepperProps) {
	const getStepIcon = (step: Step, index: number) => {
		switch (step.status) {
			case "completed":
				return <LuCheck className="w-4 h-4" />;
			case "error":
				return <LuX className="w-4 h-4" />;
			case "current":
				return <span className="text-sm font-semibold">{index + 1}</span>;
			default:
				return <span className="text-sm font-medium">{index + 1}</span>;
		}
	};

	const getStepStyles = (step: Step) => {
		const baseStyles = "transition-all duration-200";

		switch (step.status) {
			case "completed":
				return clsx(baseStyles, "bg-green-500 text-white border-green-500");
			case "current":
				return clsx(baseStyles, "bg-blue-500 text-white border-blue-500 ring-4 ring-blue-100");
			case "error":
				return clsx(baseStyles, "bg-red-500 text-white border-red-500");
			default:
				return clsx(baseStyles, "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200");
		}
	};

	const getConnectorStyles = (step: Step, nextStep?: Step) => {
		if (step.status === "completed" || (nextStep && nextStep.status !== "pending")) {
			return "bg-green-500";
		}

		return "bg-gray-200";
	};

	const calculateProgress = (steps: Step[]) => {
		const completedSteps = steps.filter((step) => step.status === "completed").length;
		const currentStepProgress = steps.some((step) => step.status === "current") ? 0.5 : 0;

		return ((completedSteps + currentStepProgress) / steps.length) * 100;
	};

	// Default variant with progress bar
	return (
		<div className="w-full space-y-4">
			{/* Progress Bar */}
			<div className="space-y-2">
				<EnhancedProgress
					animated={true}
					className="h-3"
					showGradient={true}
					value={calculateProgress(steps)}
				/>
			</div>

			{/* Steps */}
			<div className={clsx("flex items-start")}>
				{steps.map((step, index) => (
					<div
						key={step.id}
						className={clsx("flex flex-1")}
					>
						<div className={clsx("flex items-start")}>
							{/* Step Circle */}
							<div
								className={clsx(
									"w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 relative",
									getStepStyles(step)
								)}
							>
								{getStepIcon(step, index)}

								{/* Pulse animation for current step */}
								{step.status === "current" && (
									<div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
								)}
							</div>

							{/* Step Content */}
							<div className={clsx("ml-4")}>
								<h3
									className={clsx(
										"text-sm font-semibold transition-colors",
										step.status === "current" ? "text-primary-600" : "",
										step.status === "completed" ? "text-success-600" : "",
										step.status === "error" ? "text-danger-600" : "",
										step.status === "pending" ? "text-gray-500" : ""
									)}
								>
									{step.title}
								</h3>
								{step.description && (
									<p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
										{step.description}
									</p>
								)}
							</div>
						</div>
						{index < steps.length - 1 && (
							<div className="flex items-center px-4">
								<div className="relative w-full h-0.5">
									<div className="absolute inset-0 bg-gray-200 rounded-full" />
									<div
										className={clsx(
											"absolute inset-0 rounded-full transition-all duration-500",
											getConnectorStyles(step, steps[index + 1])
										)}
									/>
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
