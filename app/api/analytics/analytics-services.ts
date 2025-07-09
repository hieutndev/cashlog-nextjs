import moment from "moment";
import {RowDataPacket} from "mysql2";

import {QUERY_STRING} from "@/configs/query-string";
import {dbQuery} from "@/libs/mysql";
import {TTimePeriodSummary} from "@/types/analytics";
import {TTransactionWithCardAndCategory} from "@/types/transaction";
import {TUser} from "@/types/user";

export const getTotalBalance = async (userId: TUser["user_id"]) => {
    const query = QUERY_STRING.GET_TOTAL_BALANCE_OF_USER;
    const params = [userId];

    const totalBalance = await dbQuery<RowDataPacket[]>(query, params);

    return totalBalance[0] ? totalBalance[0].total_balance : 0;
}


export const calculateFluctuationOnTime = (listTransactions: TTransactionWithCardAndCategory[], timeValue: number, timeRange: moment.unitOfTime.All) => {

    const results = listTransactions.filter(t => {
        return moment(t.date).get(timeRange) + 1 === timeValue
    })

    return results.reduce((acc, transaction) => {
        return acc + transaction.amount;
    }, 0);
}

export const calculateDailyIncomeExpense = (transactions: TTransactionWithCardAndCategory[], month: number, year: number) => {

    const daysInMonth = moment({year, month: month - 1}).daysInMonth();

    const dailyStats = Array.from({length: daysInMonth}, (_, i) => ({
        day: i + 1,
        income: 0,
        expense: 0,
    }));

    transactions.forEach(t => {
        const date = moment(t.date);

        if (date.month() + 1 === month && date.year() === year) {
            const day = date.date();

            // console.log('t.direction', t.direction);
            // console.log('t.amount', t.amount);

            if (t.direction === "in") {
                dailyStats[day - 1].income += t.amount;
            } else if (t.direction === "out") {
                dailyStats[day - 1].expense += t.amount;
            }
        }
    });

    // Get current day of the month
    const today = moment().date();
    // Calculate start day (6 days before today, but not less than 1)
    const startDay = Math.max(1, today - 30);
    // Slice the dailyStats array to only include from startDay to today
    const slicedStats = dailyStats.slice(startDay - 1, today);

    return {
        columnLabels: slicedStats.map((stat) => stat.day),
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

/**
 * Calculate total income and expense for all transactions
 */
export const calculateTotalSummary = (transactions: TTransactionWithCardAndCategory[]): TTimePeriodSummary => {
    const incomeTransactions = transactions.filter(t => t.direction === "in");
    const expenseTransactions = transactions.filter(t => t.direction === "out");

    const totalIncome = incomeTransactions.reduce((acc, transaction) => {
        return acc + transaction.amount;
    }, 0);

    const totalExpense = expenseTransactions.reduce((acc, transaction) => {
        return acc + transaction.amount;
    }, 0);

    return {
        totalIncome,
        totalExpense,
        totalSavings: totalIncome - totalExpense,
    };
}

/**
 * Calculate total income and expense for transactions within a specific year
 */
export const calculateYearSummary = (transactions: TTransactionWithCardAndCategory[], year: number): TTimePeriodSummary => {
    const yearTransactions = transactions.filter(t => {
        return moment(t.date).year() === year;
    });

    return calculateTotalSummary(yearTransactions);
}

/**
 * Calculate total income and expense for transactions within a specific month and year
 */
export const calculateMonthSummary = (transactions: TTransactionWithCardAndCategory[], month: number, year: number): TTimePeriodSummary => {
    const monthTransactions = transactions.filter(t => {
        const transactionDate = moment(t.date);

        return transactionDate.month() + 1 === month && transactionDate.year() === year;
    });

    return calculateTotalSummary(monthTransactions);
}

/**
 * Calculate total income and expense for transactions within a specific day
 */
export const calculateDaySummary = (transactions: TTransactionWithCardAndCategory[], date: moment.Moment): TTimePeriodSummary => {
    const dayTransactions = transactions.filter(t => {
        const transactionDate = moment(t.date);

        return transactionDate.isSame(date, 'day');
    });

    return calculateTotalSummary(dayTransactions);
}

/**
 * Calculate income, expense, and savings totals for a specific time period
 */
export const calculateIncomeExpenseByPeriod = (
    transactions: TTransactionWithCardAndCategory[],
    filterFn: (transaction: TTransactionWithCardAndCategory) => boolean
): { income: number; expense: number; savings: number } => {
    const filteredTransactions = transactions.filter(filterFn);

    const income = filteredTransactions
        .filter(t => t.direction === "in")
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = filteredTransactions
        .filter(t => t.direction === "out")
        .reduce((acc, t) => acc + t.amount, 0);

    const savings = income - expense;

    return {income, expense, savings};
}

export const calculateAnalytics = async (userId: string | number) => {

    let allTransactions: TTransactionWithCardAndCategory[] = [];

    try {
        allTransactions = (await dbQuery<RowDataPacket[]>(
            QUERY_STRING.GET_ALL_TRANSACTIONS_WITH_CARD_AND_CATEGORY_BY_USER_ID,
            [userId]
        )) as TTransactionWithCardAndCategory[];
    } catch (error: unknown) {
        throw new Error(error instanceof Error ? error.message : "Error in calculateAnalytics");
    }

    // Define time periods
    const currentDate = moment();
    const CURRENT_MONTH = currentDate.month() + 1;
    const CURRENT_YEAR = currentDate.year();
    const CURRENT_DAY = currentDate;

    const previousMonth = currentDate.clone().subtract(1, "month");
    const LAST_MONTH = previousMonth.month() + 1;
    const LAST_MONTH_YEAR = previousMonth.year();

    const LAST_YEAR = CURRENT_YEAR - 1;
    const YESTERDAY = currentDate.clone().subtract(1, "day");

    // Calculate summary data for different time periods using new helper functions
    const totalSummary = calculateTotalSummary(allTransactions);
    const yearSummary = calculateYearSummary(allTransactions, CURRENT_YEAR);
    const monthSummary = calculateMonthSummary(allTransactions, CURRENT_MONTH, CURRENT_YEAR);

    // Calculate current and previous period totals for balance fluctuation
    // Month comparisons
    const currentMonthTotals = calculateIncomeExpenseByPeriod(allTransactions, t => {
        const date = moment(t.date);

        return date.month() + 1 === CURRENT_MONTH && date.year() === CURRENT_YEAR;
    });

    const lastMonthTotals = calculateIncomeExpenseByPeriod(allTransactions, t => {
        const date = moment(t.date);

        return date.month() + 1 === LAST_MONTH && date.year() === LAST_MONTH_YEAR;
    });

    // Year comparisons
    const currentYearTotals = calculateIncomeExpenseByPeriod(allTransactions, t => {
        return moment(t.date).year() === CURRENT_YEAR;
    });

    const lastYearTotals = calculateIncomeExpenseByPeriod(allTransactions, t => {
        return moment(t.date).year() === LAST_YEAR;
    });

    // Day comparisons
    const todayTotals = calculateIncomeExpenseByPeriod(allTransactions, t => {
        return moment(t.date).isSame(CURRENT_DAY, 'day');
    });

    const yesterdayTotals = calculateIncomeExpenseByPeriod(allTransactions, t => {
        return moment(t.date).isSame(YESTERDAY, 'day');
    });

    // Keep existing week calculations for backward compatibility
    const CURRENT_WEEK = moment().get("week") + 1;
    const LAST_WEEK = moment().subtract(1, "week").get("week") + 1;
    const incomeTransactions = allTransactions.filter(t => t.direction === "in");
    const expenseTransactions = allTransactions.filter(t => t.direction === "out");

    const totalIncomeInCurrentWeek = calculateFluctuationOnTime(incomeTransactions, CURRENT_WEEK, "week");
    const totalExpenseInCurrentWeek = calculateFluctuationOnTime(expenseTransactions, CURRENT_WEEK, "week");
    const totalIncomeInLastWeek = calculateFluctuationOnTime(incomeTransactions, LAST_WEEK, "week");
    const totalExpenseInLastWeek = calculateFluctuationOnTime(expenseTransactions, LAST_WEEK, "week");

    return {
        charts: {
            [CURRENT_MONTH]: calculateDailyIncomeExpense(allTransactions, CURRENT_MONTH, CURRENT_YEAR),
        },
        balanceFluctuation: {
            month: [
                {
                    label: "Total Income This Month",
                    labelIcon: "income",
                    value: makeBalanceFluctuationResponse(currentMonthTotals.income, lastMonthTotals.income),
                    color: "success",
                },
                {
                    label: "Total Expense This Month",
                    labelIcon: "expense",
                    value: makeBalanceFluctuationResponse(currentMonthTotals.expense, lastMonthTotals.expense),
                    color: "danger",
                },
                {
                    label: "Total Savings This Month",
                    labelIcon: currentMonthTotals.savings >= 0 ? "income" : "expense",
                    value: makeBalanceFluctuationResponse(currentMonthTotals.savings, lastMonthTotals.savings),
                    color: currentMonthTotals.savings >= 0 ? "success" : "danger",
                },
            ],
            year: [
                {
                    label: "Total Income This Year",
                    labelIcon: "income",
                    value: makeBalanceFluctuationResponse(currentYearTotals.income, lastYearTotals.income),
                    color: "success",
                },
                {
                    label: "Total Expense This Year",
                    labelIcon: "expense",
                    value: makeBalanceFluctuationResponse(currentYearTotals.expense, lastYearTotals.expense),
                    color: "danger",
                },
                {
                    label: "Total Savings This Year",
                    labelIcon: currentYearTotals.savings >= 0 ? "income" : "expense",
                    value: makeBalanceFluctuationResponse(currentYearTotals.savings, lastYearTotals.savings),
                    color: currentYearTotals.savings >= 0 ? "success" : "danger",
                },
            ],
            day: [
                {
                    label: "Total Income Today",
                    labelIcon: "income",
                    value: makeBalanceFluctuationResponse(todayTotals.income, yesterdayTotals.income),
                    color: "success",
                },
                {
                    label: "Total Expense Today",
                    labelIcon: "expense",
                    value: makeBalanceFluctuationResponse(todayTotals.expense, yesterdayTotals.expense),
                    color: "danger",
                },
                {
                    label: "Total Savings Today",
                    labelIcon: todayTotals.savings >= 0 ? "income" : "expense",
                    value: makeBalanceFluctuationResponse(todayTotals.savings, yesterdayTotals.savings),
                    color: todayTotals.savings >= 0 ? "success" : "danger",
                },
            ],
            week: [
                {
                    label: "Total Income This Week",
                    labelIcon: "income",
                    value: makeBalanceFluctuationResponse(totalIncomeInCurrentWeek, totalIncomeInLastWeek),
                    color: "success",
                },
                {
                    label: "Total Expense This Week",
                    labelIcon: "expense",
                    value: makeBalanceFluctuationResponse(totalExpenseInCurrentWeek, totalExpenseInLastWeek),
                    color: "danger",
                },
                {
                    label: "Total Savings This Week",
                    labelIcon: (totalIncomeInCurrentWeek - totalExpenseInCurrentWeek) >= 0 ? "income" : "expense",
                    value: makeBalanceFluctuationResponse(
                        totalIncomeInCurrentWeek - totalExpenseInCurrentWeek,
                        totalIncomeInLastWeek - totalExpenseInLastWeek
                    ),
                    color: (totalIncomeInCurrentWeek - totalExpenseInCurrentWeek) >= 0 ? "success" : "danger",
                },
            ]
        },
        summary: {
            byTotal: totalSummary,
            byYear: yearSummary,
            byMonth: monthSummary
        },
    }
}
