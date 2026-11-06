import express from "express";
import db from "../db.js";

const router = express.Router();

// ========================================
// GET ALL DOCTORS
// ========================================

router.get("/", async (req, res) => {
    try {
        const [doctors] = await db.query(
            "SELECT * FROM doctors ORDER BY name ASC"
        );

        const doctorIds = doctors.map(d => d.id);
        const daysByDoc = {};
        const slotsByDoc = {};
        const langsByDoc = {};
        const modesByDoc = {};

        if (doctorIds.length > 0) {
            const [days] = await db.query("SELECT doctor_id, day_of_week FROM doctor_available_days WHERE doctor_id IN (?)", [doctorIds]);
            const [slots] = await db.query("SELECT doctor_id, slot_time FROM doctor_available_slots WHERE doctor_id IN (?)", [doctorIds]);
            const [langs] = await db.query("SELECT doctor_id, language_name FROM doctor_languages WHERE doctor_id IN (?)", [doctorIds]);
            const [modes] = await db.query("SELECT doctor_id, mode FROM doctor_modes WHERE doctor_id IN (?)", [doctorIds]);

            days.forEach(r => {
                if (!daysByDoc[r.doctor_id]) daysByDoc[r.doctor_id] = [];
                daysByDoc[r.doctor_id].push(r.day_of_week);
            });
            slots.forEach(r => {
                if (!slotsByDoc[r.doctor_id]) slotsByDoc[r.doctor_id] = [];
                slotsByDoc[r.doctor_id].push(r.slot_time);
            });
            langs.forEach(r => {
                if (!langsByDoc[r.doctor_id]) langsByDoc[r.doctor_id] = [];
                langsByDoc[r.doctor_id].push(r.language_name);
            });
            modes.forEach(r => {
                if (!modesByDoc[r.doctor_id]) modesByDoc[r.doctor_id] = [];
                modesByDoc[r.doctor_id].push(r.mode);
            });
        }

        const enriched = doctors.map(d => ({
            id: d.id,
            name: d.name,
            title: d.title || "",
            role: d.role || "Ophthalmologist",
            specialty: d.specialty || "Retina Specialist",
            hospital: d.hospital || "District Eye Hospital",
            location: d.location || "Yavatmal, Maharashtra",
            fee: Number(d.fee) || 500,
            experience: d.experience || "5+ years",
            rating: Number(d.rating) || 4.9,
            reviewsCount: d.reviews_count || 10,
            avatarColor: d.avatar_color || "#0891b2",
            about: d.about || "",
            availableDays: daysByDoc[d.id] && daysByDoc[d.id].length > 0 ? daysByDoc[d.id] : ["Mon", "Tue", "Wed", "Thu", "Fri"],
            availableSlots: slotsByDoc[d.id] && slotsByDoc[d.id].length > 0 ? slotsByDoc[d.id] : ["09:30 AM", "11:00 AM", "02:00 PM", "04:30 PM"],
            languages: langsByDoc[d.id] && langsByDoc[d.id].length > 0 ? langsByDoc[d.id] : ["Hindi", "English"],
            modes: modesByDoc[d.id] && modesByDoc[d.id].length > 0 ? modesByDoc[d.id] : ["in-person", "tele-consultation"]
        }));

        res.json({
            success: true,
            data: enriched
        });
    } catch (error) {
        console.error("❌ Get doctors error:", error.message);
        res.status(500).json({ success: false, message: "Failed to fetch doctors", error: error.message });
    }
});


// ========================================
// REGISTER NEW DOCTOR
// ========================================

router.post("/", async (req, res) => {
    try {
        const {
            name,
            title,
            role,
            specialty,
            hospital,
            location,
            fee,
            experience,
            about,
            availableDays,
            availableSlots,
            languages,
            modes,
            avatarColor
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Doctor name is required"
            });
        }

        const doctorId = req.body.id || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const docFee = fee ? parseFloat(fee) : 500.00;
        const color = avatarColor || "#0891b2";

        await db.query(
            `INSERT INTO doctors
             (id, name, title, role, specialty, hospital, location, fee, experience, rating, reviews_count, avatar_color, about)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name), title = VALUES(title), role = VALUES(role),
             specialty = VALUES(specialty), hospital = VALUES(hospital), location = VALUES(location),
             fee = VALUES(fee), experience = VALUES(experience), about = VALUES(about)`,
            [
                doctorId,
                name.trim(),
                title || "MD, Ophthalmology",
                role || "Consultant Retina Specialist",
                specialty || "Diabetic Retinopathy",
                hospital || "District Hospital Eye Centre",
                location || "Yavatmal, Maharashtra",
                docFee,
                experience || "5+ years",
                4.9,
                1,
                color,
                about || "Specialist in clinical screening and management of retinal conditions."
            ]
        );

        // Delete existing auxiliary entries if updating
        await db.query("DELETE FROM doctor_available_days WHERE doctor_id = ?", [doctorId]);
        await db.query("DELETE FROM doctor_available_slots WHERE doctor_id = ?", [doctorId]);
        await db.query("DELETE FROM doctor_languages WHERE doctor_id = ?", [doctorId]);
        await db.query("DELETE FROM doctor_modes WHERE doctor_id = ?", [doctorId]);

        // Insert auxiliary lists
        const days = Array.isArray(availableDays) && availableDays.length > 0 ? availableDays : ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        for (const day of days) {
            if (validDays.includes(day)) {
                await db.query("INSERT INTO doctor_available_days (doctor_id, day_of_week) VALUES (?, ?)", [doctorId, day]);
            }
        }

        const slots = Array.isArray(availableSlots) && availableSlots.length > 0 ? availableSlots : ["09:30 AM", "11:00 AM", "02:00 PM", "04:30 PM"];
        for (const slot of slots) {
            await db.query("INSERT INTO doctor_available_slots (doctor_id, slot_time) VALUES (?, ?)", [doctorId, slot]);
        }

        const langs = Array.isArray(languages) && languages.length > 0 ? languages : ["Hindi", "English"];
        for (const lang of langs) {
            await db.query("INSERT INTO doctor_languages (doctor_id, language_name) VALUES (?, ?)", [doctorId, lang]);
        }

        const validModes = ["in-person", "tele-consultation"];
        const mList = Array.isArray(modes) && modes.length > 0 ? modes : ["in-person", "tele-consultation"];
        for (const m of mList) {
            if (validModes.includes(m)) {
                await db.query("INSERT INTO doctor_modes (doctor_id, mode) VALUES (?, ?)", [doctorId, m]);
            }
        }

        const newDoctor = {
            id: doctorId,
            name: name.trim(),
            title: title || "MD, Ophthalmology",
            role: role || "Consultant Retina Specialist",
            specialty: specialty || "Diabetic Retinopathy",
            hospital: hospital || "District Hospital Eye Centre",
            location: location || "Yavatmal, Maharashtra",
            fee: docFee,
            experience: experience || "5+ years",
            rating: 4.9,
            reviewsCount: 1,
            avatarColor: color,
            about: about || "",
            availableDays: days,
            availableSlots: slots,
            languages: langs,
            modes: mList
        };

        res.status(201).json({
            success: true,
            message: "Doctor registered successfully",
            data: newDoctor
        });

    } catch (error) {
        console.error("❌ Register doctor error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to register doctor",
            error: error.message
        });
    }
});

export default router;

