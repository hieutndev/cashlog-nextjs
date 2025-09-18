"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface LineChartProps {
    data: {
        income: (number | null)[];
        expenses: (number | null)[];
        savings: (number | null)[];
        months: string[];
    } | null;
    loading?: boolean;
    error?: string | null;
    className?: string;
}

export default function FinancialLineChart({ data, loading = false, className }: LineChartProps) {
    const formatCurrency = (value: number) => {
        return `${value.toLocaleString()}{SITE_CONFIG.CURRENCY_STRING}`;
    };

    const chartData = {
        labels: data?.months || [],
        datasets: [
            {
                label: "Income",
                data: data?.income || [],
                borderColor: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                borderWidth: 2,
                pointBackgroundColor: "#22c55e",
                pointRadius: 4,
                pointHoverRadius: 8,
                tension: 0,
                fill: false,
                spanGaps: false,
            },
            {
                label: "Expenses",
                data: data?.expenses || [],
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderWidth: 2,
                pointBackgroundColor: "#ef4444",
                pointRadius: 4,
                pointHoverRadius: 8,
                tension: 0,
                fill: false,
                spanGaps: false,
            },
            {
                label: "Savings",
                data: data?.savings || [],
                borderColor: "#eab308",
                backgroundColor: "rgba(234, 179, 8, 0.1)",
                borderWidth: 2,
                pointBackgroundColor: "#eab308",
                pointRadius: 4,
                pointHoverRadius: 8,
                tension: 0,
                fill: false,
                spanGaps: false,
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
        plugins: {
            title: {
                display: false,
            },
            legend: {
                display: true,
                position: "top" as const,
                align: "end" as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: "circle",
                    padding: 24,
                    boxWidth: 12,
                    boxHeight: 12,
                    font: {
                        size: 12,
                        weight: 500,
                    },
                },
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

    if (loading) {
        return (
            <Card className={clsx("w-full", className)} shadow="sm">
                <CardBody className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <Spinner size="lg" />
                        <p className="text-sm text-gray-500">Loading chart data...</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (

        <Card>
            <CardBody>
            <Line data={chartData} options={options} />
            </CardBody>
        </Card>

    );
}