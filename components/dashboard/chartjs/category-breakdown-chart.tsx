"use client";

import { Chart as ChartJS, ArcElement, Legend, Plugin } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { SITE_CONFIG } from "@/configs/site-config";
import LoadingBlock from "@/components/shared/loading-block/loading-block";

ChartJS.register(ArcElement, Legend);

// Plugin to render centered text in doughnut chart
const centerTextPlugin: Plugin = {
    id: 'centerText',
    afterDatasetsDraw(chart: any) {
        const { ctx, chartArea: { left, top, width, height } } = chart;
        const centerX = left + width / 2;
        const centerY = top + height / 2;

        // Get the title text from chart options
        const titleText = (chart.options.plugins?.centerText?.text as string) || '';

        if (!titleText) return;

        ctx.save();
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(titleText, centerX, centerY);
        ctx.restore();
    }
};

ChartJS.register(centerTextPlugin);

interface CategoryBreakdownChartProps {
    data: {
        category: string;
        color: string;
        total: number;
    }[];
    volumeData?: {
        category_id: number | null;
        category_name: string;
        color: string;
        total_income: number;
        total_expense: number;
        total_volume: number;
    }[];
    loading?: boolean;
    onClick?: () => void;
}

export default function CategoryBreakdownChart({ data, volumeData, loading = false, onClick }: CategoryBreakdownChartProps) {
    // Process volume data to get top 5 categories + Others
    const processVolumeData = (vol: typeof volumeData) => {
        if (!vol || vol.length === 0) return null;

        const sorted = [...vol].sort((a, b) => b.total_volume - a.total_volume);
        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5);

        const processedData = [...top5];

        if (others.length > 0) {
            const othersTotal = others.reduce((sum, cat) => sum + cat.total_volume, 0);
            const othersIncome = others.reduce((sum, cat) => sum + cat.total_income, 0);
            const othersExpense = others.reduce((sum, cat) => sum + cat.total_expense, 0);

            processedData.push({
                category_id: null,
                category_name: "Others",
                color: "slate",
                total_income: othersIncome,
                total_expense: othersExpense,
                total_volume: othersTotal,
            });
        }

        return processedData;
    };

    const processedVolumeData = processVolumeData(volumeData);

    const createDoughnutChartData = (categories: typeof processedVolumeData, dataKey: 'total_volume' | 'total_income' | 'total_expense') => {
        if (!categories) return null;

        const colorMap: Record<string, string> = {
            red: "#ef4444", orange: "#f97316", amber: "#f59e0b", yellow: "#eab308",
            lime: "#84cc16", green: "#22c55e", emerald: "#10b981", teal: "#14b8a6",
            cyan: "#06b6d4", sky: "#0ea5e9", blue: "#3b82f6", indigo: "#6366f1",
            violet: "#8b5cf6", purple: "#a855f7", fuchsia: "#d946ef", pink: "#ec4899",
            rose: "#f43f5e", slate: "#64748b", gray: "#6b7280", zinc: "#71717a",
            neutral: "#737373", stone: "#78716c",
        };

        const colors = categories.map(cat => colorMap[cat.color] || "#64748b");

        return {
            labels: categories.map(cat => cat.category_name),
            datasets: [{
                data: categories.map(cat => cat[dataKey]),
                backgroundColor: colors.map(color => color + "40"),
                borderColor: colors,
                borderWidth: 1,
                hoverBackgroundColor: colors.map(color => color + "80"),
                hoverBorderColor: colors,
                hoverBorderWidth: 1.5,
            }],
        };
    };

    const createChartOptions = (titleText: string = '') => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            centerText: { text: titleText },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const value = Number(context.parsed) || 0;
                        const dataset = context.dataset ?? context.chart?.data?.datasets?.[context.datasetIndex];
                        const dataArr: any[] = (dataset && dataset.data) || [];
                        const total = dataArr.reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

                        return `${Number(value).toLocaleString()}${SITE_CONFIG.CURRENCY_STRING} (${percentage}%)`;
                    }
                }
            }
        },
    });

    const totalVolumeData = createDoughnutChartData(processedVolumeData, 'total_volume');
    const incomeVolumeData = createDoughnutChartData(processedVolumeData, 'total_income');
    const expenseVolumeData = createDoughnutChartData(processedVolumeData, 'total_expense');

    const totalVolumeOptions = createChartOptions('Total Vol.');
    const incomeVolumeOptions = createChartOptions('Income Vol.');
    const expenseVolumeOptions = createChartOptions('Expense Vol.');

    return (
        loading ? <LoadingBlock /> :
            (data.length > 0 || processedVolumeData) ? (
                <div
                    className="flex lg:flex-col flex-row items-center gap-8 w-full h-full cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={onClick}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            onClick?.();
                        }
                    }}
                >
                    {/* Main Total Volume Chart */}
                    {totalVolumeData && (
                        <div className="lg:w-full w-1/2">
                            <div className="w-full h-64 p-4">
                                <Doughnut data={totalVolumeData} options={totalVolumeOptions} />
                            </div>
                        </div>
                    )}

                    {/* Income and Expense Volume Subcharts */}
                    {incomeVolumeData && expenseVolumeData && (
                        <div className="w-full flex flex-col lg:grid lg:grid-cols-2 gap-4">
                            <div>
                                <div className="w-full h-48 p-2">
                                    <Doughnut data={incomeVolumeData} options={incomeVolumeOptions} />
                                </div>
                            </div>
                            <div>
                                <div className="w-full h-48 p-2">
                                    <Doughnut data={expenseVolumeData} options={expenseVolumeOptions} />
                                </div>
                            </div>
                        </div>
                    )}
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
