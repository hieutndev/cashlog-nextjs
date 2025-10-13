"use client"

import type { ZodCustomError } from "@/types/zod";

import { useEffect, useState } from "react";
import { useFetch } from "hieutndev-toolkit";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from '@internationalized/date';
import { addToast } from "@heroui/toast";
import moment from "moment";

import CustomForm from "../shared/form/custom-form";
import LoadingBlock from "../shared/loading-block/loading-block";

import { API_ENDPOINT } from "@/configs/api-endpoint";
import { IAPIResponse } from "@/types/global";
import { TCompleteInstanceFormData, TRecurringInstance } from "@/types/recurring";
import { TCategory } from "@/types/category";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import { SITE_CONFIG } from "@/configs/site-config";

interface RecurringInstanceFormProps {
    instanceId: TRecurringInstance['instance_id'];
    onSubmit?: (instanceId: TRecurringInstance['instance_id'], payload: TCompleteInstanceFormData) => void;
    isLoading?: boolean;
}

export default function RecurringInstanceForm({ instanceId, onSubmit, isLoading }: RecurringInstanceFormProps) {
    const [validateErrors, setValidateErrors] = useState<ZodCustomError[]>([]);
    const [formData, setFormData] = useState<TCompleteInstanceFormData>({
        actual_date: new Date().toISOString(),
        actual_amount: 0,
        notes: "",
        category_id: undefined,
    });

    // Fetch instance data
    const { data, error, fetch: fetchInstance, loading } = useFetch<IAPIResponse<TRecurringInstance>>(
        API_ENDPOINT.RECURRINGS.INSTANCES_BY_ID(instanceId),
        {
            skip: true,
        }
    );

    // Fetch categories
    const [listCategories, setListCategories] = useState<TCategory[]>([]);
    const { data: categoriesData, error: categoriesError, fetch: fetchCategories } = useFetch<IAPIResponse<TCategory[]>>(
        API_ENDPOINT.CATEGORIES.BASE,
        {
            skip: true,
        }
    );


    useEffect(() => {
        fetchInstance();
        fetchCategories();
    }, [instanceId]);

    useEffect(() => {
        if (data?.results) {
            const instance = data.results as TRecurringInstance & { category_id: number };

            setFormData({
                actual_date: instance.actual_date
                    ? new Date(instance.actual_date).toISOString()
                    : new Date().toISOString(),
                actual_amount: instance.actual_amount ?? instance.scheduled_amount,
                notes: instance.notes ?? "",
                category_id: instance.category_id,
            });
        }

        if (error) {
            const parseError = JSON.parse(error);

            addToast({
                color: "danger",
                title: "Error",
                description: parseError.message || "Failed to fetch instance data",
            });
        }
    }, [data, error]);

    useEffect(() => {
        if (categoriesData?.results) {
            setListCategories(categoriesData.results);
        }

        if (categoriesError) {
            const parseError = JSON.parse(categoriesError);

            addToast({
                color: "danger",
                title: "Error",
                description: parseError.message || "Failed to fetch categories",
            });
        }
    }, [categoriesData, categoriesError]);

    return (
        loading
            ? <LoadingBlock />
            : data?.results ? (
                <CustomForm
                    resetButtonIcon
                    className="w-full flex flex-col gap-4"
                    formId={`recurring-instance-form-${instanceId}`}
                    isLoading={isLoading}
                    loadingText="Completing..."
                    submitButtonText="Complete Instance"
                    onSubmit={() => {
                        if (onSubmit) {
                            onSubmit(instanceId, formData);
                        }
                    }}
                >
                    <DatePicker
                        disableAnimation
                        hideTimeZone
                        isRequired
                        showMonthAndYearPickers
                        aria-label="Actual Date"
                        description={`Default: ${moment(data.results.scheduled_date).format("MMM DD, YYYY")}`}
                        errorMessage={getFieldError(validateErrors, "actual_date")?.message}
                        isInvalid={!!getFieldError(validateErrors, "actual_date")}
                        label="Actual Date"
                        labelPlacement="outside"
                        value={parseDate(moment(formData.actual_date).format("YYYY-MM-DD"))}
                        variant="bordered"
                        onChange={(e) => {
                            setForm(
                                "actual_date",
                                new Date(e?.toString()!).toISOString() ?? new Date().toISOString(),
                                validateErrors,
                                setValidateErrors,
                                setFormData
                            );
                        }}
                    />

                    <Input
                        isRequired
                        description={`Default: ${data.results.scheduled_amount.toLocaleString()} ${SITE_CONFIG.CURRENCY_STRING}`}
                        endContent={SITE_CONFIG.CURRENCY_STRING}
                        errorMessage={getFieldError(validateErrors, "actual_amount")?.message}
                        isInvalid={!!getFieldError(validateErrors, "actual_amount")}
                        label="Actual Amount"
                        labelPlacement="outside"
                        placeholder="Enter actual amount"
                        type="number"
                        value={formData.actual_amount?.toString() ?? "0"}
                        variant="bordered"
                        onValueChange={(e) =>
                            setForm<TCompleteInstanceFormData>(
                                "actual_amount",
                                +e,
                                validateErrors,
                                setValidateErrors,
                                setFormData
                            )
                        }
                    />

                    <Select
                        description={data?.results ? `Default: ${(data.results as any).category_name || 'No category'}` : ''}
                        label="Category"
                        labelPlacement="outside"
                        placeholder="Select category"
                        selectedKeys={formData.category_id ? [formData.category_id.toString()] : []}
                        variant="bordered"
                        onChange={(e) =>
                            setForm<TCompleteInstanceFormData>(
                                "category_id",
                                e.target.value ? Number(e.target.value) : undefined,
                                validateErrors,
                                setValidateErrors,
                                setFormData
                            )
                        }
                    >
                        {listCategories.map((category) => (
                            <SelectItem
                                key={category.category_id}
                                className="capitalize"
                            >
                                {category.category_name}
                            </SelectItem>
                        ))}
                    </Select>

                    <Textarea
                        errorMessage={getFieldError(validateErrors, "notes")?.message}
                        isInvalid={!!getFieldError(validateErrors, "notes")}
                        label="Notes"
                        labelPlacement="outside"
                        placeholder="Enter any notes (optional)"
                        value={formData.notes}
                        variant="bordered"
                        onValueChange={(e) =>
                            setForm<TCompleteInstanceFormData>(
                                "notes",
                                e,
                                validateErrors,
                                setValidateErrors,
                                setFormData
                            )
                        }
                    />
                </CustomForm>)
                : <div className="p-4">No instance data found.</div>
    )
}