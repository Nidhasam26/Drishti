import express from "express";
import db from "../db.js";

const router = express.Router();

// ========================================
// CREATE PATIENT
// ========================================

router.post("/", async (req, res) => {
    try {
        const {
            patient_code,
            name,
            age,
            gender,
            phone,
            village,
            district
        } = req.body;

        const authRole = req.get("x-user-role");
        const authUserId = req.get("x-user-id");

        let ownerUserId = null;
        if (authRole && authRole !== "admin") {
            const [owners] = await db.query(
                "SELECT id FROM users WHERE LOWER(REPLACE(id, '_', '')) = LOWER(REPLACE(?, '_', ''))",
                [authUserId || ""]
            );
            if (owners.length > 0) {
                ownerUserId = owners[0].id;
            }
        }

        if (!patient_code || !name || age == null || !gender) {
            return res.status(400).json({
                success: false,
                message: "Patient code, name, age and gender are required"
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM patients WHERE patient_code = ?",
            [patient_code]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Patient code already exists"
            });
        }

        const patientId = req.body.id || patient_code;

        await db.query(
            `INSERT INTO patients
            (id, patient_code, user_id, name, age, gender, phone, village, district)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            name = VALUES(name), age = VALUES(age), gender = VALUES(gender),
            phone = VALUES(phone), village = VALUES(village), district = VALUES(district)`,
            [
                patientId,
                patient_code,
                ownerUserId,
                name,
                age,
                gender,
                phone || null,
                village || null,
                district || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Patient registered successfully",
            patientId: patientId
        });

    } catch (error) {
        console.error("❌ Create patient error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to register patient",
            error: error.message
        });
    }
});


// ========================================
// GET ALL PATIENTS
// ========================================

router.get("/", async (req, res) => {
    try {
        const isPatient = req.get("x-user-role") && req.get("x-user-role") !== "admin";
        const userId = req.get("x-user-id");
        const where = isPatient && userId
            ? "WHERE LOWER(REPLACE(user_id, '_', '')) = LOWER(REPLACE(?, '_', ''))"
            : (isPatient ? "WHERE 1=0" : "");
        const values = isPatient && userId ? [userId] : [];

        const [patients] = await db.query(
            `SELECT id, patient_code, name, age, gender,
                    phone, village, district, user_id, created_at
             FROM patients
             ${where}
             ORDER BY created_at DESC`,
            values
        );

        res.json({
            success: true,
            data: patients
        });

    } catch (error) {
        console.error("❌ Get patients error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch patients",
            error: error.message
        });
    }
});


// ========================================
// GET ONE PATIENT
// ========================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const isPatient = req.get("x-user-role") && req.get("x-user-role") !== "admin";
        const userId = req.get("x-user-id");
        const ownership = isPatient && userId
            ? " AND LOWER(REPLACE(user_id, '_', '')) = LOWER(REPLACE(?, '_', ''))"
            : (isPatient ? " AND 1=0" : "");
        const values = isPatient && userId ? [id, userId] : [id];

        const [patients] = await db.query(
            `SELECT * FROM patients WHERE id = ?${ownership}`,
            values
        );

        if (patients.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        res.json({
            success: true,
            data: patients[0]
        });

    } catch (error) {
        console.error("❌ Get patient error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch patient",
            error: error.message
        });
    }
});


// ========================================
// UPDATE PATIENT
// ========================================

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            age,
            gender,
            phone,
            village,
            district
        } = req.body;

        const isPatient = req.get("x-user-role") && req.get("x-user-role") !== "admin";
        const userId = req.get("x-user-id");
        const ownership = isPatient && userId
            ? " AND LOWER(REPLACE(user_id, '_', '')) = LOWER(REPLACE(?, '_', ''))"
            : (isPatient ? " AND 1=0" : "");
        const values = [name, age, gender, phone || null, village || null, district || null, id];
        if (isPatient && userId) values.push(userId);

        const [result] = await db.query(
            `UPDATE patients
             SET name = ?,
                 age = ?,
                 gender = ?,
                 phone = ?,
                 village = ?,
                 district = ?
             WHERE id = ?${ownership}`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        res.json({
            success: true,
            message: "Patient updated successfully"
        });

    } catch (error) {
        console.error("❌ Update patient error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update patient",
            error: error.message
        });
    }
});

// ========================================
// DELETE PATIENT
// ========================================

router.delete("/:id", async (req, res) => {
    try {
        const isPatient = req.get("x-user-role") && req.get("x-user-role") !== "admin";
        const userId = req.get("x-user-id");
        const ownership = isPatient && userId
            ? " AND LOWER(REPLACE(user_id, '_', '')) = LOWER(REPLACE(?, '_', ''))"
            : (isPatient ? " AND 1=0" : "");
        const patientValues = isPatient && userId ? [req.params.id, userId] : [req.params.id];

        const [ownedPatient] = await db.query(
            `SELECT id FROM patients WHERE id = ?${ownership}`,
            patientValues
        );
        if (ownedPatient.length === 0) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        await db.query(
            "DELETE FROM retinal_scans WHERE patient_id = ?",
            [req.params.id]
        );

        const [result] = await db.query(
            "DELETE FROM patients WHERE id = ?",
            [req.params.id]
        );

        res.json({
            success: true,
            deleted: result.affectedRows > 0
        });
    } catch (error) {
        console.error("❌ Delete patient error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete patient",
            error: error.message
        });
    }
});

export default router;