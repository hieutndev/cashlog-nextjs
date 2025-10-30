"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/popover";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import clsx from "clsx";

import { isValidHexColor } from "@/utils/color-conversion";

interface ColorPickerProps {
	value: string;
	onChange: (color: string) => void;
	label?: string;
	size?: "sm" | "md" | "lg";
	disabled?: boolean;
}

export default function ColorPicker({
	value,
	onChange,
	label,
	size = "md",
	disabled = false,
}: ColorPickerProps) {
	const [hexInput, setHexInput] = useState(value);
	const [inputError, setInputError] = useState(false);

	const sizeClasses = {
		sm: "w-24 h-8",
		md: "w-28 h-10",
		lg: "w-32 h-12",
	};

	const handleHexInputChange = (input: string) => {
		setHexInput(input);

		// Validate and update if valid
		if (isValidHexColor(input)) {
			setInputError(false);
			onChange(input);
		} else if (input === "" || input.startsWith("#")) {
			// Show error but don't update value until valid
			setInputError(!isValidHexColor(input));
		}
	};

	const handleColorPickerChange = (color: string) => {
		setHexInput(color);
		setInputError(false);
		onChange(color);
	};

	return (
		<div className="flex flex-col gap-2">
			{label && <label className="text-sm font-medium">{label}</label>}
			<Popover>
				<PopoverTrigger asChild>
					<Button
						className={clsx("gap-2", sizeClasses[size])}
						isDisabled={disabled}
						variant="bordered"
					>
						<div
							className="w-5 h-5 rounded-md border border-gray-300"
							style={{ backgroundColor: value }}
						/>
						<span className="text-xs font-mono">{value}</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-4">
					<div className="flex flex-col gap-4 w-80">
						<div>
							<p className="text-sm font-medium mb-2">Pick a color</p>
							<HexColorPicker color={value} onChange={handleColorPickerChange} />
						</div>

						<div className="flex gap-2">
							<Input
								isRequired
								className="flex-1"
								errorMessage={inputError ? "Invalid HEX color format (#RRGGBB)" : undefined}
								isInvalid={inputError}
								label="HEX Color"
								labelPlacement="outside"
								placeholder="#6366F1"
								size="sm"
								value={hexInput}
								variant="bordered"
								onValueChange={handleHexInputChange}
							/>
							<Chip
								className="text-white mt-6"
								style={{ backgroundColor: value }}
							>
								<span className="font-mono text-sm">{value}</span>
							</Chip>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
