import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from backend directory, workspace root, and parent directory
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "drishti_ai",
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true
});

try {
    await pool.query("SELECT 1 AS connected");
    console.log("✅ MySQL connected successfully!");
} catch (error) {
    console.warn(`⚠️ MySQL initial connection notice: ${error.message}`);
    console.warn("   Verify MySQL is running and DB_PASSWORD is correct in .env");
}

export default pool;