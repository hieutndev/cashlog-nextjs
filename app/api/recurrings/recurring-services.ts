import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { z } from 'zod';
import moment from 'moment';

import { validateCardOwnership } from '../cards/card-services';
import { validateCategoryOwnership } from '../categories/categories-services';

import { getCardInfoById } from './../cards/card-services';


import { dbQuery, mysqlPool } from '@/libs/mysql';
import { QUERY_STRING } from '@/configs/query-string';
import {
  TAddRecurringPayload,
  TFrequencyConfig,
  UpdateRecurringOptions,
  TRemoveRecurringOptions,
  TRecurringResponse,
  TRecurringFilters,
  TRecurringInstanceFilters,
  RECURRING_STATUS,
  RECURRING_FREQUENCY_TYPES,
  RECURRING_ADJUSTMENT_TYPES,
  TFrequencyType,
  TRecurring,
  TRecurringInstance
} from '@/types/recurring';
import { ApiError } from '@/types/api-error';
import { TUser } from '@/types/user';
import { VALIDATE_MESSAGE } from '@/utils/api/zod-validate-message';
import { formatMYSQLDate } from '@/utils/text-transform';
import { TCard } from '@/types/card';

export interface RecurringInstanceRouteProps {
  params: Promise<{ recurring_instance_id: string }>;
};

export const getAllRecurringsQueryParams = z.object({
  status: z.enum(RECURRING_STATUS, { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }).optional(),
  is_active: z.enum(['true', 'false'], { message: VALIDATE_MESSAGE.ONLY_ACCEPT_BOOLEANS }).optional(),
  card_id: z.coerce
    .number({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
    .positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO }).optional(),
  frequency: z.enum(RECURRING_FREQUENCY_TYPES, { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }).optional(),
});

export const frequencyConfigPayload = z.object({
  // daysOfWeek: z.number().min(0).max(6).optional().array(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  adjustment: z.enum(RECURRING_ADJUSTMENT_TYPES, { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }).optional(),
  month: z.number().min(1).max(12).optional(),
  day: z.number().min(1).max(31).optional(),
});


const recurringPayloadObject = {
  recurring_name: z.string().min(1, { message: VALIDATE_MESSAGE.REQUIRED_VALUE }),
  amount: z.number().min(1, { message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO }),
  direction: z.enum(["in", "out"], { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
  card_id: z.coerce
    .number({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
    .positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO }),
  frequency: z.enum(RECURRING_FREQUENCY_TYPES, { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
  start_date: z.iso.datetime({ message: VALIDATE_MESSAGE.REQUIRE_ISO_DATE }),
  end_date: z.iso.datetime().nullable().optional(),
  category_id: z.coerce
    .number({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
    .positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
    .nullable()
    .optional(),
  interval: z.number().min(1).optional(),
  frequency_config: frequencyConfigPayload.optional(),
  notes: z.string().nullable().optional()
}



export const addRecurringsPayload = z.object(recurringPayloadObject).refine((data) => {

  if (data.end_date) {
    const start_date = new Date(data.start_date);
    const end_date = new Date(data.end_date);

    return end_date > start_date;
  }

  return true;
}, {
  message: VALIDATE_MESSAGE.END_DATE_MUST_BE_AFTER_START_DATE,
});

export const updateRecurringPayload = z.object({
  ...recurringPayloadObject,
  apply_to_future: z.boolean(),
  recreate_instances: z.boolean(),
});

export const createTransactionFromInstancePayload = z.object({
  amount: z.number().min(1, { message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO }),
  transaction_date: z.iso.datetime({ message: VALIDATE_MESSAGE.REQUIRE_ISO_DATE }),
  category_id: z.coerce
    .number({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
    .positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
    .nullable()
    .optional(),
  note: z.string().nullable().optional()
})

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);

  // Set to day 1 first to avoid date overflow issues
  // (e.g., Jan 31 + 1 month should go to Feb 1, not Mar 3)
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);

  // Set to day 1 and month 0 first to avoid date overflow issues
  // (e.g., Feb 29 2024 + 1 year should go to Jan 1 2025, not Mar 1 2025)
  result.setDate(1);
  result.setMonth(0);
  result.setFullYear(result.getFullYear() + years);

  return result;
}

export function getNextDayOfWeek(date: Date, dayOfWeek: number): Date {
  const result = new Date(date);
  const currentDay = result.getDay();
  const daysToAdd = (dayOfWeek - currentDay + 7) % 7;

  if (daysToAdd === 0) {
    result.setDate(result.getDate() + 7);
  } else {
    result.setDate(result.getDate() + daysToAdd);
  }

  return result;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildFrequencyConfig(data: TAddRecurringPayload): TFrequencyConfig {
  const config: TFrequencyConfig = {};

  switch (data.frequency) {
    case 'weekly':
      if (data.frequency_config?.daysOfWeek) {
        config.daysOfWeek = data.frequency_config.daysOfWeek;
      } else {
        const startDate = new Date(data.start_date);

        config.daysOfWeek = [startDate.getDay()];
      }
      break;

    case 'monthly':
      if (data.frequency_config?.dayOfMonth) {
        config.dayOfMonth = data.frequency_config.dayOfMonth;
      } else {
        const startDate = new Date(data.start_date);

        config.dayOfMonth = startDate.getDate();
      }
      config.adjustment = data.frequency_config?.adjustment || 'last';
      break;

    case 'yearly':
      if (data.frequency_config?.month && data.frequency_config?.day) {
        config.month = data.frequency_config.month;
        config.day = data.frequency_config.day;
      } else {
        const startDate = new Date(data.start_date);

        config.month = startDate.getMonth() + 1;
        config.day = startDate.getDate();
      }
      config.adjustment = data.frequency_config?.adjustment || 'last';
      break;

    case 'daily':
      // No config needed for daily
      break;
  }

  return config;
}

/**
 * Calculate monthly occurrence handling edge cases
 */
export function calculateMonthlyOccurrence(
  date: Date,
  config: TFrequencyConfig
): Date {
  const targetDay = config.dayOfMonth || date.getDate();
  const adjustment = config.adjustment || 'last';
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(year, month + 1);

  // If target day exists in this month, use it
  if (targetDay <= daysInMonth) {
    return new Date(year, month, targetDay);
  }

  // Handle edge cases based on adjustment strategy
  switch (adjustment) {
    case 'last':
      // Use last day of month
      return new Date(year, month, daysInMonth);

    case 'next':
      // Use first day of next month
      return new Date(year, month + 1, 1);

    case 'skip':
      // Skip this month, return null (handled by caller)
      return new Date(year, month, -1); // Invalid date marker

    default:
      return new Date(year, month, daysInMonth);
  }
}

/**
 * Calculate yearly occurrence handling edge cases (Feb 29)
 */
export function calculateYearlyOccurrence(
  year: number,
  config: TFrequencyConfig
): Date {
  const targetMonth = (config.month || 1) - 1; // Convert to 0-based
  const targetDay = config.day || 1;
  const adjustment = config.adjustment || 'last';

  // Check if target date exists
  const daysInMonth = getDaysInMonth(year, targetMonth + 1);

  if (targetDay <= daysInMonth) {
    return new Date(year, targetMonth, targetDay);
  }

  // Handle edge cases (mainly Feb 29 in non-leap years)
  switch (adjustment) {
    case 'last':
      // Use last day of month (Feb 28)
      return new Date(year, targetMonth, daysInMonth);

    case 'next':
      // Use first day of next month (Mar 1)
      return new Date(year, targetMonth + 1, 1);

    case 'skip':
      // Skip this year
      return new Date(year, targetMonth, -1); // Invalid date marker

    default:
      return new Date(year, targetMonth, daysInMonth);
  }
}

/**
 * Build human-readable modification note
 */
export function buildModificationNote(
  scheduledDate: string,
  scheduledAmount: number,
  actualDate: string,
  actualAmount: number
): string {
  const notes: string[] = [];

  if (scheduledDate !== actualDate) {
    notes.push(`Date changed from ${scheduledDate} to ${actualDate}`);
  }

  if (scheduledAmount !== actualAmount) {
    notes.push(`Amount changed from ${scheduledAmount} to ${actualAmount}`);
  }

  return notes.join('. ');
}

export function calculateOccurrences(
  frequency: TFrequencyType,
  interval: number,
  config: TFrequencyConfig,
  start_date: Date,
  end_date: Date | null
): Date[] {
  const occurrences: Date[] = [];
  let current_date = new Date(start_date);

  const max_date = end_date ? new Date(end_date) : addDays(start_date, 365 * 5);
  const max_iterations = 10000;
  let iterations = 0;

  // Ensure start_date is not after max_date
  if (current_date > max_date) {
    return occurrences;
  }

  while (current_date <= max_date && iterations < max_iterations) {
    iterations++;

    switch (frequency) {
      case 'daily':
        if (current_date >= start_date && current_date <= max_date) {
          occurrences.push(new Date(current_date));
        }
        current_date = addDays(current_date, interval);
        break;

      case 'weekly':
        const days_of_week = config.daysOfWeek || [start_date.getDay()];

        // Find the Monday of the current iteration week
        const monday_of_week = new Date(current_date);
        const daysFromMonday = (current_date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

        monday_of_week.setDate(current_date.getDate() - daysFromMonday);

        // Generate occurrences for each specified day in this week
        for (const dayOfWeek of days_of_week.sort()) {
          const occurrence_date = new Date(monday_of_week);

          // Calculate offset from Monday (0=Monday, 1=Tuesday, ..., 6=Sunday)
          const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

          occurrence_date.setDate(monday_of_week.getDate() + offset);

          // Only add if it's >= start_date and <= max_date
          if (occurrence_date >= start_date && occurrence_date <= max_date) {
            occurrences.push(new Date(occurrence_date));
          }
        }

        // Move to the next interval (add weeks)
        current_date = addDays(current_date, 7 * interval);
        break;

      case 'monthly':
        const monthly_date = calculateMonthlyOccurrence(current_date, config);

        // Check if date is valid (not skipped) and within range
        if (monthly_date.getTime() > 0 && monthly_date >= start_date && monthly_date <= max_date) {
          occurrences.push(new Date(monthly_date));
        }

        current_date = addMonths(current_date, interval);
        break;

      case 'yearly':
        const year = current_date.getFullYear();
        const yearlyDate = calculateYearlyOccurrence(year, config);

        // Check if date is valid (not skipped) and within range
        if (yearlyDate.getTime() > 0 && yearlyDate >= start_date && yearlyDate <= max_date) {
          occurrences.push(new Date(yearlyDate));
        }

        current_date = addYears(current_date, interval);
        break;
    }
  }

  return occurrences
    .filter((date, index, self) => {
      const time = date.getTime();

      return self.findIndex(d => d.getTime() === time) === index;
    })
    .sort((a, b) => a.getTime() - b.getTime());
}

export async function getAllRecurringsByUser(
  user_id: TUser['user_id'],
  filters: TRecurringFilters = {}
) {
  let base_query = QUERY_STRING.GET_ALL_RECURRINGS_BY_USER;
  const params: any[] = [user_id];

  if (filters.status) {
    base_query += ' AND r.status = ?';
    params.push(filters.status);
  }

  if (filters.is_active !== undefined) {
    base_query += ' AND r.is_active = ?';
    params.push(filters.is_active ? 1 : 0);
  }

  if (filters.card_id) {
    base_query += ' AND r.card_id = ?';
    params.push(filters.card_id);
  }

  if (filters.frequency) {
    base_query += ' AND r.frequency = ?';
    params.push(filters.frequency);
  }

  base_query += ' ORDER BY r.created_at DESC';


  return await dbQuery<RowDataPacket[]>(base_query, params);
}

export async function getRecurringById(
  recurring_id: TRecurring['recurring_id'],
  user_id: TUser['user_id'],
  connection: PoolConnection | null = null
) {

  if (connection) {
    const [rows] = await connection.query<RowDataPacket[]>(
      QUERY_STRING.GET_RECURRINGS_DETAILS,
      [recurring_id, user_id]
    );

    if (rows.length === 0) {
      throw new ApiError('Recurring not found', 404);
    }

    return rows[0] as TRecurringResponse;

  } else {

    const rows = await dbQuery<RowDataPacket[]>(
      QUERY_STRING.GET_RECURRINGS_DETAILS,
      [recurring_id, user_id]
    );

    if (rows.length === 0) {
      throw new ApiError('Recurring not found', 404);
    }

    const instanceRows = await dbQuery<RowDataPacket[]>(
      QUERY_STRING.GET_ALL_INSTANCES_OF_RECURRING,
      [recurring_id]
    );

    return {
      ...rows[0],
      upcoming_instances: instanceRows,
    };
  }
}

export async function getRecurringInstancesOfUser(
  user_id: TUser['user_id'],
  filters: TRecurringInstanceFilters = {}
) {
  let query = QUERY_STRING.GET_RECURRING_INSTANCES;
  const params: any[] = [user_id];

  if (filters.status) {
    query += ' AND ri.status = ?';
    params.push(filters.status);
  }

  if (filters.card_id) {
    query += ' AND r.card_id = ?';
    params.push(filters.card_id);
  }

  if (filters.recurring_id) {
    query += ' AND ri.recurring_id = ?';
    params.push(filters.recurring_id);
  }

  if (filters.from_date) {
    query += ' AND ri.scheduled_date >= ?';
    params.push(filters.from_date);
  }

  if (filters.to_date) {
    query += ' AND ri.scheduled_date <= ?';
    params.push(filters.to_date);
  }

  if (filters.days_ahead) {
    query += ' AND ri.scheduled_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)';
    params.push(filters.days_ahead);
  }

  query += ' AND ri.status IN ("pending","overdue") ORDER BY ri.scheduled_date ASC LIMIT 20';

  return await dbQuery<RowDataPacket[]>(query, params);
}

export async function updateOverdueInstances(user_id: TUser['user_id']): Promise<void> {
  await dbQuery(QUERY_STRING.UPDATE_OVERDUE_INSTANCES, [user_id]);
}



export async function getRecurringInstancesWithBalances(
  user_id: TUser['user_id'],
  filters: TRecurringInstanceFilters = {}
) {
  const instances = await getRecurringInstancesOfUser(user_id, filters);

  if (instances.length === 0) {
    return [];
  }

  const cardId = filters.card_id || (instances[0] as any).card_id;

  if (!cardId) {
    return instances.map(instance => ({
      ...instance,
      old_balance: 0,
      new_balance: 0
    }));
  }

  const card = await getCardInfoById(cardId, user_id);
  const currentBalance = Number(card.card_balance);

  const sortedInstances = [...instances].sort((a, b) =>
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  );

  let runningBalance = currentBalance;
  const instancesWithBalances: any[] = [];

  sortedInstances.forEach((instance) => {
    const oldBalance = runningBalance;
    const change = instance.direction === 'in'
      ? Number(instance.scheduled_amount)
      : -Number(instance.scheduled_amount);
    const newBalance = runningBalance + change;

    instancesWithBalances.push({
      ...instance,
      old_balance: oldBalance,
      new_balance: newBalance
    });

    runningBalance = newBalance;
  });

  return instancesWithBalances;
}

export async function addNewRecurring(
  user_id: TUser['user_id'],
  recurring_data: TAddRecurringPayload
) {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    await validateCardOwnership(recurring_data.card_id, user_id);

    if (recurring_data.category_id) {
      await validateCategoryOwnership(recurring_data.category_id, user_id);
    }

    const frequencyConfig = JSON.stringify(buildFrequencyConfig(recurring_data));
    const interval = recurring_data.interval || 1;

    // Insert recurring record using connection for transaction
    const [result] = await connection.query<ResultSetHeader>(
      QUERY_STRING.INSERT_RECURRING,
      [
        user_id,
        recurring_data.card_id,
        recurring_data.category_id || null,
        recurring_data.recurring_name,
        recurring_data.amount,
        recurring_data.direction,
        recurring_data.frequency,
        interval,
        frequencyConfig,
        formatMYSQLDate(recurring_data.start_date),
        recurring_data.end_date ? formatMYSQLDate(recurring_data.end_date) : null
      ]
    );

    const recurring_id = result.insertId;

    await generateInstances(connection, 90, recurring_id, user_id);

    await connection.query(
      QUERY_STRING.INSERT_RECURRING_HISTORY,
      [
        recurring_id,
        user_id,
        JSON.stringify(['all']),
        JSON.stringify(recurring_data)
      ]
    );

    await connection.commit();

    return recurring_id;
  } catch (error) {
    await connection.rollback();
    console.error('Error creating recurring:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Generate instances for a recurring transaction
 */
export async function generateInstances(
  connection: PoolConnection,
  days_ahead: number = 90,
  recurring_id: TRecurring['recurring_id'],
  user_id: TUser['user_id']
) {

  const recurring = await getRecurringById(recurring_id, user_id, connection);

  // Find last instance date to know where to start
  const [last_instance_rows] = await connection.query<RowDataPacket[]>(
    QUERY_STRING.GET_LAST_INSTANCE_DATE,
    [recurring_id]
  );

  // Check if there are existing instances AND if the last_date is not NULL
  const has_existing_instances = last_instance_rows.length > 0 && last_instance_rows[0].last_date != null;

  const occurrences_start_date = has_existing_instances
    ? addDays(new Date(last_instance_rows[0].last_date), 1)
    : new Date(recurring.start_date);

  // Calculate end date
  const occurrences_end_date = recurring.end_date
    ? new Date(recurring.end_date)
    : addDays(new Date(), days_ahead);

  // Parse frequency_config safely
  let frequency_config: TFrequencyConfig = {};

  try {
    if (recurring.frequency_config) {
      if (typeof recurring.frequency_config === 'object') {
        frequency_config = recurring.frequency_config;
      } else if (typeof recurring.frequency_config === 'string') {
        frequency_config = JSON.parse(recurring.frequency_config);
      }
    }
  } catch (error) {
    console.error('Error parsing frequency_config:', recurring.frequency_config, error);
    frequency_config = {};
  }

  // Calculate occurrences
  const occurrences = calculateOccurrences(recurring.frequency, recurring.interval, frequency_config, occurrences_start_date, occurrences_end_date);

  let inserted_count = 0;

  for (const date of occurrences) {
    await connection.query(
      QUERY_STRING.INSERT_RECURRING_INSTANCE,
      [recurring_id, formatMYSQLDate(date.toISOString()), recurring.amount]
    );
    inserted_count++;
  }

  return inserted_count;
}

export async function getRecurringInstanceById(instance_id: TRecurringInstance['instance_id'], user_id: TUser['user_id']) {

  const instance = await dbQuery<RowDataPacket[]>(
    QUERY_STRING.GET_INSTANCE_WITH_RECURRING,
    [instance_id, user_id]
  );

  if (instance.length === 0) {
    throw new Error('Instance not found');
  }

  return instance[0];
}

export async function markInstanceAsCompleted(
  recurring_instance_id: TRecurringInstance['instance_id'],
  user_id: TUser['user_id'],
  overrides: {
    actual_date?: string;
    actual_amount?: number;
    notes?: string;
  } = {}
) {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    const instance = await getRecurringInstanceById(recurring_instance_id, user_id);

    if (instance.status !== 'pending' && instance.status !== 'overdue') {
      throw new ApiError(`Cannot complete instance with status: ${instance.status}`, 404);
    }



    const actual_date = overrides.actual_date ? moment(overrides.actual_date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
    const instance_date = moment(instance.scheduled_date).format('YYYY-MM-DD');

    const actual_amount = overrides.actual_amount || instance.scheduled_amount;

    const is_modified = actual_date !== instance_date || Number(actual_amount) !== Number(instance.scheduled_amount);

    await connection.query(
      QUERY_STRING.UPDATE_INSTANCE_COMPLETED,
      [
        is_modified ? 'modified' : 'completed',
        formatMYSQLDate(actual_date),
        actual_amount,
        overrides.notes || null,
        recurring_instance_id
      ]
    );

    await connection.query(
      QUERY_STRING.INSERT_INSTANCE_HISTORY,
      [
        instance.recurring_id,
        user_id,
        recurring_instance_id,
        is_modified ? 'instance_modified' : 'instance_completed',
        JSON.stringify(is_modified ? ['actual_date', 'actual_amount'] : []),
        JSON.stringify({ actual_date: actual_date, actual_amount: actual_amount })
      ]
    );

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function skipInstance(
  recurring_instance_id: TRecurringInstance['instance_id'],
  user_id: TUser['user_id'],
  reason: string | null = null
) {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    const instance = await getRecurringInstanceById(recurring_instance_id, user_id);

    await connection.query(
      QUERY_STRING.UPDATE_INSTANCE_SKIPPED,
      [reason, recurring_instance_id]
    );

    await connection.query(
      QUERY_STRING.ADD_SKIP_HISTORY,
      [instance.recurring_id, user_id, recurring_instance_id, reason]
    );

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createTransactionFromInstance(
  recurring_instance_id: TRecurringInstance['instance_id'],
  user_id: TUser['user_id'],
  transaction_payload: {
    amount: number;
    transaction_date: string;
    category_id?: string;
    note?: string;
  }
) {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    // Load instance inside the flow
    const instance = await getRecurringInstanceById(recurring_instance_id, user_id);

    if (instance.status !== 'pending' && instance.status !== 'overdue') {
      throw new Error(`Cannot create transaction for instance with status: ${instance.status}`);
    }

    // Validate category ownership if category_id is provided
    if (transaction_payload.category_id) {
      await validateCategoryOwnership(Number(transaction_payload.category_id), user_id);
    }

    const actual_date = transaction_payload.transaction_date || new Date().toISOString();
    const actual_amount = transaction_payload.amount || instance.scheduled_amount;
    const is_modified = actual_date !== instance.scheduled_date || actual_amount !== instance.scheduled_amount;

    // Create transaction from recurring instance within the current transaction
    const [add_transaction_result] = await connection.query<ResultSetHeader>(
      QUERY_STRING.ADD_TRANSACTION_FROM_RECURRING_INSTANCE,
      [
        instance.card_id,
        transaction_payload.category_id ?? instance.category_id,
        transaction_payload.note || instance.recurring_name,
        actual_amount,
        instance.direction,
        formatMYSQLDate(actual_date),
        recurring_instance_id,
        transaction_payload.note || (is_modified ? buildModificationNote(
          instance.scheduled_date,
          instance.scheduled_amount,
          actual_date,
          actual_amount
        ) : null)
      ]
    );

    const transaction_id = add_transaction_result.insertId;

    // Recalculate and update card balance inside the current transaction/connection
    const [balanceRows] = await connection.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) as balance FROM transactions_new WHERE card_id = ?`,
      [instance.card_id]
    );

    const newBalance = Number((balanceRows as any)[0]?.balance ?? 0);

    await connection.query(
      QUERY_STRING.UPDATE_CARD_BALANCE,
      [newBalance, instance.card_id]
    );

    // Commit the transaction creation and balance update first
    await connection.commit();

    // Now mark the instance as completed using the dedicated function which
    // will insert history. It opens its own transaction.
    await markInstanceAsCompleted(recurring_instance_id, user_id, {
      actual_date,
      actual_amount,
      notes: transaction_payload.note || null,
      // include transaction_id so markInstanceAsCompleted can link it when updating instance
      // (markInstanceAsCompleted reads overrides.transaction_id)
      ...({ transaction_id } as any)
    });

    return {
      success: true,
      transaction_id
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getProjectedBalance(
  user_id: TUser['user_id'],
  card_id: TCard['card_id'],
  up_to_date: string,
  from_date: string = new Date().toISOString()
) {

  await validateCardOwnership(card_id, user_id);

  const card = await getCardInfoById(card_id, user_id);

  const instances = await dbQuery<RowDataPacket[]>(
    QUERY_STRING.GET_PROJECTED_BALANCE_INSTANCES,
    [card_id, user_id, formatMYSQLDate(from_date), formatMYSQLDate(up_to_date)]
  );

  let runningBalance = card.card_balance;
  const projections = instances.map((instance: any) => {
    const change = instance.direction === 'in' ? instance.scheduled_amount : -instance.scheduled_amount;

    runningBalance += change;

    return {
      date: instance.scheduled_date,
      balance: runningBalance,
      recurring_name: instance.recurring_name,
      amount: instance.scheduled_amount,
      direction: instance.direction
    };
  });

  return {
    current_balance: card.card_balance,
    projected_balance: runningBalance,
    projections
  };
}

export async function updateRecurring(
  recurring_id: TRecurring['recurring_id'],
  user_id: TUser['user_id'],
  updates: TAddRecurringPayload,
  options: UpdateRecurringOptions = {}
) {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    const old_recurring = await getRecurringById(recurring_id, user_id);

    await validateCardOwnership(updates.card_id, user_id);

    if (updates.category_id) {
      await validateCategoryOwnership(updates.category_id, user_id);
    }

    const new_frequency_config = JSON.stringify(buildFrequencyConfig(updates));
    const new_interval = updates.interval || 1;

    const update_values: any[] = [
      updates.recurring_name,
      updates.amount,
      updates.direction,
      updates.card_id,
      updates.category_id || null,
      updates.frequency,
      new_interval,
      new_frequency_config,
      formatMYSQLDate(updates.start_date),
      updates.end_date ? formatMYSQLDate(updates.end_date) : null,
    ];

    // Execute update
    const update_query = `UPDATE recurrings SET recurring_name = ?, amount = ?, direction = ?, card_id = ?, category_id = ?, frequency = ?, \`interval\` = ?, frequency_config = ?, start_date = ?, end_date = ?, updated_at = NOW() WHERE recurring_id = ?`;

    update_values.push(recurring_id);

    await connection.query(update_query, update_values);

    if (options.apply_to_future || options.recreate_instances) {

      await connection.query(
        QUERY_STRING.DELETE_PENDING_INSTANCES,
        [recurring_id]
      );

      if (options.recreate_instances) {
        await generateInstances(connection, 90, recurring_id, user_id);
      }
    }

    await connection.query(
      QUERY_STRING.INSERT_UPDATE_HISTORY,
      [
        recurring_id,
        user_id,
        JSON.stringify(old_recurring),
        JSON.stringify(updates)
      ]
    );

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const validateRecurringOwnership = async (recurring_id: TRecurring['recurring_id'], user_id: TUser['user_id']) => {

  const recurring = await dbQuery<RowDataPacket[]>(
    QUERY_STRING.GET_RECURRING_BY_ID,
    [recurring_id]
  );

  if (recurring.length === 0) {
    throw new ApiError('Recurring not found', 404);
  }

  if (Number(recurring[0].user_id) !== Number(user_id)) {
    throw new ApiError("You do not have permission to access this recurring transaction", 403);
  }

  return true;
}

export async function removeRecurring(
  recurring_id: TRecurring['recurring_id'],
  user_id: TUser['user_id'],
  options: TRemoveRecurringOptions = {}
) {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    await validateRecurringOwnership(recurring_id, user_id);

    if (options.delete_instances) {
      let delete_recurring_instance_query = 'DELETE FROM recurring_instances WHERE recurring_id = ?';

      if (options.delete_future_only) {
        delete_recurring_instance_query += ' AND scheduled_date > NOW()';
      }

      if (options.keep_completed_transactions) {
        delete_recurring_instance_query += ' AND status IN ("pending", "overdue")';
      }

      await connection.query(delete_recurring_instance_query, [recurring_id]);
    } else {
      await connection.query(
        QUERY_STRING.CANCEL_FUTURE_INSTANCES,
        [recurring_id]
      );
    }

    await connection.query(
      QUERY_STRING.UPDATE_RECURRING_CANCELLED,
      [recurring_id]
    );

    await connection.query(
      QUERY_STRING.INSERT_CANCEL_HISTORY,
      [recurring_id, user_id, JSON.stringify(options)]
    );

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteRecurring(
  recurring_id: TRecurring['recurring_id'],
  user_id: TUser['user_id'],
) {

  await validateRecurringOwnership(recurring_id, user_id);

  await dbQuery(QUERY_STRING.DELETE_RECURRING, [recurring_id]);

  return true;
}

export async function getRecurringAnalysis(user_id: TUser['user_id'], card_id: TCard['card_id'] | null = null) {
  console.log("🚀 ~ getRecurringAnalysis ~ card_id:", card_id)
  if (card_id) {
    await validateCardOwnership(card_id, user_id);
  }

  const base_query = card_id ? QUERY_STRING.GET_ALL_RECURRING_ANALYSIS_BY_CARD : QUERY_STRING.GET_ALL_RECURRING_ANALYSIS;

  const [query] = await dbQuery<RowDataPacket[]>(
    base_query,
    card_id ? [user_id, card_id] : [user_id]
  );

  return query;
}