import express from "express";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, timingSafeEqual } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_SECRET = process.env.SESSION_SECRET;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const SONGS_FILE = path.join(DATA_DIR, "songs.json");

if (!ADMIN_PASSWORD_HASH || !SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error("Set ADMIN_PASSWORD_HASH and SESSION_SECRET in .env (SESSION_SECRET must be 32+ characters).");
  process.exit(1);
}
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(SONGS_FILE)) fs.writeFileSync(SONGS_FILE, "[]");

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "30kb" }));
app.use(session({
  name: "azekee.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000
  }
}));

const loginLimiter = rateLimit({ windowMs: 15 *  60 * 1000, limit: 8, standardHeaders: "draft-8", legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 40, standardHeaders: "draft-8", legacyHeaders: false });

function readSongs() {
  try { return JSON.parse(fs.readFileSync(SONGS_FILE, "utf8")); }
  catch { return []; }
}
function writeSongs(songs) {
  fs.writeFileSync(SONGS_FILE, JSON.stringify(songs, null, 2));
}
function requireOwner(req, res, next) {
  if (req.session?.isOwner === true) return next();
  return res.status(401).json({ error: "Faqat sayt egasi uchun." });
}
function safeFileName(name) {
  return name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 100) || "audio";
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}-${safeFileName(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) cb(null, true);
    else cb(new Error("Faqat audio fayllar yuklash mumkin."));
  }
});

app.post("/api/admin/login", loginLimiter, async (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!valid) return res.status(401).json({ error: "Parol noto‘g‘ri." });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Sessiya yaratilmadi." });
    req.session.isOwner = true;
    req.session.save(saveErr => {
      if (saveErr) return res.status(500).json({ error: "Kirish saqlanmadi." });
      res.json({ ok: true });
    });
  });
});
app.post("/api/admin/logout", requireOwner, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("azekee.sid", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
    res.json({ ok: true });
  });
});
app.get("/api/admin/status", (req, res) => res.json({ isOwner: req.session?.isOwner === true }));

app.get("/api/songs", (_req, res) => {
  res.json(readSongs().map(({ id, title, artist, url }) => ({ id, title, artist, url })));
});
app.post("/api/admin/songs", requireOwner, uploadLimiter, upload.array("tracks", 10), (req, res) => {
  const songs = readSongs();
  const added = (req.files || []).map(file => ({
    id: randomUUID(),
    title: path.parse(file.originalname).name,
    artist: "Azekee Music",
    url: `/uploads/${encodeURIComponent(file.filename)}`
  }));
  writeSongs([...songs, ...added]);
  res.status(201).json({ added, songs: [...songs, ...added] });
});
app.delete("/api/admin/songs/:id", requireOwner, (req, res) => {
  const songs = readSongs();
  const target = songs.find(song => song.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Qo‘shiq topilmadi." });
  const filename = decodeURIComponent(target.url.split("/").pop());
  const fullPath = path.join(UPLOAD_DIR, path.basename(filename));
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  writeSongs(songs.filter(song => song.id !== req.params.id));
  res.json({ ok: true });
});

app.use("/uploads", express.static(UPLOAD_DIR, { fallthrough: false, setHeaders: res => res.setHeader("X-Content-Type-Options", "nosniff") }));
app.use(express.static(path.join(__dirname, "public")));
app.use((err, _req, res, _next) => {
  console.error(err.message);
  const status = err instanceof multer.MulterError ? 400 : 400;
  res.status(status).json({ error: err.message || "Xatolik yuz berdi." });
});
app.listen(PORT, () => console.log(`Azekee Music ishga tushdi: http://localhost:${PORT}`));
