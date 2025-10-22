"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { SITE_CONFIG } from "@/configs/site-config";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface FinancialAnalysisChartProps {
    data: {
        income: (number | null)[];
        expenses: (number | null)[];
        savings: (number | null)[];
        months: string[];
    } | null;
    error?: string | null;
}

export default function FinancialAnalysisChart({ data }: FinancialAnalysisChartProps) {
    const formatCurrency = (value: number) => {
        return `${value.toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`;
    };

    const expensesData: (number | null)[] = (data?.expenses || []).map((v) => {
        if (v === null || v === undefined) return null;

        return -Math.abs(v);
    });

    const chartData = {
        labels: data?.months || [],
        datasets: [
            {
                label: "Income",
                data: data?.income || [],
                backgroundColor: "rgba(34, 197, 94, 0.4)", // 40% opacity for fill
                borderColor: "#22c55e", // Solid color for border
                borderWidth: 1,
                stack: "stack0",
            },
            {
                label: "Expenses",
                data: expensesData,
                backgroundColor: "rgba(239, 68, 68, 0.4)", // 40% opacity for fill
                borderColor: "#ef4444", // Solid color for border
                borderWidth: 1,
                stack: "stack0",
            },
            {
                label: "Savings",
                data: data?.savings || [],
                backgroundColor: "rgba(234, 179, 8, 0.4)", // 40% opacity for fill
                borderColor: "#eab308", // Solid color for border
                borderWidth: 1,
                stack: "stack1",
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
                stacked: true,
                // hide x-axis grid lines
                grid: {
                    display: false,
                },
            },
            y: {
                stacked: true,
                grid: {
                    color: (ctx: any) => {
                        const v = ctx?.tick?.value;

                        return v === 0 ? 'rgba(0,0,0,0.06)' : 'transparent';
                    },
                    drawBorder: false,
                },
                ticks: {
                    stepSize: 2000000,
                    callback: (value: any) => {
                        if (value === null || value === undefined) return '';
                        const num = Number(value) / 1000000;

                        return `${num.toLocaleString()}M`;
                    },
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
            <Bar data={chartData} options={options} />
        </div>

    );
}