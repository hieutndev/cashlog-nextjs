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
    income?: number;
    expense?: number;
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

export type TDateRange = {
    startDate: string;
    endDate: string;
};

/**
 * Calculate date range based on time period and specific time
 */
export const getDateRangeByTimePeriod = (
    timePeriod: string,
    specificTime: number | null = null
): TDateRange => {
    const currentDate = moment();
    let startDate: string;
    let endDate: string;

    switch (timePeriod) {
        case 'day':
            startDate = currentDate.format('YYYY-MM-DD');
            endDate = currentDate.format('YYYY-MM-DD');
            break;
        case 'week':
            startDate = currentDate.clone().startOf('isoWeek').format('YYYY-MM-DD');
            endDate = currentDate.clone().endOf('isoWeek').format('YYYY-MM-DD');
            break;
        case 'month':
            if (specificTime !== null) {
                startDate = moment({ year: currentDate.year(), month: specificTime - 1 }).startOf('month').format('YYYY-MM-DD');
                endDate = moment({ year: currentDate.year(), month: specificTime - 1 }).endOf('month').format('YYYY-MM-DD');
            } else {
                startDate = currentDate.clone().startOf('month').format('YYYY-MM-DD');
                endDate = currentDate.clone().endOf('month').format('YYYY-MM-DD');
            }
            break;
        case 'year':
            if (specificTime !== null) {
                startDate = `${specificTime}-01-01`;
                endDate = `${specificTime}-12-31`;
            } else {
                startDate = `${currentDate.year()}-01-01`;
                endDate = `${currentDate.year()}-12-31`;
            }
            break;
        default:
            startDate = currentDate.clone().startOf('month').format('YYYY-MM-DD');
            endDate = currentDate.clone().endOf('month').format('YYYY-MM-DD');
    }

    return { startDate, endDate };
};

export const getCategoryStatsByUserId = async (
    userId: TUser["user_id"],
    startDate?: string,
    endDate?: string
): Promise<TCategoryStats[]> => {
    try {
        let query = QUERY_STRING.GET_CATEGORY_STATS_BY_USER_ID;
        let params: any[] = [userId];

        // If date range is provided, use the filtered query with income/expense breakdown
        // Excludes initial balance transactions to prevent double-counting
        if (startDate && endDate) {
            query = `SELECT
                        COALESCE(tc.category_name, 'Uncategorized') as category,
                        COALESCE(tc.color, 'slate') as color,
                        SUM(tn.amount) as total,
                        SUM(CASE WHEN tn.direction = 'in' THEN tn.amount ELSE 0 END) as income,
                        SUM(CASE WHEN tn.direction = 'out' THEN tn.amount ELSE 0 END) as expense
                    FROM transactions_new tn
                    JOIN cards c ON tn.card_id = c.card_id
                    JOIN users u ON c.user_id = u.user_id
                    LEFT JOIN transaction_categories tc ON tn.category_id = tc.category_id
                    WHERE u.user_id = ?
                        AND tn.date >= ?
                        AND tn.date <= ?
                        AND tn.description != 'Auto-generated when creating a new card'
                    GROUP BY tc.category_id, tc.category_name, tc.color
                    HAVING total > 0
                    ORDER BY total DESC`;
            params = [userId, startDate, endDate];
        }

        const categoryStats = await dbQuery<RowDataPacket[]>(query, params);

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

    let diff = totalCurrent - totalLast;

    return {
        amount: totalCurrent,
        percentage: totalLast === 0
            ? 0
            : (diff / totalLast) * 100,
        subAmount: diff,
        last: totalLast,
        cashFlow: diff === 0
            ? "neutral"
            : diff > 0
                ? "up"
                : "down",
        cashFlowWarning: diff === 0
            ? "neutral"
            : diff > 0
                ? "up"
                : "down",
        icon: diff === 0
            ? "neutral"
            : diff > 0
                ? "up"
                : "down",
    }
}

export const makeSavingFluctuationResponse = (totalCurrent: number, totalLast: number) => {

    let diff = totalCurrent - Math.abs(totalLast);


    return {
        amount: totalCurrent,
        percentage: Math.abs(totalLast) === 0
            ? 0
            : ((diff) / Math.abs(totalLast)) * 100,
        subAmount: diff,
        last: totalLast,
        cashFlow: diff === 0
            ? "neutral"
            : diff > 0
                ? "up"
                : "down",
        cashFlowWarning: diff === 0
            ? "neutral"
            : diff > 0
                ? "up"
                : "down",
        icon: diff === 0
            ? "neutral"
            : diff > 0
                ? "up"
                : "down",
    }
}

const getSavingFluctuationLabelIcon = (value: number) => {
    if (value === 0) return "neutral";

    return value > 0 ? "income" : "expense";
}

const getSavingFluctuationColor = (value: number) => {
    if (value === 0) return "primary";

    return value > 0 ? "success" : "danger";
}

const getBalanceFluctuationColor = (value: number[], type: 'income' | 'expense') => {
    if (value.every(val => val === 0)) return "primary";

    return type === 'income' ? "success" : "danger";
}

const getBalanceFluctuationLabelIcon = (value: number[], type: 'income' | 'expense') => {
    if (value.every(val => val === 0)) return "neutral";

    return type;
}

export const calculateTotalSummary = (income: number, expense: number): TTimePeriodSummary => {
    return {
        totalIncome: income,
        totalExpense: expense,
        totalSavings: income - expense, // Savings = Income - Expense
    };
}

export type TTotalAsset = {
    date: string;
    total_asset: number;
};

export type TCategoryVolume = {
    category_id: number | null;
    category_name: string;
    color: string;
    total_income: number;
    total_expense: number;
    total_volume: number;
};

export const getCategoryVolumeStats = async (
    userId: string | number,
    timePeriod: string = 'month',
    specificTime: number | null = null
): Promise<TCategoryVolume[]> => {
    try {
        const { startDate, endDate } = getDateRangeByTimePeriod(timePeriod, specificTime);

        // Excludes initial balance transactions to prevent double-counting
        // Initial balances are already reflected in the card_balance field
        const query = `
            SELECT
                COALESCE(tc.category_id, 0) as category_id,
                COALESCE(tc.category_name, 'Uncategorized') as category_name,
                COALESCE(tc.color, 'slate') as color,
                SUM(CASE WHEN tn.direction = 'in' THEN tn.amount ELSE 0 END) as total_income,
                SUM(CASE WHEN tn.direction = 'out' THEN tn.amount ELSE 0 END) as total_expense,
                SUM(ABS(tn.amount)) as total_volume
            FROM transactions_new tn
            JOIN cards c ON tn.card_id = c.card_id
            JOIN users u ON c.user_id = u.user_id
            LEFT JOIN transaction_categories tc ON tn.category_id = tc.category_id
            WHERE u.user_id = ?
                AND tn.date >= ?
                AND tn.date <= ?
                AND tn.description != 'Auto-generated when creating a new card'
            GROUP BY tc.category_id, tc.category_name, tc.color
            ORDER BY total_volume DESC
        `;

        const results = await dbQuery<RowDataPacket[]>(query, [userId, startDate, endDate]);

        return results.map(row => ({
            category_id: row.category_id as number | null,
            category_name: row.category_name as string,
            color: row.color as string,
            total_income: (row.total_income as number) || 0,
            total_expense: (row.total_expense as number) || 0,
            total_volume: (row.total_volume as number) || 0,
        }));
    } catch (error: unknown) {
        throw new Error(error instanceof Error ? error.message : "Error in getCategoryVolumeStats");
    }
};

export const getMonthlyAnalyticsData = async (userId: TUser['user_id']) => {
    try {
        const currentDate = moment();
        const currentYear = currentDate.year();
        const currentMonth = currentDate.month() + 1; // moment months are 0-indexed

        // Initialize arrays with null values for all 12 months
        const income: (number | null)[] = new Array(12).fill(null);
        const expenses: (number | null)[] = new Array(12).fill(null);
        const savings: (number | null)[] = new Array(12).fill(null);
        const total_assets: (number | null)[] = new Array(12).fill(null);

        const initial_balance = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_TOTAL_INITIAL_BALANCE_BY_USER, [userId]);
        let running_balance = Number((initial_balance[0]?.initial_total_assets) || 0);

        for (let month = 1; month <= currentMonth; month++) {
            const startDate = moment({ year: currentYear, month: month - 1 }).startOf('month').format('YYYY-MM-DD');
            const endDate = moment({ year: currentYear, month: month - 1 }).endOf('month').format('YYYY-MM-DD');

            const monthlyTotals = await getPeriodTotals(userId, startDate, endDate);

            const monthIndex = month - 1; // Convert to 0-based index

            income[monthIndex] = monthlyTotals.total_income;
            expenses[monthIndex] = monthlyTotals.total_expense;
            savings[monthIndex] = monthlyTotals.total_income - monthlyTotals.total_expense;
            total_assets[monthIndex] = running_balance + (monthlyTotals.total_income - monthlyTotals.total_expense);
            running_balance = total_assets[monthIndex]
        }


        return {
            income,
            expenses,
            savings,
            total_assets,
            months: [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ]
        };
    } catch (error: unknown) {
        throw new Error(error instanceof Error ? error.message : "Error in getMonthlyAnalyticsData");
    }
};

export const calculateAnalytics = async (
    userId: string | number,
    timePeriod: string = 'month',
    specificTime: number | null = null
) => {
    try {
        const currentDate = moment();
        let CURRENT_MONTH = currentDate.month() + 1;
        let CURRENT_YEAR = currentDate.year();

        if (specificTime !== null) {
            if (timePeriod === 'month') {
                CURRENT_MONTH = specificTime;
            } else if (timePeriod === 'year') {
                CURRENT_YEAR = specificTime;
                CURRENT_MONTH = 12;
            }
        }

        let LAST_MONTH, LAST_MONTH_YEAR, LAST_YEAR;

        if (specificTime !== null && timePeriod === 'month') {
            const targetMonth = moment({ year: CURRENT_YEAR, month: specificTime - 1 });
            const previousMonth = targetMonth.clone().subtract(1, "month");

            LAST_MONTH = previousMonth.month() + 1;
            LAST_MONTH_YEAR = previousMonth.year();
        } else {
            const previousMonth = currentDate.clone().subtract(1, "month");

            LAST_MONTH = previousMonth.month() + 1;
            LAST_MONTH_YEAR = previousMonth.year();
        }

        LAST_YEAR = CURRENT_YEAR - 1;
        const YESTERDAY = currentDate.clone().subtract(1, "day");
        const LAST_WEEK_START = currentDate.clone().subtract(1, "week").startOf('isoWeek');
        const LAST_WEEK_END = currentDate.clone().subtract(1, "week").endOf('isoWeek');
        const CURRENT_WEEK_START = currentDate.clone().startOf('isoWeek');
        const CURRENT_WEEK_END = currentDate.clone().endOf('isoWeek');

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
                        label: "Total Income",
                        labelIcon: getBalanceFluctuationLabelIcon([currentMonthTotals.total_income, lastMonthTotals.total_income], 'income'),
                        value: makeBalanceFluctuationResponse(currentMonthTotals.total_income, lastMonthTotals.total_income),
                        color: getBalanceFluctuationColor([currentMonthTotals.total_income, lastMonthTotals.total_income], 'income'),
                    },
                    {
                        label: "Total Expense",
                        labelIcon: getBalanceFluctuationLabelIcon([currentMonthTotals.total_expense, lastMonthTotals.total_expense], 'expense'),
                        value: makeBalanceFluctuationResponse(currentMonthTotals.total_expense, lastMonthTotals.total_expense),
                        color: getBalanceFluctuationColor([currentMonthTotals.total_expense, lastMonthTotals.total_expense], 'expense'),
                    },
                    {
                        label: "Total Savings",
                        labelIcon: getSavingFluctuationLabelIcon(currentMonthSavings),
                        value: makeSavingFluctuationResponse(currentMonthSavings, lastMonthSavings),
                        color: getSavingFluctuationColor(currentMonthSavings),
                    },
                ],
                year: [
                    {
                        label: "Total Income",
                        labelIcon: getBalanceFluctuationLabelIcon([currentYearTotals.total_income, lastYearTotals.total_income], 'income'),
                        value: makeBalanceFluctuationResponse(currentYearTotals.total_income, lastYearTotals.total_income),
                        color: getBalanceFluctuationColor([currentYearTotals.total_income, lastYearTotals.total_income], 'income'),
                    },
                    {
                        label: "Total Expense",
                        labelIcon: getBalanceFluctuationLabelIcon([currentYearTotals.total_expense, lastYearTotals.total_expense], 'expense'),
                        value: makeBalanceFluctuationResponse(currentYearTotals.total_expense, lastYearTotals.total_expense),
                        color: getBalanceFluctuationColor([currentYearTotals.total_expense, lastYearTotals.total_expense], 'expense'),
                    },
                    {
                        label: "Total Savings",
                        labelIcon: getSavingFluctuationLabelIcon(currentYearSavings),
                        value: makeSavingFluctuationResponse(currentYearSavings, lastYearSavings),
                        color: getSavingFluctuationColor(currentYearSavings),
                    },
                ],
                day: [
                    {
                        label: "Total Income",
                        labelIcon: getBalanceFluctuationLabelIcon([todayTotals.total_income, yesterdayTotals.total_income], 'income'),
                        value: makeBalanceFluctuationResponse(todayTotals.total_income, yesterdayTotals.total_income),
                        color: getBalanceFluctuationColor([todayTotals.total_income, yesterdayTotals.total_income], 'income'),
                    },
                    {
                        label: "Total Expense",
                        labelIcon: getBalanceFluctuationLabelIcon([todayTotals.total_expense, yesterdayTotals.total_expense], 'expense'),
                        value: makeBalanceFluctuationResponse(todayTotals.total_expense, yesterdayTotals.total_expense),
                        color: getBalanceFluctuationColor([todayTotals.total_expense, yesterdayTotals.total_expense], 'expense'),
                    },
                    {
                        label: "Total Savings",
                        labelIcon: getSavingFluctuationLabelIcon(todaySavings),
                        value: makeSavingFluctuationResponse(todaySavings, yesterdaySavings),
                        color: getSavingFluctuationColor(todaySavings),
                    },
                ],
                week: [
                    {
                        label: "Total Income",
                        labelIcon: getBalanceFluctuationLabelIcon([currentWeekTotals.total_income, lastWeekTotals.total_income], 'income'),
                        value: makeBalanceFluctuationResponse(currentWeekTotals.total_income, lastWeekTotals.total_income),
                        color: getBalanceFluctuationColor([currentWeekTotals.total_income, lastWeekTotals.total_income], 'income'),
                    },
                    {
                        label: "Total Expense",
                        labelIcon: getBalanceFluctuationLabelIcon([currentWeekTotals.total_expense, lastWeekTotals.total_expense], 'expense'),
                        value: makeBalanceFluctuationResponse(currentWeekTotals.total_expense, lastWeekTotals.total_expense),
                        color: getBalanceFluctuationColor([currentWeekTotals.total_expense, lastWeekTotals.total_expense], 'expense'),
                    },
                    {
                        label: "Total Savings",
                        labelIcon: getSavingFluctuationLabelIcon(currentWeekSavings),
                        value: makeSavingFluctuationResponse(currentWeekSavings, lastWeekSavings),
                        color: getSavingFluctuationColor(currentWeekSavings),
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


