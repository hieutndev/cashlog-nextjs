"use client";

import React, { useEffect } from "react";
import { Button, ButtonProps } from "@heroui/button";

import ICONS from "@/configs/icons";

interface CustomFormProps {
	formId: string;
	className?: string;
	onSubmit?: () => void;
	onReset?: () => void;
	submitButtonText?: string;
	resetButtonText?: string;
	resetButtonIcon?: boolean;
	isLoading?: boolean;
	loadingText?: string;
	disableSubmitButton?: boolean;
	submitButtonSize?: ButtonProps["size"];
	resetButtonSize?: ButtonProps["size"];
	children: React.ReactNode;
}

export default function CustomForm({
	formId,
	className,
	onSubmit,
	onReset,
	submitButtonText = "Submit",
	resetButtonText = "Reset",
	resetButtonIcon = false,
	isLoading = false,
	loadingText = "Submitting...",
	disableSubmitButton = false,
	submitButtonSize = "md",
	resetButtonSize = "md",
	children,
}: CustomFormProps) {
	// Ref to avoid duplicate submits (works across renders)
	const submittingRef = React.useRef(false);
	// Timer ref to reset guard in case `isLoading` isn't updated
	const guardTimerRef = React.useRef<number | null>(null);

	const clearGuardTimer = () => {
		if (guardTimerRef.current) {
			window.clearTimeout(guardTimerRef.current);
			guardTimerRef.current = null;
		}
	};

	const guardedSubmit = () => {
		if (submittingRef.current) return;
		submittingRef.current = true;
		onSubmit?.();
		// Safety: clear guard after 3 seconds if isLoading isn't toggled
		clearGuardTimer();
		guardTimerRef.current = window.setTimeout(() => {
			submittingRef.current = false;
			guardTimerRef.current = null;
		}, 3000);
	};

	useEffect(() => {
		// When external loading state becomes false, allow future submits
		if (!isLoading) {
			submittingRef.current = false;
			clearGuardTimer();
		}
	}, [isLoading]);

	const handleKeyDown = (event: KeyboardEvent) => {
		// ignore if modifier keys used
		if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;

		// don't intercept Enter in textarea or contenteditable elements
		const target = event.target as HTMLElement | null;

		if (target) {
			const tag = target.tagName?.toLowerCase();

			if (tag === "textarea" || target.isContentEditable) {
				return;
			}
		}

		event.preventDefault();
		guardedSubmit();
	};

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			clearGuardTimer();
		};
	}, [onSubmit, isLoading]);

	return (
		<div
			className={className}
			id={formId}
		>
			{children}
			<div className="flex gap-2">
				<Button
					fullWidth
					color={"primary"}
					isDisabled={isLoading || disableSubmitButton}
					isLoading={isLoading}
					size={submitButtonSize}
					type={"submit"}
					onPress={guardedSubmit}
				>
					{isLoading ? loadingText : submitButtonText}
				</Button>
				{onReset && (
					<Button
						color={"default"}
						disabled={isLoading}
						isIconOnly={resetButtonIcon}
						size={resetButtonSize}
						type="reset"
						onPress={onReset}
					>
						{resetButtonIcon ? ICONS.RESET.MD : resetButtonText}
					</Button>
				)}
			</div>
		</div>
	);
}
