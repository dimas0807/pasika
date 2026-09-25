import crypto from "node:crypto";
import { db } from "./db.js";

const SESSION_COOKIE_NAME = "pasika_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory rate limiting for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 mins

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return true;
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(ip);
    return true;
  }
  return record.count < MAX_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count++;
  }
}

function clearRateLimit(ip) {
  loginAttempts.delete(ip);
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  try {
    const candidateHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(candidateHash, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export function createSession(adminId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  db.prepare(`
    INSERT INTO admin_sessions (token, admin_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(token, adminId, expiresAt, now);

  return { token, expiresAt };
}

export function getSession(token) {
  if (!token) return null;
  const now = Date.now();
  const session = db.prepare(`
    SELECT s.token, s.admin_id, s.expires_at, u.username
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now);

  return session || null;
}

export function deleteSession(token) {
  if (!token) return;
  db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
}

export function cleanExpiredSessions() {
  db.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").run(Date.now());
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export function requireAdminAuth(req, res, next) {
  let token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7).trim();
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: "Необхідна авторизація" });
  }

  req.admin = session;
  next();
}

export async function loginHandler(req, res) {
  const ip = req.ip || req.socket?.remoteAddress || "default";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "Забагато невдалих спроб входу. Зачекайте 15 хвилин." });
  }

  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(400).json({ error: "Вкажіть логін і пароль" });
  }

  const user = db.prepare("SELECT * FROM admin_users WHERE username = ?").get(login.trim());
  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: "Невірний логін або пароль" });
  }

  clearRateLimit(ip);
  const session = createSession(user.id);
  setSessionCookie(res, session.token);

  return res.json({
    success: true,
    username: user.username,
  });
}

export async function logoutHandler(req, res) {
  const token = req.cookies?.[SESSION_COOKIE_NAME] || req.headers.authorization?.substring(7)?.trim();
  if (token) {
    deleteSession(token);
  }
  clearSessionCookie(res);
  return res.json({ success: true });
}

export async function meHandler(req, res) {
  let token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7).trim();
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({
    authenticated: true,
    username: session.username,
  });
}

export async function changeSecurityHandler(req, res) {
  const adminSession = req.admin;
  if (!adminSession) {
    return res.status(401).json({ error: "Необхідна авторизація" });
  }

  const { currentPassword, newLogin, newPassword, confirmPassword } = req.body || {};
  if (!currentPassword) {
    return res.status(400).json({ error: "Вкажіть поточний пароль для підтвердження змін" });
  }

  const user = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(adminSession.admin_id);
  if (!user || !verifyPassword(currentPassword, user.password_hash, user.salt)) {
    return res.status(401).json({ error: "Невірний поточний пароль" });
  }

  let updatedUsername = user.username;
  if (newLogin && newLogin.trim()) {
    const trimmed = newLogin.trim();
    if (trimmed !== user.username) {
      const existing = db.prepare("SELECT id FROM admin_users WHERE username = ? AND id != ?").get(trimmed, user.id);
      if (existing) {
        return res.status(400).json({ error: "Користувач з таким логіном вже існує" });
      }
      updatedUsername = trimmed;
    }
  }

  let updatedHash = user.password_hash;
  let updatedSalt = user.salt;

  if (newPassword) {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Новий пароль має містити щонайменше 6 символів" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Новий пароль та підтвердження не співпадають" });
    }
    const hashed = hashPassword(newPassword);
    updatedHash = hashed.hash;
    updatedSalt = hashed.salt;
  }

  db.prepare(`
    UPDATE admin_users
    SET username = ?, password_hash = ?, salt = ?
    WHERE id = ?
  `).run(updatedUsername, updatedHash, updatedSalt, user.id);

  // Invalidate old session and issue new session token
  deleteSession(adminSession.token);
  const newSession = createSession(user.id);
  setSessionCookie(res, newSession.token);

  return res.json({
    success: true,
    message: "Пароль та налаштування безпеки успішно оновлено.",
    username: updatedUsername,
  });
}
