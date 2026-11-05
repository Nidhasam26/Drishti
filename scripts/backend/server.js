import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import db from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

app.use(cors());
app.use(express.json());

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/scans", scanRoutes);

async function resolveUserId(userId) {
    if (!userId) return null;
    const [users] = await db.query(
        "SELECT id FROM users WHERE LOWER(REPLACE(id, '_', '')) = LOWER(REPLACE(?, '_', ''))",
        [userId]
    );
    return users[0]?.id || null;
}

// Accept offline-first mutations from the browser sync queue.
app.post("/api/sync/batch", async (req, res) => {
    const { operation, entityType, entityId, idempotencyKey, payload } = req.body || {};

    if (!operation || !entityType || !entityId || !idempotencyKey || !payload) {
        return res.status(400).json({ success: false, message: "Invalid sync payload" });
    }

    try {
        if (entityType === "patient") {
            if (operation === "CREATE_PATIENT") {
                let ownerUserId = payload.userId
                    ? await resolveUserId(payload.userId)
                    : null;
                // If user doesn't exist in MySQL, insert user placeholder so fk_patient_user constraint succeeds
                if (payload.userId && !ownerUserId) {
                    try {
                        await db.query(
                            `INSERT INTO users (id, name, username, role)
                             VALUES (?, ?, ?, 'user')
                             ON DUPLICATE KEY UPDATE name = VALUES(name)`,
                            [payload.userId, payload.name || "App User", payload.username || payload.userId]
                        );
                        ownerUserId = payload.userId;
                    } catch {
                        ownerUserId = null;
                    }
                }
                await db.query(
                    `INSERT INTO patients
                    (id, patient_code, user_id, name, age, gender, phone, village, district)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    name = VALUES(name), age = VALUES(age), gender = VALUES(gender),
                    phone = VALUES(phone), village = VALUES(village), district = VALUES(district)`,
                    [entityId, payload.patient_code || entityId, ownerUserId, payload.name, payload.age || null,
                        payload.gender || null, payload.phone || null, payload.village || null,
                        payload.district || null]
                );
            } else if (operation === "UPDATE_PATIENT") {
                await db.query(
                    `UPDATE patients SET name = ?, age = ?, gender = ?, phone = ?, village = ?, district = ?
                     WHERE id = ?`,
                    [payload.name, payload.age || null, payload.gender || null, payload.phone || null,
                        payload.village || null, payload.district || null, entityId]
                );
            } else if (operation === "DELETE_PATIENT") {
                await db.query("DELETE FROM retinal_scans WHERE patient_id = ?", [entityId]);
                await db.query("DELETE FROM patients WHERE id = ?", [entityId]);
            }
        } else if (entityType === "scan") {
            if (operation === "CREATE_SCAN") {
                // Ensure patient exists in patients table so fk_retinal_scans_patient constraint succeeds
                if (payload.patient_id) {
                    const [existingPatient] = await db.query("SELECT id FROM patients WHERE id = ?", [payload.patient_id]);
                    if (existingPatient.length === 0) {
                        await db.query(
                            `INSERT INTO patients (id, patient_code, name, user_id)
                             VALUES (?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE name = VALUES(name)`,
                            [payload.patient_id, payload.patient_code || payload.patient_id, payload.patient_name || payload.patient_id, null]
                        );
                    }
                }
                await db.query(
                    `INSERT INTO retinal_scans
                    (id, patient_id, eye, image_path, ai_status, dr_grade, confidence, risk_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    eye = VALUES(eye), image_path = VALUES(image_path), ai_status = VALUES(ai_status),
                    dr_grade = VALUES(dr_grade), confidence = VALUES(confidence), risk_level = VALUES(risk_level)`,
                    [entityId, payload.patient_id, payload.eye || null, payload.image_path || null,
                        payload.ai_status || "PENDING", payload.ai_result?.grade ?? payload.dr_grade ?? null,
                        payload.ai_result?.confidence ?? payload.confidence ?? null,
                        payload.risk_level || null]
                );
            } else if (operation === "UPDATE_SCAN") {
                await db.query(
                    `UPDATE retinal_scans SET eye = ?, ai_status = ?, dr_grade = ?, confidence = ?, risk_level = ?
                     WHERE id = ?`,
                    [payload.eye || null, payload.ai_status || "PENDING",
                        payload.ai_result?.grade ?? payload.dr_grade ?? null,
                        payload.ai_result?.confidence ?? payload.confidence ?? null,
                        payload.risk_level || null, entityId]
                );
            } else if (operation === "DELETE_SCAN") {
                await db.query("DELETE FROM retinal_scans WHERE id = ?", [entityId]);
            }
        } else {
            return res.status(400).json({ success: false, message: `Unsupported entity: ${entityType}` });
        }

        res.json({ success: true, idempotencyKey });
    } catch (error) {
        console.error("Sync error:", error.message);
        res.status(500).json({ success: false, message: "Sync failed", error: error.message });
    }
});

// Test backend
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "DRISHTI AI backend is running"
    });
});

// Test MySQL
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS connected");

        res.json({
            success: true,
            message: "MySQL connected successfully",
            data: rows
        });
    } catch (error) {
        console.error("❌ Database error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 DRISHTI AI backend running on port ${PORT}`);
});