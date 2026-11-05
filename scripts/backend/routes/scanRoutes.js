import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../db.js";

const router = express.Router();

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// ========================================
// MULTER CONFIGURATION
// ========================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});


// ========================================
// FILE VALIDATION
// ========================================

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only JPG, JPEG and PNG images are allowed"),
            false
        );
    }
};


const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});


// ========================================
// CREATE RETINAL SCAN
// ========================================

router.post(
    "/upload",
    upload.single("retinal_image"),
    async (req, res) => {
        try {
            const {
                patient_id,
                eye
            } = req.body;

            // Validate patient
            if (!patient_id) {
                return res.status(400).json({
                    success: false,
                    message: "Patient ID is required"
                });
            }

            // Validate eye
            if (!eye) {
                return res.status(400).json({
                    success: false,
                    message: "Eye selection is required"
                });
            }

            // Validate image
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Retinal image is required"
                });
            }

            // Check patient exists
            const [patients] = await db.query(
                "SELECT id FROM patients WHERE id = ?",
                [patient_id]
            );

            if (patients.length === 0) {
                // Delete uploaded image
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(404).json({
                    success: false,
                    message: "Patient not found"
                });
            }

            // Save scan
            const imagePath = `/uploads/${req.file.filename}`;
            const scanId = req.body.id || `scn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

            await db.query(
                `INSERT INTO retinal_scans
                (
                    id,
                    patient_id,
                    eye,
                    image_path,
                    ai_status
                )
                VALUES (?, ?, ?, ?, 'PENDING')`,
                [
                    scanId,
                    patient_id,
                    eye,
                    imagePath
                ]
            );

            res.status(201).json({
                success: true,
                message: "Retinal image uploaded successfully",
                scan: {
                    id: scanId,
                    patient_id,
                    eye,
                    image_path: imagePath,
                    ai_status: "PENDING"
                }
            });

        } catch (error) {
            console.error("❌ Scan upload error:", error.message);

            if (req.file && fs.existsSync(req.file.path)) {
                try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
            }

            res.status(500).json({
                success: false,
                message: "Failed to upload retinal image",
                error: error.message
            });
        }
    }
);


// ========================================
// GET ALL SCANS
// ========================================

router.get("/", async (req, res) => {
    try {
        const isPatient = req.get("x-user-role") && req.get("x-user-role") !== "admin";
        const userId = req.get("x-user-id");
        const ownership = isPatient && userId
            ? "WHERE LOWER(REPLACE(p.user_id, '_', '')) = LOWER(REPLACE(?, '_', ''))"
            : (isPatient ? "WHERE 1=0" : "");
        const values = isPatient && userId ? [userId] : [];

        const [scans] = await db.query(
            `SELECT
                rs.id,
                rs.patient_id,
                p.patient_code,
                p.name AS patient_name,
                rs.eye,
                rs.image_path,
                rs.image_quality,
                rs.quality_status,
                rs.dr_grade,
                rs.confidence,
                rs.risk_level,
                rs.ai_status,
                rs.created_at,
                p.user_id AS ownerUserId
             FROM retinal_scans rs
             INNER JOIN patients p
                ON rs.patient_id = p.id
             ${ownership}
             ORDER BY rs.created_at DESC`,
            values
        );

        res.json({
            success: true,
            data: scans
        });

    } catch (error) {
        console.error("❌ Get scans error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch scans",
            error: error.message
        });
    }
});


// ========================================
// GET SINGLE SCAN
// ========================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const isPatient = req.get("x-user-role") && req.get("x-user-role") !== "admin";
        const userId = req.get("x-user-id");
        const ownership = isPatient && userId
            ? " AND LOWER(REPLACE(p.user_id, '_', '')) = LOWER(REPLACE(?, '_', ''))"
            : (isPatient ? " AND 1=0" : "");
        const values = isPatient && userId ? [id, userId] : [id];

        const [scans] = await db.query(
            `SELECT
                rs.*,
                p.patient_code,
                p.name AS patient_name,
                p.age,
                p.gender,
                p.village,
                p.district,
                p.user_id AS ownerUserId
             FROM retinal_scans rs
             INNER JOIN patients p
                ON rs.patient_id = p.id
             WHERE rs.id = ?${ownership}`,
            values
        );

        if (scans.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Scan not found"
            });
        }

        res.json({
            success: true,
            data: scans[0]
        });

    } catch (error) {
        console.error("❌ Get scan error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch scan",
            error: error.message
        });
    }
});

export default router;