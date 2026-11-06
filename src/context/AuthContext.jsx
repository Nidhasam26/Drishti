import { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { DEMO_USERS } from '../data/seedData.js';
import { getDB } from '../data/db.js';

const AuthContext = createContext(null);

const USERS_KEY = 'drishti_users';
const SESSION_KEY = 'drishti_session';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false };
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

/** Load all registered users from localStorage, seeding defaults if empty or incomplete */
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Guarantee default accounts are always available even if localStorage had stale data
        const missing = DEMO_USERS.filter(
          (d) => !parsed.some((u) => u.username.toLowerCase() === d.username.toLowerCase())
        );
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(USERS_KEY, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch { /* ignore */ }
  // Seed default accounts on first run
  localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
  return [...DEMO_USERS];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isOfflineSession, setIsOfflineSession] = useState(false);

  // Restore session on mount from localStorage or IndexedDB auth_cache
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const user = JSON.parse(saved);
        dispatch({ type: 'RESTORE_SESSION', payload: user });
        setIsOfflineSession(!navigator.onLine);
      } else {
        // Fallback to IndexedDB auth_cache for offline PWA restart
        getDB().then((db) => {
          return db.getAll('auth_cache');
        }).then((cached) => {
          if (cached && cached.length > 0) {
            const user = cached[0];
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            dispatch({ type: 'RESTORE_SESSION', payload: user });
            setIsOfflineSession(!navigator.onLine);
          } else {
            dispatch({ type: 'RESTORE_SESSION', payload: null });
          }
        }).catch(() => {
          dispatch({ type: 'RESTORE_SESSION', payload: null });
        });
      }
    } catch (e) {
      dispatch({ type: 'RESTORE_SESSION', payload: null });
    }
    loadUsers();

    const handleOffline = () => {
      if (state.isAuthenticated) setIsOfflineSession(true);
    };
    const handleOnline = () => setIsOfflineSession(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [state.isAuthenticated]);

  /**
   * Login with username + PIN. Synchronous return for immediate UI reactivity.
   * @param {string} username
   * @param {string} pin
   * @param {'admin'|'user'} portal — which portal the user is trying to access
   */
  const login = useCallback((username, pin, portal = 'user') => {
    const users = loadUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.pin === pin.trim()
    );
    if (!user) return { success: false, error: 'Invalid username or PIN.' };

    // Portal access check: allow admin and doctor roles in admin portal
    const isAdminOrDoctor = user.role === 'admin' || user.role === 'doctor';
    if (portal === 'admin' && !isAdminOrDoctor) {
      return { success: false, error: 'This account does not have doctor or administrator access.' };
    }
    if (portal === 'user' && isAdminOrDoctor) {
      return { success: false, error: 'Doctor/Admin accounts must use the Doctor / Admin Portal to sign in.' };
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      district: user.district,
      state: user.state,
      username: user.username,
      village: user.village || '',
      phone: user.phone || '',
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));

    // Save to IndexedDB auth_cache asynchronously without blocking login
    getDB().then((db) => {
      db.put('auth_cache', { ...safeUser, userId: safeUser.id, cachedAt: new Date().toISOString() }).catch(() => {});
    }).catch(() => {});

    dispatch({ type: 'LOGIN', payload: safeUser });
    setIsOfflineSession(!navigator.onLine);
    return { success: true };
  }, []);

  /**
   * Register a new user/doctor/admin account.
   * Returns { success, error? } synchronously.
   */
  const register = useCallback((data) => {
    const { name, username, pin, phone, village, district, role } = data;
    if (!name || !username || !pin) {
      return { success: false, error: 'Name, username, and PIN are required.' };
    }
    if (pin.length < 4) {
      return { success: false, error: 'PIN must be at least 4 digits.' };
    }

    const users = loadUsers();
    const exists = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      return { success: false, error: 'Username already taken. Please choose another.' };
    }

    const assignedRole = role || (data.portal === 'admin' ? 'admin' : 'user');

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      pin: pin.trim(),
      role: assignedRole,
      phone: phone?.trim() || '',
      village: village?.trim() || '',
      district: district?.trim() || 'Yavatmal',
      state: 'Maharashtra',
    };

    users.push(newUser);
    saveUsers(users);

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      district: newUser.district,
      state: newUser.state,
      username: newUser.username,
      village: newUser.village,
      phone: newUser.phone,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));

    // Sync to backend auth if online
    if (navigator.onLine) {
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          pin: newUser.pin,
          role: newUser.role,
        }),
      }).catch(() => {});
    }

    getDB().then((db) => {
      db.put('auth_cache', { ...safeUser, userId: safeUser.id, cachedAt: new Date().toISOString() }).catch(() => {});
    }).catch(() => {});

    dispatch({ type: 'LOGIN', payload: safeUser });
    setIsOfflineSession(!navigator.onLine);
    return { success: true };
  }, []);

  /** Get all registered users (for Admin Panel) */
  const getRegisteredUsers = useCallback(() => {
    return loadUsers().map(({ pin, ...rest }) => rest);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    getDB().then((db) => {
      if (state.user?.id) {
        db.delete('auth_cache', state.user.id).catch(() => {});
      }
    }).catch(() => {});
    setIsOfflineSession(false);
    dispatch({ type: 'LOGOUT' });
  }, [state.user?.id]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isOfflineSession,
        login,
        logout,
        register,
        getRegisteredUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
