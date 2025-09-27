import { ResultSetHeader } from "mysql2";

import { dbQuery } from "@/libs/mysql";
import { ApiError } from "@/types/api-error";

export const resetUserData = async (userId: string | number) => {
    try {
        // Start a transaction to ensure data consistency
        await dbQuery("START TRANSACTION");

        // Delete all transactions for the user (through cards)
        await dbQuery<ResultSetHeader>(`
            DELETE tn FROM transactions_new tn
            INNER JOIN cards c ON tn.card_id = c.card_id
            WHERE c.user_id = ?
        `, [userId]);

        // Delete all forecast details (through forecasts and cards)
        await dbQuery<ResultSetHeader>(`
            DELETE fd FROM forecast_details fd
            INNER JOIN forecasts f ON fd.forecast_id = f.forecast_id
            INNER JOIN cards c ON f.card_id = c.card_id
            WHERE c.user_id = ?
        `, [userId]);

        // Delete all forecasts for the user (through cards)
        await dbQuery<ResultSetHeader>(`
            DELETE f FROM forecasts f
            INNER JOIN cards c ON f.card_id = c.card_id
            WHERE c.user_id = ?
        `, [userId]);

        // Delete all transaction categories for the user
        await dbQuery<ResultSetHeader>(`
            DELETE FROM transaction_categories
            WHERE user_id = ?
        `, [userId]);

        // Delete all cards for the user
        await dbQuery<ResultSetHeader>(`
            DELETE FROM cards
            WHERE user_id = ?
        `, [userId]);

        // Commit the transaction
        await dbQuery("COMMIT");

        return true;
    } catch (error: unknown) {
        // Rollback the transaction in case of error
        await dbQuery("ROLLBACK");
        throw new ApiError((error as Error).message || "Error resetting user data", 500);
    }
};
