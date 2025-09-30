import { handleError } from '../_helpers/handle-error';

import { dbQuery } from '@/libs/mysql';

export const runtime = 'nodejs';

export async function GET() {
    try {
        // total users
        const users = await dbQuery<any[]>(`SELECT COUNT(*) as total FROM users;`);

        // total cards
        const cards = await dbQuery<any[]>(`SELECT COUNT(*) as total FROM cards;`);

        // total transactions (transactions_new table)
        const transactions = await dbQuery<any[]>(`SELECT COUNT(*) as total FROM transactions_new;`);

        // total forecasts (main recurrings table)
        const forecasts = await dbQuery<any[]>(`SELECT COUNT(*) as total FROM recurrings;`);

        return Response.json({
            total_users: users && users[0] ? Number(users[0].total) : 0,
            total_cards: cards && cards[0] ? Number(cards[0].total) : 0,
            total_transactions: transactions && transactions[0] ? Number(transactions[0].total) : 0,
            total_forecasts: forecasts && forecasts[0] ? Number(forecasts[0].total) : 0,
        });
    } catch (error: unknown) {
        return handleError(error);
    }
}
