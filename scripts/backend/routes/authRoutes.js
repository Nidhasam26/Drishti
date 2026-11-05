import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

// ========================================
// REGISTER
// ========================================

router.post("/register", async (req, res) => {
    try {
        const { name, email, username, password, pin, role } = req.body;

        const effectiveIdentifier = email || username;
        const effectiveSecret = password || pin;

        if (!name || !effectiveIdentifier || !effectiveSecret) {
            return res.status(400).json({
                success: false,
                message: "Name, email/username and password/PIN are required"
            });
        }

        const effectiveUsername = username
            ? username.trim().toLowerCase()
            : (email ? email.split("@")[0].toLowerCase() : `usr_${Date.now()}`);

        const effectiveEmail = email
            ? email.trim().toLowerCase()
            : `${effectiveUsername}@drishti.local`;

        // Check if user already exists
        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE (email IS NOT NULL AND email = ?) OR (username IS NOT NULL AND username = ?)",
            [effectiveEmail, effectiveUsername]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email or username already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(effectiveSecret, 10);
        const userRole = role || "health_worker";
        const userId = req.body.id || `usr_${Date.now()}`;

        // Insert user
        await db.query(
            `INSERT INTO users (id, name, username, email, password, pin_hash, role)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, name, effectiveUsername, effectiveEmail, hashedPassword, hashedPassword, userRole]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            userId: userId
        });

    } catch (error) {
        console.error("❌ Register error:", error.message);

        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
});


// ========================================
// LOGIN
// ========================================

router.post("/login", async (req, res) => {
    try {
        const { email, username, password, pin } = req.body;
        const identifier = (email || username || "").trim();
        const secret = (password || pin || "").trim();

        if (!identifier || !secret) {
            return res.status(400).json({
                success: false,
                message: "Email/username and password/PIN are required"
            });
        }

        // Find user by email, username, or id
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ? OR username = ? OR id = ? OR LOWER(REPLACE(id, '_', '')) = LOWER(REPLACE(?, '_', ''))",
            [identifier, identifier, identifier, identifier]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const user = users[0];

        // Compare password or PIN hash
        let passwordMatch = false;
        if (user.password) {
            passwordMatch = await bcrypt.compare(secret, user.password);
        }
        if (!passwordMatch && user.pin_hash) {
            passwordMatch = await bcrypt.compare(secret, user.pin_hash);
        }

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET || "development_secret",
            {
                expiresIn: "24h"
            }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("❌ Login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
});


// ========================================
// EXPORT
// ========================================

export default router;