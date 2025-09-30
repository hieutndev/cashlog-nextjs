export const QUERY_STRING = {
	GET_ALL_CARDS_OF_USER: `SELECT *
                            FROM cards
                            WHERE user_id = ?;`,
	GET_CARD_INFO: `SELECT *
                    FROM cards
                    WHERE card_id = ?;`,
	GET_CARD_INFO_BY_NAME: `SELECT *
                    FROM cards
                    WHERE card_name = ? AND user_id = ?;`,
	CREATE_NEW_CARD: `INSERT INTO cards(card_name, card_balance, card_color, bank_code, user_id)
                      VALUES (?, ?, ?, ?, ?);`,
	DELETE_CARD: `
        DELETE
        FROM cards
        WHERE card_id = ?;`,
	UPDATE_CARD_INFO: `UPDATE cards
                       SET card_name  = ?,
                           card_color = ?,
                           bank_code  = ?
                       WHERE card_id = ?;`,

	CREATE_NEW_FORECAST: `INSERT INTO recurrings(forecast_name, amount, direction, card_id, forecast_date, repeat_times,
                                                repeat_type)
                          VALUES (?, ?, ?, ?, ?, ?, ?);`,
	CREATE_NEW_FORECAST_DETAIL: `INSERT INTO recurring_details(transaction_amount, description,
                                                              forecast_id, transaction_date)
                                 VALUES (?, ?, ?, ?);`,
	GET_ALL_FORECASTS: `SELECT recurrings.*, cards.card_name, cards.bank_code
                        FROM recurrings
                                 INNER JOIN cards ON recurrings.card_id = cards.card_id;`,
	GET_ALL_FORECASTS_OF_USER: `
        SELECT f.forecast_id,
               f.forecast_name,
               f.amount,
               f.direction,
               f.forecast_date,
               f.repeat_times,
               f.repeat_type,
               f.created_at,

               c.card_id,
               c.card_name,
               c.card_balance,
               c.card_color,
               c.bank_code

        FROM recurrings f
                 JOIN
             cards c ON f.card_id = c.card_id
        WHERE c.user_id = ?;
    `,
	GET_FORECAST_BY_ID: `SELECT recurrings.*, cards.card_name, cards.bank_code
                         FROM recurrings
                                  INNER JOIN cards ON recurrings.card_id = cards.card_id
                         WHERE recurrings.forecast_id = ?;`,
	GET_FULL_FORECAST_DETAILS: `SELECT recurrings.forecast_id,
                                       recurrings.forecast_name,
                                       recurrings.amount,
                                       recurrings.direction,
                                       recurrings.forecast_date,
                                       recurring_details.transaction_id,
                                       recurring_details.transaction_amount,
                                       recurring_details.description,
                                       recurring_details.transaction_date,
                                       cards.card_name,
                                       cards.card_balance,
                                       cards.card_color,
                                       cards.bank_code,
                                       cards.card_id
                                FROM recurrings
                                         INNER JOIN
                                     recurring_details
                                     ON
                                         recurrings.forecast_id = recurring_details.forecast_id
                                         INNER JOIN
                                     cards
                                     ON
                                         recurrings.card_id = cards.card_id;`,
	GET_FULL_FORECAST_DETAILS_BY_FORECAST_ID: `SELECT *
                                               FROM recurring_details
                                               WHERE forecast_id = ?;`,
	GET_FULL_FORECAST_DETAILS_BY_CARD_ID: `SELECT recurrings.forecast_id,
                                                  recurrings.forecast_name,
                                                  recurrings.amount,
                                                  recurrings.direction,
                                                  recurrings.forecast_date,
                                                  recurrings.repeat_times,
                                                  recurrings.repeat_type,
                                                  recurring_details.transaction_id,
                                                  recurring_details.transaction_amount,
                                                  recurring_details.description,
                                                  recurring_details.transaction_date,
                                                  cards.card_id,
                                                  cards.card_name,
                                                  cards.card_balance,
                                                  cards.card_color,
                                                  cards.bank_code
                                           FROM recurrings
                                                    INNER JOIN
                                                recurring_details
                                                ON
                                                    recurrings.forecast_id = recurring_details.forecast_id
                                                    INNER JOIN
                                                cards
                                                ON
                                                    recurrings.card_id = cards.card_id
                                           WHERE cards.card_id = ?;`,
	DELETE_FORECAST: `DELETE
                      FROM recurring_details
                      where recurring_details.forecast_id = ?;
    DELETE
    from recurrings
    where forecast_id = ?;`,
	DELETE_FORECAST_TRANSACTION: `DELETE
                                  FROM recurring_details
                                  where recurring_details.forecast_id = ?`,
	UPDATE_FORECAST: `UPDATE recurrings
                      SET forecast_name = ?,
                          amount        = ?,
                          direction     = ?,
                          card_id       = ?,
                          forecast_date = ?,
                          repeat_times  = ?,
                          repeat_type   = ?,
                          WHERE forecast_id = ?;`,
	GET_TOTAL_BALANCE_OF_USER: `select sum(card_balance) as total_balance
                                from cards
                                where user_id = ?;`,
	CREATE_NEW_CATEGORY: `INSERT INTO transaction_categories(category_name, color, user_id)
                          VALUES (?, ?, ?);`,
	GET_ALL_CATEGORIES: `SELECT *
                         FROM transaction_categories;`,
	GET_ALL_CATEGORIES_OF_USER: `SELECT *
                                 FROM transaction_categories
                                 WHERE user_id = ?;`,
	UPDATE_CATEGORY: `UPDATE transaction_categories
                      SET category_name = ?,
                          color         = ?
                      WHERE category_id = ?
                        AND user_id = ?;`,
	REMOVE_CATEGORY: `
        DELETE
        FROM transaction_categories
        WHERE category_id = ?
          AND user_id = ?;`,
	GET_CATEGORY_BY_ID: `SELECT *
                         FROM transaction_categories
                         WHERE category_id = ?;`,
	GET_CATEGORY_BY_NAME: `SELECT *
                                  FROM transaction_categories
                                  WHERE category_name = ?
                                    AND user_id = ?;`,
	GET_CATEGORY_BY_ID_AND_USER: `SELECT *
                                  FROM transaction_categories
                                  WHERE category_id = ?
                                    AND user_id = ?;`,
	CREATE_NEW_USER: `INSERT INTO users(username, email, password)
                      VALUES (?, ?, ?);`,
	GET_USER_BY_EMAIL: `SELECT *
                        FROM users
                        WHERE email = ?;`,
	GET_USER_BY_ID: `SELECT *
                     FROM users
                     WHERE user_id = ?;`,
	GET_ALL_USERS: `SELECT *
                    FROM users;`,
	CHANGE_USER_PASSWORD: `UPDATE users
                           SET password = ?
                           WHERE user_id = ?;`,
	UPDATE_REFRESH_TOKEN: `UPDATE users
                           SET refresh_token = ?
                           WHERE user_id = ?;`,
	ADD_TRANSACTION: `INSERT INTO transactions_new(amount, date, description, direction, card_id, category_id)
                      VALUES (?, ?, ?, ?, ?, ?);`,
	GET_ALL_TRANSACTIONS_OF_CARD: `SELECT *
                                   FROM transactions_new
                                   WHERE card_id = ?;`,
	GET_ALL_TRANSACTIONS_WITH_CARD_AND_CATEGORY_BY_USER_ID: `SELECT tn.transaction_id,
                                                                    tn.amount,
                                                                    tn.date,
                                                                    tn.description,
                                                                    tn.direction,
                                                                    tn.created_at,
                                                                    c.card_id,
                                                                    c.card_name,
                                                                    c.card_balance,
                                                                    c.card_color,
                                                                    c.bank_code,
                                                                    tc.category_id,
                                                                    tc.category_name,
                                                                    tc.color AS category_color,
                                                                    u.user_id
                                                             FROM transactions_new tn
                                                                      JOIN
                                                                  cards c ON tn.card_id = c.card_id
                                                                      JOIN
                                                                  users u ON c.user_id = u.user_id
                                                                      LEFT JOIN
                                                                  transaction_categories tc ON tn.category_id = tc.category_id
                                                             WHERE u.user_id = ?
                                                             ORDER BY tn.date DESC;`,
	GET_ALL_TRANSACTIONS_WITH_CARD_AND_CATEGORY_BY_USER_ID_PAGINATED: `SELECT tn.transaction_id,
                                                                    tn.amount,
                                                                    tn.date,
                                                                    tn.description,
                                                                    tn.direction,
                                                                    tn.created_at,
                                                                    c.card_id,
                                                                    c.card_name,
                                                                    c.card_balance,
                                                                    c.card_color,
                                                                    c.bank_code,
                                                                    tc.category_id,
                                                                    tc.category_name,
                                                                    tc.color AS category_color,
                                                                    u.user_id
                                                             FROM transactions_new tn
                                                                      JOIN
                                                                  cards c ON tn.card_id = c.card_id
                                                                      JOIN
                                                                  users u ON c.user_id = u.user_id
                                                                      LEFT JOIN
                                                                  transaction_categories tc ON tn.category_id = tc.category_id
                                                             WHERE u.user_id = ?
                                                             ORDER BY tn.date DESC
                                                                        
                                                             LIMIT ? OFFSET ?;`,
	GET_TRANSACTIONS_COUNT_BY_USER_ID: `SELECT COUNT(*) as total
                                        FROM transactions_new tn
                                                 JOIN cards c ON tn.card_id = c.card_id
                                                 JOIN users u ON c.user_id = u.user_id
                                        WHERE u.user_id = ?;`,
	GET_TRANSACTION_BY_ID: `SELECT *
                            FROM transactions_new
                            WHERE transaction_id = ?;`,
	UPDATE_CARD_BALANCE: `UPDATE cards
                          SET card_balance = ?
                          WHERE card_id = ?;`,
	INIT_TRANSACTION: `INSERT INTO transactions_new(amount, description, direction, card_id)
                       VALUES (?, ?, ?, ?);`,
	DELETE_TRANSACTION: `DELETE
                         FROM transactions_new
                         WHERE transaction_id = ?;`,
	UPDATE_TRANSACTION: `UPDATE transactions_new
                         SET amount      = ?,
                             date        = ?,
                             description = ?,
                             direction   = ?,
                             card_id     = ?,
                             category_id = ?
                         WHERE transaction_id = ?`,
	GET_CATEGORY_STATS_BY_USER_ID: `SELECT
                                        COALESCE(tc.category_name, 'Uncategorized') as category,
                                        COALESCE(tc.color, 'slate') as color,
                                        SUM(tn.amount) as total
                                    FROM transactions_new tn
                                    JOIN cards c ON tn.card_id = c.card_id
                                    JOIN users u ON c.user_id = u.user_id
                                    LEFT JOIN transaction_categories tc ON tn.category_id = tc.category_id
                                    WHERE u.user_id = ?
                                    GROUP BY tc.category_id, tc.category_name, tc.color
                                    HAVING total > 0
                                    ORDER BY total DESC`,

	// Optimized analytics queries for better performance
	GET_DAILY_ANALYTICS_BY_USER_ID: `
		SELECT 
			DATE(tn.date) as date,
			SUM(CASE WHEN tn.direction = 'in' THEN tn.amount ELSE 0 END) as income,
			SUM(CASE WHEN tn.direction = 'out' THEN tn.amount ELSE 0 END) as expense
		FROM transactions_new tn
		JOIN cards c ON tn.card_id = c.card_id
		WHERE c.user_id = ?
			AND tn.date >= ?
			AND tn.date <= ?
		GROUP BY DATE(tn.date)
		ORDER BY DATE(tn.date)
	`,

	GET_WEEKLY_ANALYTICS_BY_USER_ID: `
		SELECT 
			YEARWEEK(tn.date, 1) as week,
			YEAR(tn.date) as year,
			WEEK(tn.date, 1) as week_number,
			SUM(CASE WHEN tn.direction = 'in' THEN tn.amount ELSE 0 END) as income,
			SUM(CASE WHEN tn.direction = 'out' THEN tn.amount ELSE 0 END) as expense
		FROM transactions_new tn
		JOIN cards c ON tn.card_id = c.card_id
		WHERE c.user_id = ?
			AND tn.date >= ?
			AND tn.date <= ?
		GROUP BY YEARWEEK(tn.date, 1), YEAR(tn.date), WEEK(tn.date, 1)
		ORDER BY YEARWEEK(tn.date, 1)
	`,

	GET_MONTHLY_ANALYTICS_BY_USER_ID: `
		SELECT 
			YEAR(tn.date) as year,
			MONTH(tn.date) as month,
			SUM(CASE WHEN tn.direction = 'in' THEN tn.amount ELSE 0 END) as income,
			SUM(CASE WHEN tn.direction = 'out' THEN tn.amount ELSE 0 END) as expense
		FROM transactions_new tn
		JOIN cards c ON tn.card_id = c.card_id
		WHERE c.user_id = ?
			AND tn.date >= ?
			AND tn.date <= ?
		GROUP BY YEAR(tn.date), MONTH(tn.date)
		ORDER BY YEAR(tn.date), MONTH(tn.date)
	`,

	GET_YEARLY_ANALYTICS_BY_USER_ID: `
		SELECT 
			YEAR(tn.date) as year,
			SUM(CASE WHEN tn.direction = 'in' THEN tn.amount ELSE 0 END) as income,
			SUM(CASE WHEN tn.direction = 'out' THEN tn.amount ELSE 0 END) as expense
		FROM transactions_new tn
		JOIN cards c ON tn.card_id = c.card_id
		WHERE c.user_id = ?
			AND tn.date >= ?
			AND tn.date <= ?
		GROUP BY YEAR(tn.date)
		ORDER BY YEAR(tn.date)
	`,

	GET_PERIOD_TOTALS_BY_USER_ID: `
		SELECT 
			SUM(CASE WHEN tn.direction = 'in' THEN tn.amount ELSE 0 END) as total_income,
			SUM(CASE WHEN tn.direction = 'out' THEN tn.amount ELSE 0 END) as total_expense
		FROM transactions_new tn
		JOIN cards c ON tn.card_id = c.card_id
		WHERE c.user_id = ?
			AND tn.date >= ?
			AND tn.date <= ?
	`,
};
