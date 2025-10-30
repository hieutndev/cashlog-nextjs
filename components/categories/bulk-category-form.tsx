"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { Chip } from "@heroui/chip";

import { useCategoryFormEndpoint } from "@/hooks/useCategoryFormEndpoint";
import { ZodCustomError } from "@/types/zod";
import { getFieldError } from "@/utils/get-field-error";
import { ensureHexColor } from "@/utils/color-conversion";
import ColorPicker from "@/components/shared/color-picker";
import ICONS from "@/configs/icons";
import CustomForm from "../shared/form/custom-form";

export interface IBulkCategoryRow {
    id: string;
    category_name: string;
    color: string;
}

interface BulkCategoryFormProps {
    onSuccess?: () => void;
}

export default function BulkCategoryForm({ onSuccess }: BulkCategoryFormProps) {
    const { useCreateBulkCategories } = useCategoryFormEndpoint();
    const [rows, setRows] = useState<IBulkCategoryRow[]>([
        { id: "1", category_name: "", color: "#6366F1" },
    ]);

    const [validateErrors, setValidateErrors] = useState<ZodCustomError[]>([]);

    const createBulkHook = useCreateBulkCategories();
    const {
        data: formActionResult,
        loading: formActionLoading,
        error: formActionError,
        fetch: formAction,
    } = createBulkHook;

    useEffect(() => {
        if (formActionResult) {
            if (formActionResult.status === "success") {
                addToast({
                    title: "Success",
                    description: formActionResult.message,
                    color: "success",
                });

                resetForm();
                if (onSuccess) {
                    onSuccess();
                }
            }
        }

        if (formActionError) {
            const parseError = JSON.parse(formActionError);

            if (parseError.validateErrors) {
                setValidateErrors(parseError.validateErrors);
            } else {
                addToast({
                    color: "danger",
                    description: parseError.message || "An error occurred while creating categories.",
                    title: "Error",
                });
            }
        }
    }, [formActionResult, formActionError]);

    const resetForm = () => {
        setRows([{ id: "1", category_name: "", color: "#6366F1" }]);
        setValidateErrors([]);
    };

    const addRow = () => {
        const newId = (Math.max(...rows.map((r) => parseInt(r.id)), 0) + 1).toString();

        setRows([...rows, { id: newId, category_name: "", color: "#6366F1" }]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter((row) => row.id !== id));
        } else {
            addToast({
                title: "Info",
                description: "You need at least one category row.",
                color: "warning",
            });
        }
    };

    const updateRow = (id: string, field: keyof IBulkCategoryRow, value: string) => {
        setRows(
            rows.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const validateForm = (): boolean => {
        const emptyRows = rows.filter((row) => !row.category_name.trim());

        if (emptyRows.length > 0) {
            addToast({
                title: "Validation Error",
                description: "All category names are required. Please fill in all fields.",
                color: "warning",
            });

            return false;
        }

        const duplicateNames = rows
            .map((r) => r.category_name.trim().toLowerCase())
            .filter((name, index, arr) => arr.indexOf(name) !== index);

        if (duplicateNames.length > 0) {
            addToast({
                title: "Validation Error",
                description: `Duplicate category names found: ${Array.from(new Set(duplicateNames)).join(", ")}`,
                color: "warning",
            });

            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const payload = {
            categories: rows.map((row) => ({
                category_name: row.category_name.trim(),
                color: row.color,
            })),
        };

        formAction({
            body: payload,
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
                {rows.map((row) => (
                    <div key={row.id} className="flex flex-col gap-2 border border-gray-200 rounded-xl p-4">
                        <div className="flex gap-2 items-end">
                            <Input
                                isRequired
                                className="flex-1"
                                errorMessage={getFieldError(validateErrors, `categories.${row.id}.category_name`)?.message}
                                isInvalid={!!getFieldError(validateErrors, `categories.${row.id}.category_name`)}
                                label="Category Name"
                                labelPlacement="outside"
                                placeholder="Enter category name"
                                // size="lg"
                                value={row.category_name}
                                variant="bordered"
                                onValueChange={(value) =>
                                    updateRow(row.id, "category_name", value)
                                }
                            />

                            <ColorPicker
                                label="Color"
                                size="md"
                                value={ensureHexColor(row.color)}
                                onChange={(color) => updateRow(row.id, "color", color)}
                            />
                            <Button
                                isIconOnly
                                color="danger"
                                // size="lg"
                                variant="light"
                                onPress={() => removeRow(row.id)}
                            >
                                {ICONS.TRASH.MD}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full flex flex-col gap-4 border-t border-gray-200 pt-4">
                <Button
                    className="w-max"
                    color="primary"
                    startContent={ICONS.NEW.MD}
                    variant="bordered"
                    onPress={addRow}
                >
                    Add Row
                </Button>

                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Preview:</p>
                    <div className="flex flex-wrap gap-2">
                        {rows
                            .filter((row) => row.category_name.trim())
                            .map((row) => (
                                <Chip
                                    key={row.id}
                                    className="text-white"
                                    style={{ backgroundColor: ensureHexColor(row.color) }}
                                >
                                    {row.category_name}
                                </Chip>
                            ))}
                    </div>
                </div>
            </div>
            <Button
                fullWidth
                color="primary"
                isDisabled={formActionLoading}
                isLoading={formActionLoading}
                onPress={handleSubmit}
            >
                {formActionLoading ? "Creating..." : "Create Categories"}
            </Button>
        </div>
    );
}
