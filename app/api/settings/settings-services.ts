import { ResultSetHeader } from 'mysql2';

import { mysqlPool } from '@/libs/mysql';
import { QUERY_STRING } from '@/configs/query-string';
import { TUser } from '@/types/user';

export async function resetUserData(userId: TUser['user_id']): Promise<boolean> {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query<ResultSetHeader>(
      QUERY_STRING.DELETE_TRANSACTIONS_BY_USER,
      [userId]
    );

    await connection.query<ResultSetHeader>(
      QUERY_STRING.DELETE_RECURRINGS_BY_USER,
      [userId]
    );

    await connection.query<ResultSetHeader>(
      QUERY_STRING.DELETE_CATEGORIES_BY_USER,
      [userId]
    );

    await connection.query<ResultSetHeader>(
      QUERY_STRING.DELETE_CARDS_BY_USER,
      [userId]
    );

    await connection.commit();

    return true;
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
