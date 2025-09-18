export interface TBalanceFluctuation {
    [key: string]: {
        label: string;
        labelIcon: string;
        value: {
            amount: number;
            percentage: number;
            subAmount: number;
            last: number;
            cashFlow: "up" | "down";
            cashFlowWarning: "up" | "down";
            icon: string;
        };
        color: string;
    }[];
}

export type TTimePeriodSummary = {
    totalIncome: number;
    totalExpense: number;
    totalSavings: number;
}

export type TAnalyticsSummary = {
    byTotal: TTimePeriodSummary;
    byYear: TTimePeriodSummary;
    byMonth: TTimePeriodSummary;
}



export type TMonthlyAnalyticsResponse = {
    income: (number | null)[];
    expenses: (number | null)[];
    savings: (number | null)[];
    months: string[];
}

export type TAnalyticsResponse = {
    balanceFluctuation: TBalanceFluctuation;
    summary: TAnalyticsSummary
    charts: {
        [key: string]: {
            columnLabels: string[];
            dataSets: {
                label: string;
                data: number[];
                backgroundColor: string[];
                borderColor: string[];
                borderWidth: number;
            }[];
        }
    }

}
