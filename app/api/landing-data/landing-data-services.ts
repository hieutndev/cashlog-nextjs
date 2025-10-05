import { dbQuery } from '@/libs/mysql';
import { QUERY_STRING } from '@/configs/query-string';

export interface LandingDataStats {
  total_users: number;
  total_cards: number;
  total_transactions: number;
  total_forecasts: number;
}

export async function getLandingDataStats(): Promise<LandingDataStats> {
  const users = await dbQuery<any[]>(QUERY_STRING.GET_TOTAL_USERS_COUNT);
  const cards = await dbQuery<any[]>(QUERY_STRING.GET_TOTAL_CARDS_COUNT);
  const transactions = await dbQuery<any[]>(QUERY_STRING.GET_TOTAL_TRANSACTIONS_COUNT);
  const forecasts = await dbQuery<any[]>(QUERY_STRING.GET_TOTAL_RECURRINGS_COUNT);

  return {
    total_users: users && users[0] ? Number(users[0].total) : 0,
    total_cards: cards && cards[0] ? Number(cards[0].total) : 0,
    total_transactions: transactions && transactions[0] ? Number(transactions[0].total) : 0,
    total_forecasts: forecasts && forecasts[0] ? Number(forecasts[0].total) : 0,
  };
}
