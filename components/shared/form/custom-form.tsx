import React from "react";
import { Button, ButtonProps } from "@heroui/button";

import SYS_ICONS from "@/config/icons";

interface CustomFormProps {
	formId: string;
	className?: string;
	onSubmit?: () => void;
	onReset?: () => void;
	submitButtonText?: string;
	resetButtonText?: string;
	resetButtonIcon?: boolean;
	isLoading?: boolean;
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
	disableSubmitButton = false,
	submitButtonSize = "md",
	resetButtonSize = "md",
	children,
}: CustomFormProps) {
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
					onPress={onSubmit}
				>
					{isLoading ? "Submitting..." : submitButtonText}
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
						{resetButtonIcon ? SYS_ICONS.RESET.MD : resetButtonText}
					</Button>
				)}
			</div>
		</div>
	);
}
