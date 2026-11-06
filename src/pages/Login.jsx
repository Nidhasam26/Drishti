import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useAppointments } from "../context/AppointmentContext.jsx";
import { useVoice } from "../hooks/useVoice.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  User,
  Lock,
  CheckCircle2,
  Award,
  Volume2,
  Globe2,
} from "lucide-react";
import RetinaScanOverlay from "../components/ui/RetinaScanOverlay.jsx";

/* ═══════════════════════════════════════════════════════════════
   DRISHTI AI — PREMIUM CINEMATIC LOGIN
   ═══════════════════════════════════════════════════════════════ */

function ScanTelemetry() {
  const [metrics, setMetrics] = useState({
    quality: 0,
    vessels: 0,
    macula: 0,
    optic: 0,
  });

  useEffect(() => {
    const targets = {
      quality: 98,
      vessels: 92,
      macula: 95,
      optic: 93,
    };

    const timer = setInterval(() => {
      setMetrics((prev) => ({
        quality: Math.min(prev.quality + 3, targets.quality),
        vessels: Math.min(prev.vessels + 3, targets.vessels),
        macula: Math.min(prev.macula + 3, targets.macula),
        optic: Math.min(prev.optic + 3, targets.optic),
      }));
    }, 40);

    return () => clearInterval(timer);
  }, []);

  const bars = [
    { label: "Image Quality", value: metrics.quality },
    { label: "Blood Vessels", value: metrics.vessels },
    { label: "Macula Focus", value: metrics.macula },
    { label: "Optic Disc", value: metrics.optic },
  ];

  return (
    <div
      style={{
        position: "absolute",
        right: 4,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 10,
        width: 210,
        background: "rgba(5, 10, 18, 0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRadius: 16,
        padding: "20px 18px",
        border: "1px solid rgba(34, 211, 238, 0.1)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color: "#22d3ee",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontFamily: "var(--font-heading)",
          marginBottom: 4,
        }}
      >
        RETINA SCAN
      </div>

      <div
        style={{
          fontSize: 10.5,
          color: "rgba(103, 232, 249, 0.7)",
          marginBottom: 16,
          fontFamily: "var(--font-heading)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22d3ee",
            display: "inline-block",
            boxShadow: "0 0 8px #22d3ee",
          }}
        />
        Scanning...
      </div>

      {bars.map(({ label, value }) => (
        <div key={label} style={{ marginBottom: 11 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                color: "rgba(148, 163, 184, 0.95)",
                fontFamily: "var(--font-heading)",
                fontWeight: 500,
              }}
            >
              {label}
            </span>

            <span
              style={{
                fontSize: 11,
                color: "#38bdf8",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
              }}
            >
              {value}%
            </span>
          </div>

          <div
            style={{
              height: 2.5,
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${value}%`,
                background: "linear-gradient(90deg, #0284c7, #22d3ee)",
                borderRadius: 2,
                transition: "width 0.15s ease-out",
              }}
            />
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            color: "rgba(148, 163, 184, 0.95)",
            fontFamily: "var(--font-heading)",
            fontWeight: 500,
          }}
        >
          AI Analysis
        </span>

        <span
          style={{
            fontSize: 10.5,
            color: "#22d3ee",
            fontWeight: 700,
            fontFamily: "var(--font-heading)",
          }}
        >
          In Progress
        </span>
      </div>
    </div>
  );
}

function AnimatedEye() {
  const eyeRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    let t = 0;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      t += 0.004;

      if (eyeRef.current) {
        const dx = Math.sin(t * 0.5) * 1.8 + Math.sin(t * 1.8) * 0.4;

        const dy = Math.cos(t * 0.35) * 1.0 + Math.cos(t * 2.2) * 0.3;

        const scale = 1 + Math.sin(t * 0.25) * 0.003;

        eyeRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      }
    };

    animate();

    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <img
      ref={eyeRef}
      src={`${import.meta.env.BASE_URL}eye-cinematic.jpg`}
      alt="Retina Scan"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center 48%",
        zIndex: 1,
        willChange: "transform",
      }}
    />
  );
}

export default function Login() {
  const { login, register } = useAuth();
  const { addDoctor } = useAppointments();
  const { enabled, language, languages, hasSpeech, voiceCount, enableAndSpeak } = useVoice();
  const { setLanguage: setAppLanguage } = useLanguage();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [portal, setPortal] = useState("user");
  const [authMode, setAuthMode] = useState("signin");


  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regVillage, setRegVillage] = useState("");
  const [regDistrict, setRegDistrict] = useState("");
  const [showRegPin, setShowRegPin] = useState(false);

  const [focusedField, setFocusedField] = useState(null);

  const resetForm = () => {
    setUsername("");
    setPin("");
    setError("");

    setRegName("");
    setRegUsername("");
    setRegPin("");
    setRegPhone("");
    setRegVillage("");
    setRegDistrict("");

    setShowPin(false);
    setShowRegPin(false);
  };

  const handlePortalSwitch = (p) => {
    setPortal(p);
    setAuthMode("signin");
    resetForm();
  };

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();

    setError("");

    if (!username.trim() || !pin.trim()) {
      setError("Please enter both username and PIN.");
      return;
    }

    setLoading(true);

    const result = await login(username, pin, portal);

    if (result && result.success) {
      navigate("/dashboard");
    } else {
      setLoading(false);
      setError(result?.error || "Invalid username or PIN.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    setError("");

    if (!regName.trim() || !regUsername.trim() || !regPin.trim()) {
      setError("Full name, username, and PIN are required.");
      return;
    }

    if (regPin.trim().length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }

    setLoading(true);

    const assignedRole = portal === "admin" ? "doctor" : "user";

    const result = await register({
      name: regName,
      username: regUsername,
      pin: regPin,
      phone: regPhone,
      village: regVillage,
      district: regDistrict || "Yavatmal",
      role: assignedRole,
      portal,
    });

    if (result && result.success) {
      if (portal === "admin") {
        try {
          await addDoctor({
            name: regName.startsWith("Dr.") ? regName : `Dr. ${regName}`,
            role: "Ophthalmologist & Retina Specialist",
            specialty: "Diabetic Retinopathy Screening",
            hospital: "District Eye Hospital",
            location: `${regVillage || "District Clinic"}, ${regDistrict || "Yavatmal"}`,
            fee: 500,
            experience: "5+ years",
          });
        } catch {}
      }
      navigate("/dashboard");
    } else {
      setLoading(false);
      setError(result?.error || "Registration failed.");
    }
  };

  const inputContainerStyle = (id) => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "rgba(11, 20, 30, 0.8)",
    border: `1px solid ${
      focusedField === id
        ? "rgba(34, 211, 238, 0.55)"
        : "rgba(255, 255, 255, 0.09)"
    }`,
    borderRadius: 14,
    transition: "all 0.25s ease",
    boxShadow:
      focusedField === id
        ? "0 0 0 3px rgba(34, 211, 238, 0.1), 0 0 20px rgba(34, 211, 238, 0.1)"
        : "none",
  });

  const inputStyle = {
    width: "100%",
    padding: "18px 18px 14.5px 44px",
    background: "transparent",
    border: "none",
    color: "#f8fafc",
    fontSize: 14.5,
    fontFamily: "var(--font-heading)",
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 10.5,
    fontWeight: 700,
    color: "rgba(148, 163, 184, 0.8)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "var(--font-heading)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#050a0f",
        position: "relative",
        overflowX: "hidden",
        display: isMobile ? "flex" : "block",
        alignItems: isMobile ? "center" : undefined,
        justifyContent: isMobile ? "center" : undefined,
        padding: isMobile ? "24px 14px" : 0,
      }}
    >
      {/* LEFT: LOGIN FORM */}

      <div
        style={
          isMobile
            ? {
                position: "relative",
                zIndex: 10,
                width: "100%",
                maxWidth: 480,
                padding: "clamp(24px, 5vw, 38px) clamp(16px, 4vw, 32px)",
                background: "rgba(5, 10, 18, 0.94)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: 24,
                border: "1px solid rgba(34, 211, 238, 0.25)",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.75)",
                boxSizing: "border-box",
              }
            : {
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 580,
                maxWidth: "46vw",
                padding: "48px 56px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                zIndex: 10,
                boxSizing: "border-box",
                background:
                  "linear-gradient(90deg, #050a0f 0%, #050a0f 72%, rgba(5, 10, 15, 0.9) 88%, transparent 100%)",
                overflowY: "auto",
              }
        }
      >

        {/* Brand Header */}

        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "2px solid rgba(34, 211, 238, 0.45)",
                background:
                  "radial-gradient(circle at center, rgba(6, 182, 212, 0.22) 0%, rgba(5, 10, 18, 0.85) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(6, 182, 212, 0.3)",
              }}
            >
              <Eye size={24} color="#22d3ee" strokeWidth={2.2} />
            </div>

            <div>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "0.04em",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                DRISHTI{" "}
                <span
                  style={{
                    color: "#22d3ee",
                    fontWeight: 600,
                  }}
                >
                  AI
                </span>
              </h1>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(148, 163, 184, 0.7)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                RETINAL SCREENING PLATFORM
              </span>
            </div>
          </div>

          <div
            style={{
              width: 32,
              height: 2,
              background: "#06b6d4",
              borderRadius: 2,
              margin: "8px 0 10px",
            }}
          />

          <p
            style={{
              fontSize: 13.5,
              color: "rgba(148, 163, 184, 0.65)",
              margin: 0,
              fontFamily: "var(--font-heading)",
            }}
          >
            Trust the image.{" "}
            <span
              style={{
                color: "#22d3ee",
                fontWeight: 600,
              }}
            >
              Understand
            </span>{" "}
            the result.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            marginBottom: 18,
            background: "rgba(8, 145, 178, 0.12)",
            border: "1px solid rgba(34, 211, 238, 0.25)",
            borderRadius: 12,
          }}
        >
          <Globe2 size={16} color="#22d3ee" />
          <select
            aria-label="Voice language"
            value={language}
            onChange={(event) => setAppLanguage(event.target.value)}
            style={{ flex: 1, background: "transparent", border: 0, color: "#e6fffb", outline: 0, fontSize: 12 }}
          >
            {languages.filter((item) => ["en-IN", "hi-IN", "kn-IN"].includes(item.code)).map((item) => (
              <option key={item.code} value={item.code} style={{ background: "#071f2c" }}>
                {item.native} ({item.name})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => enableAndSpeak("welcome")}
            disabled={!hasSpeech || voiceCount === 0}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", border: 0, borderRadius: 8, background: hasSpeech && voiceCount > 0 ? "#0891b2" : "#475569", color: "#fff", cursor: hasSpeech && voiceCount > 0 ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            <Volume2 size={14} /> {voiceCount === 0 ? "Voice unavailable" : enabled ? "Hear" : "Enable voice"}
          </button>
        </div>

        {/* Role Switcher */}

        <div
          style={{
            display: "flex",
            gap: 6,
            padding: 4,
            background: "rgba(11, 20, 30, 0.65)",
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.06)",
            marginBottom: 26,
          }}
        >
          {[
            {
              key: "user",
              icon: User,
              label: "Patient / Health Worker",
            },
            {
              key: "admin",
              icon: ShieldCheck,
              label: "Doctor / Admin",
            },
          ].map(({ key, icon: Icon, label }) => {
            const active = portal === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePortalSwitch(key)}
                style={{
                  flex: 1,
                  padding: "10.5px 14px",
                  borderRadius: 11,
                  border: active
                    ? "1px solid rgba(34, 211, 238, 0.38)"
                    : "1px solid transparent",
                  background: active
                    ? "rgba(8, 145, 178, 0.18)"
                    : "transparent",
                  color: active ? "#ffffff" : "rgba(148, 163, 184, 0.55)",
                  fontFamily: "var(--font-heading)",
                  fontWeight: active ? 700 : 500,
                  fontSize: 12.5,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: active
                    ? "0 0 14px rgba(6, 182, 212, 0.18)"
                    : "none",
                }}
              >
                <Icon
                  size={15}
                  color={active ? "#22d3ee" : "rgba(148, 163, 184, 0.5)"}
                />

                {label}
              </button>
            );
          })}
        </div>

        {/* Welcome */}

        <div style={{ marginBottom: 22 }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 24,
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 4px 0",
            }}
          >
            Welcome Back
          </h2>

          <p
            style={{
              fontSize: 13.5,
              color: "rgba(148, 163, 184, 0.65)",
              margin: 0,
              fontFamily: "var(--font-heading)",
            }}
          >
            Sign in to continue your journey
          </p>
        </div>

        {/* SIGN IN */}

        {authMode === "signin" && (
          <form onSubmit={handleSignIn} noValidate>
            {/* Username */}

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="login-username" style={labelStyle}>
                USERNAME
              </label>

              <div style={inputContainerStyle("user")}>
                <User
                  size={17}
                  style={{
                    position: "absolute",
                    left: 15,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(148, 163, 184, 0.45)",
                    pointerEvents: "none",
                  }}
                />

                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("user")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  style={inputStyle}
                />
              </div>
            </div>

            {/* PIN */}

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="login-pin-input" style={labelStyle}>
                PIN
              </label>

              <div style={inputContainerStyle("pin")}>
                <Lock
                  size={17}
                  style={{
                    position: "absolute",
                    left: 15,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(148, 163, 184, 0.45)",
                    pointerEvents: "none",
                  }}
                />

                <input
                  id="login-pin-input"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onFocus={() => setFocusedField("pin")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your PIN"
                  autoComplete="current-password"
                  inputMode="numeric"
                  maxLength={8}
                  style={{
                    ...inputStyle,
                    paddingRight: 42,
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(148, 163, 184, 0.45)",
                    padding: 4,
                    display: "flex",
                  }}
                >
                  {showPin ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}

            {error && (
              <div
                style={{
                  color: "#fca5a5",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 12,
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            {/* Sign In */}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14.5px 22px",
                borderRadius: 14,
                border: "none",
                background:
                  "linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #22d3ee 100%)",
                color: "#ffffff",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 14.5,
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                transition: "all 0.25s ease",
                boxShadow: "0 8px 24px rgba(6, 182, 212, 0.38)",
                opacity: loading ? 0.75 : 1,
              }}
            >
              <LogIn size={17} />

              {loading ? "Authenticating..." : "Sign In"}
            </button>

            {/* Demo */}

            <div
              style={{
                marginTop: 9,
                fontSize: 11,
                textAlign: "center",
                color: "rgba(148, 163, 184, 0.4)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {portal === "admin" ? "Demo: admin / 0000" : "Demo: user / 1234"}
            </div>

            {/* Divider */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                margin: "18px 0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255, 255, 255, 0.08)",
                }}
              />

              <span
                style={{
                  fontSize: 11,
                  color: "rgba(148, 163, 184, 0.4)",
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                }}
              >
                OR
              </span>

              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255, 255, 255, 0.08)",
                }}
              />
            </div>

            {/* Create Account */}

            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setError("");
              }}
              style={{
                width: "100%",
                padding: "13.5px 20px",
                borderRadius: 14,
                border: "1px solid rgba(255, 255, 255, 0.09)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "rgba(226, 232, 240, 0.9)",
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 13.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                transition: "all 0.2s ease",
              }}
            >
              <UserPlus size={16} />
              Create New Account
            </button>
          </form>
        )}

        {/* REGISTER */}

        {authMode === "signup" && (
          <form onSubmit={handleSignUp} noValidate>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 12px",
                borderRadius: 11,
                background: portal === "admin" ? "rgba(34, 211, 238, 0.12)" : "rgba(16, 185, 129, 0.12)",
                border: portal === "admin" ? "1px solid rgba(34, 211, 238, 0.25)" : "1px solid rgba(16, 185, 129, 0.25)",
                fontSize: 12,
                fontWeight: 700,
                color: portal === "admin" ? "#22d3ee" : "#34d399",
                marginBottom: 14,
                fontFamily: "var(--font-heading)",
              }}
            >
              <ShieldCheck size={16} />
              {portal === "admin"
                ? "Registering as Doctor / Specialist"
                : "Registering as Patient / Health Screener"}
            </div>
            <div style={{ marginBottom: 13 }}>
              <label htmlFor="reg-fullname" style={labelStyle}>
                FULL NAME
              </label>

              <div style={inputContainerStyle("rname")}>
                <User
                  size={16}
                  style={{
                    position: "absolute",
                    left: 15,
                    color: "rgba(148, 163, 184, 0.4)",
                  }}
                />

                <input
                  id="reg-fullname"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  onFocus={() => setFocusedField("rname")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ramesh Patil"
                  autoFocus
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 11,
                marginBottom: 13,
              }}
            >
              <div>
                <label htmlFor="reg-username" style={labelStyle}>
                  USERNAME
                </label>

                <div style={inputContainerStyle("rusr")}>
                  <input
                    id="reg-username"
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    onFocus={() => setFocusedField("rusr")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="username"
                    autoComplete="username"
                    style={{
                      ...inputStyle,
                      paddingLeft: 14,
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-pin" style={labelStyle}>
                  PIN
                </label>

                <div style={inputContainerStyle("rpin")}>
                  <input
                    id="reg-pin"
                    type={showRegPin ? "text" : "password"}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    onFocus={() => setFocusedField("rpin")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="4-digits"
                    inputMode="numeric"
                    maxLength={8}
                    style={{
                      ...inputStyle,
                      paddingLeft: 14,
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 11,
                marginBottom: 13,
              }}
            >
              <div>
                <label htmlFor="reg-village" style={labelStyle}>
                  VILLAGE
                </label>

                <div style={inputContainerStyle("rvil")}>
                  <input
                    id="reg-village"
                    type="text"
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    onFocus={() => setFocusedField("rvil")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Wardha"
                    style={{
                      ...inputStyle,
                      paddingLeft: 14,
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-district" style={labelStyle}>
                  DISTRICT
                </label>

                <div style={inputContainerStyle("rdist")}>
                  <input
                    id="reg-district"
                    type="text"
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    onFocus={() => setFocusedField("rdist")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Yavatmal"
                    style={{
                      ...inputStyle,
                      paddingLeft: 14,
                    }}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  color: "#fca5a5",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: 12,
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  marginBottom: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #059669, #10b981)",
                color: "#fff",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 14.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                boxShadow: "0 8px 24px rgba(5, 150, 105, 0.28)",
              }}
            >
              <UserPlus size={17} />

              {loading
                ? "Registering..."
                : portal === "admin"
                ? "Register as Doctor / Admin"
                : "Register & Enter"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setError("");
              }}
              style={{
                width: "100%",
                marginTop: 11,
                padding: "11px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: "rgba(148,163,184,0.6)",
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* Footer */}

        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 11.5,
            color: "rgba(148, 163, 184, 0.5)",
            fontFamily: "var(--font-heading)",
          }}
        >
          <CheckCircle2 size={14} color="#22d3ee" />
          Secure • Private •{" "}
          <span
            style={{
              color: "#22d3ee",
              fontWeight: 600,
            }}
          >
            Reliable
          </span>
        </div>
      </div>

      {/* RIGHT / BACKGROUND: CINEMATIC EYE */}

      <div
        style={
          isMobile
            ? {
                position: "fixed",
                inset: 0,
                overflow: "hidden",
                background: "#050a0f",
                zIndex: 1,
                opacity: 0.32,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
            : {
                position: "absolute",
                top: 0,
                right: "2.5vw",
                bottom: 0,
                width: "72vw",
                minWidth: 680,
                overflow: "hidden",
                background: "#050a0f",
                zIndex: 1,
              }
        }
      >
        {/* Animated Eye */}

        <AnimatedEye />

        {/* Retina Scan */}

        <RetinaScanOverlay />

        {/* Vignette */}

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 4,
            background:
              "radial-gradient(ellipse at 60% 48%, transparent 45%, rgba(5, 10, 15, 0.5) 80%, #050a0f 100%)",
          }}
        />

        {/* Telemetry - shown on desktop */}

        {!isMobile && <ScanTelemetry />}

        {/* SIH Badge */}

        <div
          style={{
            position: "absolute",
            bottom: isMobile ? 16 : 32,
            right: isMobile ? 16 : 48,
            zIndex: 10,
            display: isMobile ? "none" : "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: "1px solid rgba(34, 211, 238, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(5, 10, 18, 0.65)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Award size={20} color="#22d3ee" />
          </div>

          <div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: "#f8fafc",
                fontFamily: "var(--font-heading)",
                lineHeight: 1.2,
              }}
            >
              SIH 2026
            </div>

            <div
              style={{
                fontSize: 10,
                color: "rgba(148, 163, 184, 0.6)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Smart India Hackathon Finalist
            </div>
          </div>
        </div>
      </div>

      {/* Mobile SIH Badge footer below form */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 15,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            borderRadius: 20,
            background: "rgba(5, 10, 18, 0.8)",
            border: "1px solid rgba(34, 211, 238, 0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Award size={14} color="#22d3ee" />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", fontFamily: "var(--font-heading)" }}>
            SIH 2026 Finalist • DRISHTI AI
          </span>
        </div>
      )}
    </div>
  );
}

