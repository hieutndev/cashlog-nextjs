import { TCard } from './card';
import { TCategory } from './category';
import { TTransaction } from './transaction';
import { TUser } from './user';

export type TFrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export const RECURRING_FREQUENCY_TYPES: TFrequencyType[] = ['daily', 'weekly', 'monthly', 'yearly'];

export type TRecurringDirection = 'in' | 'out';
export const RECURRING_DIRECTIONS: TRecurringDirection[] = ['in', 'out'];

export type TRecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export const RECURRING_STATUS: TRecurringStatus[] = ['active', 'paused', 'completed', 'cancelled'];

export type TRecurringInstanceStatus = 'pending' | 'completed' | 'skipped' | 'modified' | 'overdue' | 'cancelled';
export const RECURRING_INSTANCE_STATUS: TRecurringInstanceStatus[] = ['pending', 'completed', 'skipped', 'modified', 'overdue', 'cancelled'];

export type TAdjustmentType = 'last' | 'next' | 'skip';
export const RECURRING_ADJUSTMENT_TYPES: TAdjustmentType[] = ['last', 'next', 'skip'];

export type TRecurringHistoryAction = 'created' | 'updated' | 'paused' | 'resumed' | 'completed' | 'cancelled' | 'instance_modified' | 'instance_skipped';
export const RECURRING_HISTORY_ACTIONS: TRecurringHistoryAction[] = ['created', 'updated', 'paused', 'resumed', 'completed', 'cancelled', 'instance_modified', 'instance_skipped'];

export interface TFrequencyConfig {
  // Weekly
  daysOfWeek?: number[]; // 0-6 (Sun-Sat)

  // Monthly
  dayOfMonth?: number; // 1-31
  adjustment?: TAdjustmentType;

  // Yearly
  month?: number; // 1-12
  day?: number; // 1-31
}

export type TRecurringResponse = TRecurring & {
  upcoming_instances?: TRecurringInstance[];
  total_instances: number;
  completed_instances: number;
  skipped_instances: number;
  overdue_instances: number;
} & TCard & TCategory & { user_id: TUser['user_id'] };

export interface RecurringInstance {
  instance_id: string;
  recurring_id: TRecurring['recurring_id'];
  scheduled_date: string;
  scheduled_amount: number;
  status: TRecurringInstanceStatus;
  transaction_id: TTransaction['transaction_id'] | null;
  actual_date: string | null;
  actual_amount: number | null;
  notes: string | null;
  skip_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;

  // Joined data
  recurring?: TRecurringResponse;
  recurring_name?: string;
  direction?: TRecurringDirection;
  frequency?: TFrequencyType;
  card_name?: string;
  card_number?: string;
  category_name?: string;
  transaction?: TTransaction;
  transaction_link?: string;

  // Calculated balances (optional, added by service layer)
  old_balance?: number;
  new_balance?: number;
}

export interface RecurringStats {
  total_instances: number;
  completed_instances: number;
  skipped_instances: number;
  total_amount: number;
  average_amount: number;
}

export interface ProjectedBalance {
  current_balance: number;
  projected_balance: number;
  projections: ProjectionPoint[];
}

export interface ProjectionPoint {
  date: string;
  balance: number;
  recurring_name: string;
  amount: number;
  direction: TRecurringDirection;
}

export interface TAddRecurringPayload {
  recurring_name: string;
  amount: number;
  direction: TRecurringDirection;
  card_id: TCard['card_id'];
  category_id?: TCategory['category_id'] | null;
  frequency: TFrequencyType;
  interval?: number;
  frequency_config: TFrequencyConfig;
  start_date: string;
  end_date?: string | null;
  notes?: string;
}

export type TUpdateRecurringPayload = TAddRecurringPayload & {
  apply_to_future?: boolean;
  recreate_instances?: boolean;
}

export type TRecurringForm = TAddRecurringPayload & TUpdateRecurringPayload;

export interface TRemoveRecurringOptions {
  delete_instances?: boolean;
  delete_future_only?: boolean;
  keep_completed_transactions?: boolean;
}

export interface TRecurringFilters {
  status?: TRecurringStatus;
  is_active?: boolean;
  card_id?: TCard['card_id'];
  frequency?: TFrequencyType;
}

export interface TRecurringInstanceFilters {
  status?: TRecurringInstanceStatus;
  card_id?: TCard['card_id'];
  recurring_id?: TRecurring['recurring_id'];
  from_date?: string;
  to_date?: string;
  days_ahead?: number;
}


export type UpdateRecurringPayload = {
  recurring_name: string;
  amount: number;
  direction: TRecurringDirection;
  category_id: number | null;
  frequency: TFrequencyType;
  interval: number;
  start_date: string;
  end_date: string | null;
  apply_to_future: boolean;
  recreate_instances: boolean;
  notes: string;
}

export type TRecurring = {
  recurring_id: number;
  user_id: number;
  card_id: number;
  category_id: number
  recurring_name: string;
  amount: number;
  direction: TRecurringDirection;
  frequency: TFrequencyType;
  interval: number;
  frequency_config: TFrequencyConfig;
  start_date: string;
  end_date: string;
  is_active: number;
  status: TRecurringStatus;
  created_at: string;
  updated_at: string;
}

export type TRecurringInstance = {
  instance_id: number;
  recurring_id: TRecurring['recurring_id'];
  scheduled_date: string;
  scheduled_amount: number;
  status: TRecurringInstanceStatus;
  transaction_id: number;
  actual_date: string;
  actual_amount: number;
  notes: string;
  skip_reason: string;
  created_at: string;
  updated_at: string;
  completed_at: string;
}

export type TRecurringHistory = {
  history_id: number;
  recurring_id: TRecurring['recurring_id'];
  user_id: number;
  instance_id: number;
  action: TRecurringHistoryAction;
  changed_fields: Record<string, any>;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  reason: string;
  created_at: string;
}

export type TRecurringInstanceProjection = {
  instance_id: TRecurringInstance['instance_id'],
  recurring_id: TRecurring['recurring_id'],
  scheduled_date: string,
  scheduled_amount: number,
  status: TRecurringInstanceStatus,
  transaction_id: TTransaction['transaction_id'] | null,
  actual_date: string | null,
  actual_amount: number | null,
  notes: string | null,
  skip_reason: string | null,
  created_at: string,
  updated_at: string,
  completed_at: string | null,
  recurring_name: string,
  direction: TRecurringDirection,
  frequency: TFrequencyType,
  card_name: string,
  category_name: string | null,
  category_id: TCategory['category_id'] | null,
  transaction_link: string | null,
  old_balance: number,
  new_balance: number
}

export type TCompleteInstanceFormData = {
  actual_date: string;
  actual_amount: number;
  notes: string;
  category_id?: TCategory['category_id'];
}

export type TRecurringAnalysis = {
  total_instances: number;
  count_completed: number;
  count_pending: number;
  count_overdue: number;
  count_skipped: number;
}

export type TRecurringInstancesResponse = {
  instances: TRecurringInstanceProjection[],
  analysis: TRecurringAnalysis
}