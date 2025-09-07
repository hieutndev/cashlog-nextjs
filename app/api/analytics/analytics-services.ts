import moment from "moment";
import { RowDataPacket } from "mysql2";

import { QUERY_STRING } from "@/configs/query-string";
import { dbQuery } from "@/libs/mysql";
import { TTimePeriodSummary } from "@/types/analytics";
import { TUser } from "@/types/user";

export type TCategoryStats = {
    category: string;
    color: string;
    total: number;
};

export type TPeriodTotals = {
    total_income: number;
    total_expense: number;
};

export type TDailyAnalytics = {
    date: string;
    income: number;
    expense: number;
};

export type TWeeklyAnalytics = {
    week: string;
    year: number;
    week_number: number;
    income: number;
    expense: number;
};

export type TMonthlyAnalytics = {
    year: number;
    month: number;
    income: number;
    expense: number;
};

export type TYearlyAnalytics = {
    year: number;
    income: number;
    expense: number;
};

export const getCategoryStatsByUserId = async (userId: TUser["user_id"]): Promise<TCategoryStats[]> => {
    try {
        const categoryStats = await dbQuery<RowDataPacket[]>(
            QUERY_STRING.GET_CATEGORY_STATS_BY_USER_ID,
            [userId]
        );

        if (!categoryStats) {
            return [];
        }

        return categoryStats as TCategoryStats[];
    } catch (error: unknown) {
        throw new Error(
            error instanceof Error ? error.message : "Error in getCategoryStatsByUserId"
        );
    }
};

export const getTotalBalance = async (userId: TUser["user_id"]) => {
    const query = QUERY_STRING.GET_TOTAL_BALANCE_OF_USER;
    const params = [userId];

    const totalBalance = await dbQuery<RowDataPacket[]>(query, params);

    return totalBalance[0] ? totalBalance[0].total_balance : 0;
}

export const getPeriodTotals = async (
    userId: string | number,
    startDate: string,
    endDate: string
): Promise<TPeriodTotals> => {
    try {
        const result = await dbQuery<RowDataPacket[]>(
            QUERY_STRING.GET_PERIOD_TOTALS_BY_USER_ID,
            [userId, startDate, endDate]
        );

        return {
            total_income: result[0]?.total_income ? Number(result[0].total_income) : 0,
            total_expense: result[0]?.total_expense ? Number(result[0].total_expense) : 0,
        };
    } catch (error: unknown) {
        throw new Error(error instanceof Error ? error.message : "Error in getPeriodTotals");
    }
};

export const getDailyAnalytics = async (
    userId: string | number,
    startDate: string,
    endDate: string
): Promise<TDailyAnalytics[]> => {
    try {
        const result = await dbQuery<RowDataPacket[]>(
            QUERY_STRING.GET_DAILY_ANALYTICS_BY_USER_ID,
            [userId, startDate, endDate]
        );

        return result as TDailyAnalytics[];
    } catch (error: unknown) {
        throw new Error(error instanceof Error ? error.message : "Error in getDailyAnalytics");
    }
};


export const calculateDailyIncomeExpense = async (userId: string | number, month: number, year: number) => {
    const startDate = moment({ year, month: month - 1 }).startOf('month').format('YYYY-MM-DD');
    const endDate = moment({ year, month: month - 1 }).endOf('month').format('YYYY-MM-DD');

    const dailyData = await getDailyAnalytics(userId, startDate, endDate);

    const daysInMonth = moment({ year, month: month - 1 }).daysInMonth();

    // Create array for all days in month, initialized with 0
    const dailyStats = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        income: 0,
        expense: 0,
    }));

    // Fill in actual data from database
    dailyData.forEach(data => {
        const day = moment(data.date).date();

        dailyStats[day - 1] = {
            day,
            income: data.income,
            expense: data.expense,
        };
    });

    // Get current day of the month for slicing (show last 30 days or current month)
    const today = moment().date();
    const isCurrentMonth = moment().month() + 1 === month && moment().year() === year;

    let slicedStats = dailyStats;

    if (isCurrentMonth) {
        // For current month, show last 30 days or from start of month to today
        const startDay = Math.max(1, today - 30);

        slicedStats = dailyStats.slice(startDay - 1, today);
    }

    return {
        columnLabels: slicedStats.map((stat) => stat.day.toString()),
        dataSets: [
            {
                label: "Income",
                data: slicedStats.map((stat) => stat.income),
                borderColor: "rgba(23, 201, 100, 1)",
                backgroundColor: "rgba(23, 201, 100, 0.5)",
            },
            {
                label: "Expense",
                data: slicedStats.map((stat) => stat.expense),
                borderColor: "rgba(243, 18, 96, 1)",
                backgroundColor: "rgba(243, 18, 96, 0.5)",
            },
        ],
    }
}


export const makeBalanceFluctuationResponse = (totalCurrent: number, totalLast: number) => {
    return {
        amount: totalCurrent,
        percentage: totalLast === 0
            ? 0
            : ((totalCurrent - totalLast) / totalLast) * 100,
        subAmount: totalCurrent - totalLast,
        last: totalLast,
        cashFlow: totalCurrent - totalLast > 0 ? "up" : "down",
        cashFlowWarning: totalCurrent - totalLast > 0 ? "up" : "down",
        icon: totalCurrent - totalLast > 0 ? "up" : "down",
    }
}

export const calculateTotalSummary = (income: number, expense: number): TTimePeriodSummary => {
    return {
        totalIncome: income,
        totalExpense: expense,
        totalSavings: income - expense, // Savings = Income - Expense
    };
}

export const calculateAnalytics = async (userId: string | number) => {
    try {
        // Define time periods
        const currentDate = moment();
        const CURRENT_MONTH = currentDate.month() + 1;
        const CURRENT_YEAR = currentDate.year();

        const previousMonth = currentDate.clone().subtract(1, "month");
        const LAST_MONTH = previousMonth.month() + 1;
        const LAST_MONTH_YEAR = previousMonth.year();

        const LAST_YEAR = CURRENT_YEAR - 1;
        const YESTERDAY = currentDate.clone().subtract(1, "day");
        const LAST_WEEK_START = currentDate.clone().subtract(1, "week").startOf('isoWeek');
        const LAST_WEEK_END = currentDate.clone().subtract(1, "week").endOf('isoWeek');
        const CURRENT_WEEK_START = currentDate.clone().startOf('isoWeek');
        const CURRENT_WEEK_END = currentDate.clone().endOf('isoWeek');

        // Calculate totals for different time periods using optimized queries
        // All time totals
        const allTimeTotals = await getPeriodTotals(
            userId,
            '1970-01-01',
            '2099-12-31'
        );

        // Current year totals
        const currentYearTotals = await getPeriodTotals(
            userId,
            `${CURRENT_YEAR}-01-01`,
            `${CURRENT_YEAR}-12-31`
        );

        // Last year totals
        const lastYearTotals = await getPeriodTotals(
            userId,
            `${LAST_YEAR}-01-01`,
            `${LAST_YEAR}-12-31`
        );

        // Current month totals
        const currentMonthTotals = await getPeriodTotals(
            userId,
            moment({ year: CURRENT_YEAR, month: CURRENT_MONTH - 1 }).startOf('month').format('YYYY-MM-DD'),
            moment({ year: CURRENT_YEAR, month: CURRENT_MONTH - 1 }).endOf('month').format('YYYY-MM-DD')
        );

        // Last month totals
        const lastMonthTotals = await getPeriodTotals(
            userId,
            moment({ year: LAST_MONTH_YEAR, month: LAST_MONTH - 1 }).startOf('month').format('YYYY-MM-DD'),
            moment({ year: LAST_MONTH_YEAR, month: LAST_MONTH - 1 }).endOf('month').format('YYYY-MM-DD')
        );

        // Current week totals
        const currentWeekTotals = await getPeriodTotals(
            userId,
            CURRENT_WEEK_START.format('YYYY-MM-DD'),
            CURRENT_WEEK_END.format('YYYY-MM-DD')
        );

        // Last week totals
        const lastWeekTotals = await getPeriodTotals(
            userId,
            LAST_WEEK_START.format('YYYY-MM-DD'),
            LAST_WEEK_END.format('YYYY-MM-DD')
        );

        // Today totals
        const todayTotals = await getPeriodTotals(
            userId,
            currentDate.format('YYYY-MM-DD'),
            currentDate.format('YYYY-MM-DD')
        );

        // Yesterday totals
        const yesterdayTotals = await getPeriodTotals(
            userId,
            YESTERDAY.format('YYYY-MM-DD'),
            YESTERDAY.format('YYYY-MM-DD')
        );

        // Calculate savings (income - expense) for each period
        const currentMonthSavings = currentMonthTotals.total_income - currentMonthTotals.total_expense;
        const lastMonthSavings = lastMonthTotals.total_income - lastMonthTotals.total_expense;

        const currentYearSavings = currentYearTotals.total_income - currentYearTotals.total_expense;
        const lastYearSavings = lastYearTotals.total_income - lastYearTotals.total_expense;

        const currentWeekSavings = currentWeekTotals.total_income - currentWeekTotals.total_expense;
        const lastWeekSavings = lastWeekTotals.total_income - lastWeekTotals.total_expense;

        const todaySavings = todayTotals.total_income - todayTotals.total_expense;
        const yesterdaySavings = yesterdayTotals.total_income - yesterdayTotals.total_expense;

        return {
            charts: {
                [CURRENT_MONTH]: await calculateDailyIncomeExpense(userId, CURRENT_MONTH, CURRENT_YEAR),
            },
            balanceFluctuation: {
                month: [
                    {
                        label: "Total Income This Month",
                        labelIcon: "income",
                        value: makeBalanceFluctuationResponse(
                            currentMonthTotals.total_income,
                            lastMonthTotals.total_income
                        ),
                        color: "success",
                    },
                    {
                        label: "Total Expense This Month",
                        labelIcon: "expense",
                        value: makeBalanceFluctuationResponse(
                            currentMonthTotals.total_expense,
                            lastMonthTotals.total_expense
                        ),
                        color: "danger",
                    },
                    {
                        label: "Total Savings This Month",
                        labelIcon: currentMonthSavings >= 0 ? "income" : "expense",
                        value: makeBalanceFluctuationResponse(currentMonthSavings, lastMonthSavings),
                        color: currentMonthSavings >= 0 ? "success" : "danger",
                    },
                ],
                year: [
                    {
                        label: "Total Income This Year",
                        labelIcon: "income",
                        value: makeBalanceFluctuationResponse(
                            currentYearTotals.total_income,
                            lastYearTotals.total_income
                        ),
                        color: "success",
                    },
                    {
                        label: "Total Expense This Year",
                        labelIcon: "expense",
                        value: makeBalanceFluctuationResponse(
                            currentYearTotals.total_expense,
                            lastYearTotals.total_expense
                        ),
                        color: "danger",
                    },
                    {
                        label: "Total Savings This Year",
                        labelIcon: currentYearSavings >= 0 ? "income" : "expense",
                        value: makeBalanceFluctuationResponse(currentYearSavings, lastYearSavings),
                        color: currentYearSavings >= 0 ? "success" : "danger",
                    },
                ],
                day: [
                    {
                        label: "Total Income Today",
                        labelIcon: "income",
                        value: makeBalanceFluctuationResponse(
                            todayTotals.total_income,
                            yesterdayTotals.total_income
                        ),
                        color: "success",
                    },
                    {
                        label: "Total Expense Today",
                        labelIcon: "expense",
                        value: makeBalanceFluctuationResponse(
                            todayTotals.total_expense,
                            yesterdayTotals.total_expense
                        ),
                        color: "danger",
                    },
                    {
                        label: "Total Savings Today",
                        labelIcon: todaySavings >= 0 ? "income" : "expense",
                        value: makeBalanceFluctuationResponse(todaySavings, yesterdaySavings),
                        color: todaySavings >= 0 ? "success" : "danger",
                    },
                ],
                week: [
                    {
                        label: "Total Income This Week",
                        labelIcon: "income",
                        value: makeBalanceFluctuationResponse(
                            currentWeekTotals.total_income,
                            lastWeekTotals.total_income
                        ),
                        color: "success",
                    },
                    {
                        label: "Total Expense This Week",
                        labelIcon: "expense",
                        value: makeBalanceFluctuationResponse(
                            currentWeekTotals.total_expense,
                            lastWeekTotals.total_expense
                        ),
                        color: "danger",
                    },
                    {
                        label: "Total Savings This Week",
                        labelIcon: currentWeekSavings >= 0 ? "income" : "expense",
                        value: makeBalanceFluctuationResponse(currentWeekSavings, lastWeekSavings),
                        color: currentWeekSavings >= 0 ? "success" : "danger",
                    },
                ]
            },
            summary: {
                byTotal: calculateTotalSummary(
                    allTimeTotals.total_income,
                    allTimeTotals.total_expense
                ),
                byYear: calculateTotalSummary(
                    currentYearTotals.total_income,
                    currentYearTotals.total_expense
                ),
                byMonth: calculateTotalSummary(
                    currentMonthTotals.total_income,
                    currentMonthTotals.total_expense
                )
            },
        }
    } catch (error: unknown) {
        throw new Error(error instanceof Error ? error.message : "Error in calculateAnalytics");
    }
}
