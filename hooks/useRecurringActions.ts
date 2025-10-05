'use client';

import { useState, useCallback } from 'react';

import {
  RecurringFormData,
  UpdateRecurringOptions,
  TRemoveRecurringOptions,
  CompleteInstanceData,
  CreateTransactionFromInstanceData,
} from '@/types/recurring';
import {
  createRecurring,
  updateRecurring,
  deleteRecurring,
  completeInstance,
  skipInstance,
  createTransactionFromInstance,
} from '@/utils/api/recurring-api';

interface UseRecurringActionsReturn {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  completing: boolean;
  skipping: boolean;
  error: string | null;
  createRecurringAction: (data: RecurringFormData) => Promise<{ recurringId: string } | null>;
  updateRecurringAction: (
    id: string,
    data: Partial<RecurringFormData>,
    options?: UpdateRecurringOptions
  ) => Promise<boolean>;
  deleteRecurringAction: (id: string, options?: TRemoveRecurringOptions) => Promise<boolean>;
  completeInstanceAction: (id: string, overrides?: CompleteInstanceData) => Promise<boolean>;
  skipInstanceAction: (id: string, reason?: string) => Promise<boolean>;
  createTransactionAction: (id: string, data: CreateTransactionFromInstanceData) => Promise<boolean>;
}

export function useRecurringActions(): UseRecurringActionsReturn {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecurringAction = useCallback(async (data: RecurringFormData) => {
    try {
      setCreating(true);
      setError(null);

      const result = await createRecurring(data);

      return { recurringId: result.recurringId };
    } catch (err: any) {
      setError(err.message || 'Failed to create recurring transaction');
      console.error('Error creating recurring:', err);

      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  const updateRecurringAction = useCallback(
    async (
      id: string,
      data: Partial<RecurringFormData>,
      options?: UpdateRecurringOptions
    ) => {
      try {
        setUpdating(true);
        setError(null);

        await updateRecurring(id, data, options);

        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to update recurring transaction');
        console.error('Error updating recurring:', err);

        return false;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const deleteRecurringAction = useCallback(
    async (id: string, options?: TRemoveRecurringOptions) => {
      try {
        setDeleting(true);
        setError(null);

        await deleteRecurring(id, options);

        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to delete recurring transaction');
        console.error('Error deleting recurring:', err);

        return false;
      } finally {
        setDeleting(false);
      }
    },
    []
  );

  const completeInstanceAction = useCallback(
    async (id: string, overrides?: CompleteInstanceData) => {
      try {
        setCompleting(true);
        setError(null);

        await completeInstance(id, overrides);

        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to complete instance');
        console.error('Error completing instance:', err);

        return false;
      } finally {
        setCompleting(false);
      }
    },
    []
  );

  const skipInstanceAction = useCallback(async (id: string, reason?: string) => {
    try {
      setSkipping(true);
      setError(null);

      await skipInstance(id, reason);

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to skip instance');
      console.error('Error skipping instance:', err);

      return false;
    } finally {
      setSkipping(false);
    }
  }, []);

  const createTransactionAction = useCallback(
    async (id: string, data: CreateTransactionFromInstanceData) => {
      try {
        setCompleting(true);
        setError(null);

        await createTransactionFromInstance(id, data);

        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to create transaction');
        console.error('Error creating transaction:', err);

        return false;
      } finally {
        setCompleting(false);
      }
    },
    []
  );

  return {
    creating,
    updating,
    deleting,
    completing,
    skipping,
    error,
    createRecurringAction,
    updateRecurringAction,
    deleteRecurringAction,
    completeInstanceAction,
    skipInstanceAction,
    createTransactionAction,
  };
}
