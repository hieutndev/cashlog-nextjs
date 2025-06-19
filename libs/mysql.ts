// lib/mysql.ts
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true // 👈 Enable multi-query support
});

export async function dbQuery<T = any>(
  sql: string,
  values?: any[]
): Promise<T> {
  const [results] = await pool.query(sql, values);

  return results as T;
}

export async function dbExecute<T = any>(
  sql: string,
  values?: any[]
): Promise<T> {
  const [result] = await pool.execute(sql, values);

  return result as T;
}
