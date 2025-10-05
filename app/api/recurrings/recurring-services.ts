import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { z } from 'zod';

import { validateCardOwnership } from '../cards/card-services';
import { validateCategoryOwnership } from '../categories/categories-services';
import { updateCardBalance } from '../transactions/transaction-services';

import { getCardInfoById } from './../cards/card-services';


import { dbQuery, mysqlPool } from '@/libs/mysql';
import { QUERY_STRING } from '@/configs/query-string';
import {
  TAddRecurringPayload,
  TFrequencyConfig,
  UpdateRecurringOptions,
  TRemoveRecurringOptions,
  TRecurringResponse,
  RecurringInstance,
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
  daysOfWeek: z.number().min(0).max(6).optional().array(),
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
})

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);

  result.setMonth(result.getMonth() + months);

  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);

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

  while (current_date <= max_date && iterations < max_iterations) {
    iterations++;

    switch (frequency) {
      case 'daily':
        occurrences.push(new Date(current_date));
        current_date = addDays(current_date, interval);
        break;

      case 'weekly':
        const days_of_week = config.daysOfWeek || [current_date.getDay()];

        for (const day of days_of_week.sort()) {
          let occurrence_date = getNextDayOfWeek(current_date, day);

          if (occurrence_date < current_date) {
            occurrence_date = addDays(occurrence_date, 7 * interval);
          }

          if (occurrence_date <= max_date) {
            occurrences.push(new Date(occurrence_date));
          }
        }

        current_date = addDays(current_date, 7 * interval);
        break;

      case 'monthly':
        const monthly_date = calculateMonthlyOccurrence(current_date, config);

        // Check if date is valid (not skipped)
        if (monthly_date.getTime() > 0 && monthly_date <= max_date) {
          occurrences.push(new Date(monthly_date));
        }

        current_date = addMonths(current_date, interval);
        break;

      case 'yearly':
        const year = current_date.getFullYear();
        const yearlyDate = calculateYearlyOccurrence(year, config);

        // Check if date is valid (not skipped)
        if (yearlyDate.getTime() > 0 && yearlyDate <= max_date) {
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
): Promise<TRecurringResponse> {

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
      QUERY_STRING.GET_NEXT_SCHEDULED_INSTANCES,
      [recurring_id]
    );

    return {
      ...rows[0],
      upcoming_instances: instanceRows as RecurringInstance[],
    } as TRecurringResponse;
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

  query += ' ORDER BY ri.scheduled_date ASC';

  return await dbQuery<RowDataPacket[]>(query, params);
}

export async function updateOverdueInstances(user_id: TUser['user_id']): Promise<void> {
  await dbQuery(QUERY_STRING.UPDATE_OVERDUE_INSTANCES, [user_id]);
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

  const is_new_recurring = last_instance_rows.length === 0;

  const occurrences_start_date = !is_new_recurring
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
      throw new Error(`Cannot complete instance with status: ${instance.status}`);
    }

    const actual_date = overrides.actual_date || formatMYSQLDate(new Date().toISOString());
    const actual_amount = overrides.actual_amount || instance.scheduled_amount;
    const is_modified = actual_date !== instance.scheduled_date || actual_amount !== instance.scheduled_amount;

    const [add_transaction_result] = await connection.query<ResultSetHeader>(
      QUERY_STRING.ADD_TRANSACTION_FROM_RECURRING_INSTANCE,
      [
        user_id,
        instance.card_id,
        instance.category_id,
        instance.recurring_name,
        actual_amount,
        instance.direction,
        actual_date,
        recurring_instance_id,
        overrides.notes || (is_modified ? buildModificationNote(
          instance.scheduled_date,
          instance.scheduled_amount,
          actual_date,
          actual_amount
        ) : null)
      ]
    );

    const transaction_id = add_transaction_result.insertId;

    await updateCardBalance(instance.card_id, user_id);

    // Update instance
    await connection.query(
      QUERY_STRING.UPDATE_INSTANCE_COMPLETED,
      [
        is_modified ? 'modified' : 'completed',
        transaction_id,
        actual_date,
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
  return markInstanceAsCompleted(recurring_instance_id, user_id, {
    actual_date: transaction_payload.transaction_date,
    actual_amount: transaction_payload.amount,
    notes: transaction_payload.note
  });
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