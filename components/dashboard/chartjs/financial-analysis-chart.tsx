"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";

import { SITE_CONFIG } from "@/configs/site-config";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

interface FinancialAnalysisChartProps {
    data: {
        income: (number | null)[];
        expenses: (number | null)[];
        savings: (number | null)[];
        total_assets: (number | null)[];
        months: string[];
    } | null;
    totalAssetData?: {
        date: string;
        total_asset: number;
    }[] | null;
    error?: string | null;
}

export default function FinancialAnalysisChart({ data }: FinancialAnalysisChartProps) {
    const formatCurrency = (value: number) => {
        return `${value.toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`;
    };

    // Convert all values to positive (absolute values)
    const incomeData: (number | null)[] = (data?.income || []).map((v) => {
        if (v === null || v === undefined) return null;

        return Math.abs(v);
    });

    const expensesData: (number | null)[] = (data?.expenses || []).map((v) => {
        if (v === null || v === undefined) return null;

        return Math.abs(v);
    });

    const totalAssetsLineData: (number | null)[] = (data?.total_assets || []).map((v) => {
        if (v === null || v === undefined) return null;

        return Math.abs(v);
    });

    const chartData = {
        labels: data?.months || [],
        datasets: [
            {
                type: "bar" as const,
                label: "Income",
                data: incomeData,
                backgroundColor: "rgba(34, 197, 94, 0.4)", // 40% opacity for fill
                borderColor: "#22c55e", // Solid color for border
                borderWidth: 1,
                order: 2,
            },
            {
                type: "bar" as const,
                label: "Expenses",
                data: expensesData,
                backgroundColor: "rgba(239, 68, 68, 0.4)", // 40% opacity for fill
                borderColor: "#ef4444", // Solid color for border
                borderWidth: 1,
                order: 2,
            },
            {
                type: "line" as const,
                label: "Total Asset",
                data: totalAssetsLineData,
                borderColor: "#3b82f6", // Blue color for line
                backgroundColor: "rgba(59, 130, 246, 0.1)", // Light fill under line
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: "#3b82f6",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                tension: 0.4,
                order: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index" as const,
            intersect: false,
        },
        scales: {
            x: {
                // hide x-axis grid lines
                grid: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                min: 0,
                grid: {
                    color: (ctx: any) => {
                        const v = ctx?.tick?.value;

                        return v === 0 ? 'rgba(0,0,0,0.06)' : 'transparent';
                    },
                    drawBorder: false,
                },
                ticks: {
                    callback: (value: any) => {
                        if (value === null || value === undefined) return '';
                        const num = Number(value);

                        // Format based on magnitude
                        if (num >= 1000000) {
                            return `${(num / 1000000).toFixed(1)}M`;
                        } else if (num >= 1000) {
                            return `${(num / 1000).toFixed(1)}K`;
                        }

                        return num.toLocaleString();
                    },
                    maxTicksLimit: 6,
                },
            },
        },
        plugins: {
            title: {
                display: true,
            },
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleColor: "white",
                bodyColor: "white",
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                    label: function (context: any) {
                        const value = context.parsed.y;

                        if (value === null || value === undefined) {
                            return `${context.dataset.label}: No data`;
                        }

                        return `${context.dataset.label}: ${formatCurrency(value)}`;
                    },
                },
            },
        },
    };

    return (
        <div className="w-full h-80">
            <Chart
                data={chartData}
                options={options}
                type="bar"
            />
        </div>
    );
}