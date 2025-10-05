import {
  TRecurringResponse,
  RecurringInstance,
  RecurringFormData,
  CompleteInstanceData,
  CreateTransactionFromInstanceData,
  UpdateRecurringOptions,
  TRemoveRecurringOptions,
  TRecurringFilters,
  TRecurringInstanceFilters,
  ProjectedBalance,
  RecurringsListResponse,
  RecurringDetailResponse,
  InstancesListResponse,
  ProjectedBalanceResponse,
  RecurringApiResponse,
} from '@/types/recurring';

const API_BASE_URL = '/api/recurrings';

/**
 * Build query string from filters
 */
function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch all recurring transactions with optional filters
 */
export async function fetchRecurrings(
  filters?: TRecurringFilters
): Promise<TRecurringResponse[]> {
  const queryString = filters ? buildQueryString(filters) : '';
  const response = await fetch(`${API_BASE_URL}${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to fetch recurring transactions');
  }

  const data: RecurringsListResponse = await response.json();

  return data.data;
}

/**
 * Fetch a single recurring transaction by ID
 */
export async function fetchRecurring(id: string): Promise<TRecurringResponse> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to fetch recurring transaction');
  }

  const data: RecurringDetailResponse = await response.json();

  return data.data;
}

/**
 * Create a new recurring transaction
 */
export async function createRecurring(
  data: RecurringFormData
): Promise<{ recurringId: string; success: boolean; message: string }> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to create recurring transaction');
  }

  const result: RecurringApiResponse = await response.json();

  return result.data;
}

/**
 * Update a recurring transaction
 */
export async function updateRecurring(
  id: string,
  data: Partial<RecurringFormData>,
  options?: UpdateRecurringOptions
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to update recurring transaction');
  }

  const result: RecurringApiResponse = await response.json();

  return result.data;
}

/**
 * Delete or cancel a recurring transaction
 */
export async function deleteRecurring(
  id: string,
  options?: TRemoveRecurringOptions
): Promise<{ success: boolean; message: string }> {
  const queryString = options ? buildQueryString(options) : '';
  const response = await fetch(`${API_BASE_URL}/${id}${queryString}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to delete recurring transaction');
  }

  const result: RecurringApiResponse = await response.json();

  return result.data;
}

/**
 * Fetch recurring instances with optional filters
 */
export async function fetchInstances(
  filters?: TRecurringInstanceFilters
): Promise<RecurringInstance[]> {
  const queryString = filters ? buildQueryString(filters) : '';
  const response = await fetch(`${API_BASE_URL}/recurring-instances${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to fetch recurring instances');
  }

  const data: InstancesListResponse = await response.json();

  return data.data;
}

/**
 * Mark an instance as completed
 */
export async function completeInstance(
  id: string,
  overrides?: CompleteInstanceData
): Promise<{ success: boolean; transactionId: string; newBalance: number }> {
  const response = await fetch(`${API_BASE_URL}/recurring-instances/${id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(overrides || {}),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to complete instance');
  }

  const result: RecurringApiResponse = await response.json();

  return result.data;
}

/**
 * Skip an instance
 */
export async function skipInstance(
  id: string,
  reason?: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/recurring-instances/${id}/skip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to skip instance');
  }

  const result: RecurringApiResponse = await response.json();

  return result.data;
}

/**
 * Create a custom transaction from an instance
 */
export async function createTransactionFromInstance(
  id: string,
  data: CreateTransactionFromInstanceData
): Promise<{ success: boolean; transactionId: string }> {
  const response = await fetch(`${API_BASE_URL}/recurring-instances/${id}/create-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to create transaction');
  }

  const result: RecurringApiResponse = await response.json();

  return result.data;
}

/**
 * Fetch projected balance for a card
 */
export async function fetchProjectedBalance(
  cardId: string,
  upToDate: Date | string,
  fromDate?: Date | string
): Promise<ProjectedBalance> {
  const params: Record<string, any> = {
    card_id: cardId,
    up_to_date: typeof upToDate === 'string' ? upToDate : upToDate.toISOString().split('T')[0],
  };

  if (fromDate) {
    params.from_date = typeof fromDate === 'string' ? fromDate : fromDate.toISOString().split('T')[0];
  }

  const queryString = buildQueryString(params);
  const response = await fetch(`${API_BASE_URL}/recurring-instances/projected-balance${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.error || 'Failed to fetch projected balance');
  }

  const data: ProjectedBalanceResponse = await response.json();

  return data.data;
}

/**
 * Pause a recurring transaction
 */
export async function pauseRecurring(id: string): Promise<void> {
  await updateRecurring(id, {}, { apply_to_future: true });
}

/**
 * Resume a recurring transaction
 */
export async function resumeRecurring(id: string): Promise<void> {
  await updateRecurring(id, {}, { apply_to_future: true });
}
