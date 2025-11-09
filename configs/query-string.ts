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
	ADD_NEW_CARD: `INSERT INTO cards(card_name, card_balance, card_color, bank_code, card_number, user_id)
                      VALUES (?, ?, ?, ?, ?, ?);`,
	DELETE_CARD: `
        DELETE
        FROM cards
        WHERE card_id = ?;`,
	UPDATE_CARD_INFO: `UPDATE cards
                       SET card_name  = ?,
                           card_color = ?,
                           bank_code  = ?,
                           card_number = ?
                       WHERE card_id = ?;`,
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
                                                             ORDER BY tn.date DESC, tn.created_at DESC`,
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
                                        COALESCE(tc.color, '#64748B') as color,
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
	// All queries exclude initial balance transactions (description = 'Auto-generated when creating a new card')
	// to prevent double-counting since initial balances are already reflected in card_balance field
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
			AND tn.description != 'Auto-generated when creating a new card'
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
			AND tn.description != 'Auto-generated when creating a new card'
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
			AND tn.description != 'Auto-generated when creating a new card'
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
			AND tn.description != 'Auto-generated when creating a new card'
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
			AND tn.description != 'Auto-generated when creating a new card'
	`,

	GET_RECURRINGS_DETAILS: `SELECT 
          r.*,
          c.card_name,
          c.card_balance,
          c.bank_code,
          tc.category_name,
          (
            SELECT COUNT(*) 
            FROM recurring_instances 
            WHERE recurring_id = r.recurring_id
          ) as total_instances,
          (
            SELECT COUNT(*) 
            FROM recurring_instances 
            WHERE recurring_id = r.recurring_id AND status = 'completed'
          ) as completed_instances,
          (
            SELECT COUNT(*) 
            FROM recurring_instances 
            WHERE recurring_id = r.recurring_id AND status = 'skipped'
          ) as skipped_instances,
		   (
            SELECT COUNT(*) 
            FROM recurring_instances 
            WHERE recurring_id = r.recurring_id AND status = 'skipped'
          ) as skipped_instances,
          (
            SELECT COUNT(*) 
            FROM recurring_instances 
            WHERE recurring_id = r.recurring_id AND status = 'overdue'
          ) as overdue_instances,
          (
            SELECT SUM(actual_amount) 
            FROM recurring_instances 
            WHERE recurring_id = r.recurring_id AND status IN ('completed', 'modified')
          ) as total_amount
        FROM recurrings r
        LEFT JOIN cards c ON r.card_id = c.card_id
        LEFT JOIN transaction_categories tc ON r.category_id = tc.category_id
        WHERE r.recurring_id = ? AND r.user_id = ?`,

	// Recurring queries
	GET_ALL_RECURRINGS_BY_USER: `
		SELECT 
			r.*,
			c.card_name,
			c.bank_code,
			tc.category_name,
			(
				SELECT scheduled_date 
				FROM recurring_instances 
				WHERE recurring_id = r.recurring_id 
					AND status = 'pending' 
					AND scheduled_date >= CURDATE()
				ORDER BY scheduled_date ASC 
				LIMIT 1
			) as next_scheduled_date,
			(
				SELECT COUNT(*) 
				FROM recurring_instances 
				WHERE recurring_id = r.recurring_id
			) as total_instances,
			(
				SELECT COUNT(*) 
				FROM recurring_instances 
				WHERE recurring_id = r.recurring_id AND status = 'completed'
			) as completed_instances
		FROM recurrings r
		LEFT JOIN cards c ON r.card_id = c.card_id
		LEFT JOIN transaction_categories tc ON r.category_id = tc.category_id
		WHERE r.user_id = ?
	`,

	GET_RECURRING_INSTANCES: `
		SELECT 
			ri.*,
			r.recurring_name,
			r.direction,
			r.frequency,
			c.card_name,
			tc.category_name,
			tc.category_id,
			t.transaction_id as transaction_link
		FROM recurring_instances ri
		JOIN recurrings r ON ri.recurring_id = r.recurring_id
		LEFT JOIN cards c ON r.card_id = c.card_id
		LEFT JOIN transaction_categories tc ON r.category_id = tc.category_id
		LEFT JOIN transactions_new t ON ri.transaction_id = t.transaction_id
		WHERE r.user_id = ?
	`,

	GET_ALL_INSTANCES_OF_RECURRING: `
		SELECT * FROM recurring_instances
		WHERE recurring_id = ?
		ORDER BY scheduled_date ASC
	`,

	UPDATE_OVERDUE_INSTANCES: `
		UPDATE recurring_instances ri
		JOIN recurrings r ON ri.recurring_id = r.recurring_id
		SET ri.status = 'overdue'
		WHERE r.user_id = ? AND ri.status = 'pending' 
			AND ri.scheduled_date < CURDATE()
	`,

	VERIFY_CARD_OWNERSHIP: `
		SELECT card_id FROM cards WHERE card_id = ? AND user_id = ?
	`,

	VERIFY_CATEGORY_OWNERSHIP: `
		SELECT category_id FROM transaction_categories WHERE category_id = ? AND user_id = ?
	`,

	INSERT_RECURRING: `
		INSERT INTO recurrings (
			user_id, card_id, category_id, recurring_name, amount, direction,
			frequency, \`interval\`, frequency_config, start_date, end_date, is_active, status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'active')
	`,

	GET_RECURRING_BY_ID: `
		SELECT * FROM recurrings WHERE recurring_id = ?
	`,

	GET_RECURRING_BY_ID_AND_USER: `
		SELECT * FROM recurrings WHERE recurring_id = ? AND user_id = ?
	`,

	GET_LAST_INSTANCE_DATE: `
		SELECT MAX(scheduled_date) as last_date FROM recurring_instances WHERE recurring_id = ?
	`,

	INSERT_RECURRING_INSTANCE: `
		INSERT INTO recurring_instances (
			recurring_id, scheduled_date, scheduled_amount, status
		) VALUES (?, ?, ?, 'pending')
		ON DUPLICATE KEY UPDATE scheduled_amount = VALUES(scheduled_amount)
	`,

	INSERT_RECURRING_HISTORY: `
		INSERT INTO recurring_history (
			recurring_id, user_id, action, changed_fields, new_values
		) VALUES (?, ?, 'created', ?, ?)
	`,

	GET_INSTANCE_WITH_RECURRING: `
		SELECT ri.*, r.user_id, r.card_id, r.category_id, r.direction, r.recurring_name
		FROM recurring_instances ri
		JOIN recurrings r ON ri.recurring_id = r.recurring_id
		WHERE ri.instance_id = ? AND r.user_id = ?
	`,

	ADD_TRANSACTION_FROM_RECURRING_INSTANCE: `
		INSERT INTO transactions_new (
			card_id, category_id, description, amount, direction,
			date, source, is_recurring, recurring_instance_id, note
		) VALUES (?, ?, ?, ?, ?, ?, 'recurring', TRUE, ?, ?)
	`,

	GET_CARD_BALANCE: `
		SELECT card_balance FROM cards WHERE card_id = ?
	`,

	UPDATE_INSTANCE_COMPLETED: `
		UPDATE recurring_instances
		SET status = ?, actual_date = ?, actual_amount = ?,
				notes = ?, completed_at = NOW(), updated_at = NOW()
		WHERE instance_id = ?
	`,

	INSERT_INSTANCE_HISTORY: `
		INSERT INTO recurring_history (
			recurring_id, user_id, instance_id, action, changed_fields, new_values
		) VALUES (?, ?, ?, ?, ?, ?)
	`,

	UPDATE_INSTANCE_SKIPPED: `
		UPDATE recurring_instances
		SET status = 'skipped', skip_reason = ?, updated_at = NOW()
		WHERE instance_id = ?
	`,

	ADD_SKIP_HISTORY: `
		INSERT INTO recurring_history (
			recurring_id, user_id, instance_id, action, reason
		) VALUES (?, ?, ?, 'instance_skipped', ?)
	`,

	GET_PROJECTED_BALANCE_INSTANCES: `
		SELECT ri.scheduled_date, ri.scheduled_amount, r.recurring_name, r.direction
		FROM recurring_instances ri
		JOIN recurrings r ON ri.recurring_id = r.recurring_id
		WHERE r.card_id = ? AND r.user_id = ? AND ri.status = 'pending'
			AND ri.scheduled_date >= ? AND ri.scheduled_date <= ?
		ORDER BY ri.scheduled_date ASC
	`,

	UPDATE_RECURRING: `
		UPDATE recurrings SET updated_at = NOW()
		WHERE recurring_id = ?
	`,

	DELETE_PENDING_INSTANCES: `
		DELETE FROM recurring_instances
		WHERE recurring_id = ? AND status = 'pending' AND scheduled_date > NOW()
	`,

	INSERT_UPDATE_HISTORY: `
		INSERT INTO recurring_history (
			recurring_id, user_id, action, old_values, new_values
		) VALUES (?, ?, 'updated', ?, ?)
	`,

	CANCEL_FUTURE_INSTANCES: `
		UPDATE recurring_instances
		SET status = 'cancelled', updated_at = NOW()
		WHERE recurring_id = ? AND status IN ('pending', 'overdue')
	`,

	UPDATE_RECURRING_CANCELLED: `
		UPDATE recurrings
		SET status = 'cancelled', is_active = FALSE, updated_at = NOW()
		WHERE recurring_id = ?
	`,

	INSERT_CANCEL_HISTORY: `
		INSERT INTO recurring_history (
			recurring_id, user_id, action, reason
		) VALUES (?, ?, 'cancelled', ?)
	`,
	DELETE_RECURRING: `DELETE FROM recurrings WHERE recurring_id = ?`,
	GET_TOTAL_USERS_COUNT: `SELECT COUNT(*) as total FROM users`,
	GET_TOTAL_CARDS_COUNT: `SELECT COUNT(*) as total FROM cards`,
	GET_TOTAL_TRANSACTIONS_COUNT: `SELECT COUNT(*) as total FROM transactions_new`,
	GET_TOTAL_RECURRINGS_COUNT: `SELECT COUNT(*) as total FROM recurrings`,
	DELETE_TRANSACTIONS_BY_USER: `
		DELETE tn FROM transactions_new tn
		INNER JOIN cards c ON tn.card_id = c.card_id
		WHERE c.user_id = ?
	`,
	DELETE_RECURRINGS_BY_USER: `
		DELETE FROM recurrings
		WHERE user_id = ?
	`,
	DELETE_CATEGORIES_BY_USER: `DELETE FROM transaction_categories WHERE user_id = ?`,
	DELETE_CARDS_BY_USER: `DELETE FROM cards WHERE user_id = ?`,
	GET_ALL_RECURRING_ANALYSIS: `SELECT COUNT(*) AS total_instances,
COUNT(CASE WHEN STATUS IN ('completed', 'modified') THEN 1 END) AS count_completed,
COUNT(CASE WHEN STATUS = 'pending' THEN 1 END) AS count_pending,
COUNT(CASE WHEN STATUS = 'overdue' THEN 1 END) AS count_overdue,
COUNT(CASE WHEN STATUS = 'skipped' THEN 1 END) AS count_skipped
FROM
  recurring_instances
WHERE
  recurring_id IN (SELECT recurring_id FROM recurrings WHERE user_id = ?)`,
	GET_ALL_RECURRING_ANALYSIS_BY_CARD: `SELECT
  COUNT(*) AS total_instances,
  COUNT(CASE WHEN STATUS IN ('completed', 'modified') THEN 1 END) AS count_completed,
  COUNT(CASE WHEN STATUS = 'pending' THEN 1 END) AS count_pending,
  COUNT(CASE WHEN STATUS = 'overdue' THEN 1 END) AS count_overdue,
  COUNT(CASE WHEN STATUS = 'skipped' THEN 1 END) AS count_skipped
FROM
  recurring_instances
WHERE
  recurring_id IN (SELECT recurring_id FROM recurrings WHERE user_id = ? AND card_id = ?)`,
	GET_TOTAL_INITIAL_BALANCE_BY_USER: `SELECT SUM(tn.amount) as initial_total_assets
            FROM transactions_new tn
            JOIN cards c ON tn.card_id = c.card_id
            WHERE c.user_id = ?
                AND tn.description = 'Auto-generated when creating a new card'`,
};
