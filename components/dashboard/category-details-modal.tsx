"use client";

import { useState } from "react";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";

import CustomModal from "@/components/shared/custom-modal/custom-modal";
import { TCategoryBreakdown } from "@/types/dashboard";
import { SITE_CONFIG } from "@/configs/site-config";

interface CategoryDetailsModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    data: TCategoryBreakdown[];
}

const categoryColumns = [
    { key: "category", label: "Category" },
    { key: "income", label: "Total Income" },
    { key: "expense", label: "Total Expense" },
];

type SortOption = "income" | "expense";

export default function CategoryDetailsModal({
    isOpen,
    onOpenChange,
    data,
}: CategoryDetailsModalProps) {
    const [sortBy, setSortBy] = useState<"income" | "expense">("income");

    const colorMap: Record<string, string> = {
        red: "#ef4444", orange: "#f97316", amber: "#f59e0b", yellow: "#eab308",
        lime: "#84cc16", green: "#22c55e", emerald: "#10b981", teal: "#14b8a6",
        cyan: "#06b6d4", sky: "#0ea5e9", blue: "#3b82f6", indigo: "#6366f1",
        violet: "#8b5cf6", purple: "#a855f7", fuchsia: "#d946ef", pink: "#ec4899",
        rose: "#f43f5e", slate: "#64748b", gray: "#6b7280", zinc: "#71717a",
        neutral: "#737373", stone: "#78716c",
    };

    const sortedData = [...data].sort((a, b) => {
        if (sortBy === "income") {
            return (b.income || 0) - (a.income || 0);
        } else {
            return (b.expense || 0) - (a.expense || 0);
        }
    });

    const renderCell = (item: TCategoryBreakdown, columnKey: React.Key) => {
        switch (columnKey) {
            case "category":
                return (
                    <Chip
                        className="text-white"
                        style={{
                            backgroundColor: colorMap[item.color] || "#64748b",
                        }}
                    >
                        {item.category}
                    </Chip>
                );

            case "income":
                return (
                    <span className="text-green-600 font-medium">
                        {Number(item.income || 0).toLocaleString()}
                        {SITE_CONFIG.CURRENCY_STRING}
                    </span>
                );

            case "expense":
                return (
                    <span className="text-red-600 font-medium">
                        {Number(item.expense || 0).toLocaleString()}
                        {SITE_CONFIG.CURRENCY_STRING}
                    </span>
                );

            default:
                return <span>{getKeyValue(item, columnKey as string)}</span>;
        }
    };

    return (
        <CustomModal
            isOpen={isOpen}
            size="4xl"
            title="Category Breakdown Details"
            onOpenChange={onOpenChange}
        >
            <div className="flex flex-col gap-4">
                {/* Sort Options */}
                <Select
                    className="w-48"
                    label="Sort by"
                    selectedKeys={[sortBy]}
                    onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as "income" | "expense";

                        setSortBy(selected);
                    }}
                >
                    <SelectItem key="income">
                        Total Income (Descending)
                    </SelectItem>
                    <SelectItem key="expense">
                        Total Expense (Descending)
                    </SelectItem>
                </Select>

                {/* Category Breakdown Table */}
                <Table
                    isHeaderSticky
                    removeWrapper
                    aria-label="Category breakdown table"
                    classNames={{
                        th: "bg-gray-100/10 text-gray-600 font-bold text-xs uppercase",
                        td: "py-4",
                    }}
                >
                    <TableHeader columns={categoryColumns}>
                        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                    </TableHeader>
                    <TableBody
                        emptyContent="No category data available"
                        items={sortedData}
                    >
                        {(item) => (
                            <TableRow key={item.category}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CustomModal>
    );
}

