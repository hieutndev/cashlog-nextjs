"use client";

import { Chart as ChartJS, ArcElement, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { shortNumber } from "hieutndev-toolkit";
import { Tooltip } from "@heroui/tooltip";

import { SITE_CONFIG } from "@/configs/site-config";
import LoadingBlock from "@/components/shared/loading-block/loading-block";

ChartJS.register(ArcElement, Legend);

interface CategoryBreakdownChartProps {
    data: {
        category: string;
        color: string;
        total: number;
    }[];
    loading?: boolean;
}

export default function CategoryBreakdownChart({ data, loading = false }: CategoryBreakdownChartProps) {
    const generateColors = (categories: CategoryBreakdownChartProps["data"]) => {
        const colorMap: Record<string, string> = {
            red: "#ef4444",
            orange: "#f97316",
            amber: "#f59e0b",
            yellow: "#eab308",
            lime: "#84cc16",
            green: "#22c55e",
            emerald: "#10b981",
            teal: "#14b8a6",
            cyan: "#06b6d4",
            sky: "#0ea5e9",
            blue: "#3b82f6",
            indigo: "#6366f1",
            violet: "#8b5cf6",
            purple: "#a855f7",
            fuchsia: "#d946ef",
            pink: "#ec4899",
            rose: "#f43f5e",
            slate: "#64748b",
            gray: "#6b7280",
            zinc: "#71717a",
            neutral: "#737373",
            stone: "#78716c",
        };

        return categories.map(category => colorMap[category.color] || "#64748b");
    };

    const chartData = {
        labels: data.map(item => item.category),
        datasets: [
            {
                data: data.map(item => item.total),
                backgroundColor: generateColors(data).map(color => color + "40"), // 25% opacity for fill
                borderColor: generateColors(data), // Solid color for border
                borderWidth: 0.5,
                hoverBackgroundColor: generateColors(data).map(color => color + "80"), // 50% opacity on hover
                hoverBorderColor: generateColors(data),
                hoverBorderWidth: 1.5,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        
        plugins: {
            legend: {
                display: false, // Hide default legend since we'll use custom one
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        // Ensure parsed value is a number
                        const rawValue = context.parsed ?? 0;
                        const value = Number(rawValue) || 0;

                        // Safely get dataset array (works even if data items are strings)
                        const dataset = context.dataset ?? context.chart?.data?.datasets?.[context.datasetIndex];
                        const dataArr: any[] = (dataset && dataset.data) || [];

                        const total = dataArr.reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);

                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

                        return `${label}: ${Number(value).toLocaleString()}${SITE_CONFIG.CURRENCY_STRING} (${percentage}%)`;
                    }
                }
            }
        },
    };


    return (
        loading ? <LoadingBlock /> :
            data.length > 0 ? (
                <div className="flex flex-col items-center gap-8 w-full h-full">
                    <div className="w-full h-80 p-4">
                        <Pie data={chartData} options={options} />
                    </div>
                    {/* <div className="px-8 w-full h-full overflow-y-auto flex flex-row flex-wrap gap-4 items-center">
                        {data.map((item, index) => {
                            return (
                                <Tooltip
                                    key={item.category} className="flex items-center gap-2"
                                    content={`${Number(item.total).toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`}
                                    placement="top"
                                >
                                    <div className="w-max flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: colors[index] }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                {item.category}
                                            </span>
                                            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                                                (~{shortNumber(item.total, 1)})
                                            </span>
                                        </div>
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div> */}
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                        <p className="text-lg font-medium">No category data available</p>
                        <p className="text-sm">Start adding transactions with categories to see the breakdown</p>
                    </div>
                </div>)
    );
}
