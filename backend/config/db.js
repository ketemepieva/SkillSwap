const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.SQLITE_PATH || path.join(dataDir, "skillswap.db");
const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
if (fs.existsSync(schemaPath)) {
  try {
    sqlite.exec(fs.readFileSync(schemaPath, "utf8"));
  } catch (err) {
    console.error("Initialisation schéma SQLite:", err.message);
    process.exit(1);
  }
}

function tableHasColumn(database, tableName, columnName) {
  const cols = database.prepare(`PRAGMA table_info(${tableName})`).all();
  return cols.some((c) => c.name === columnName);
}

function slugifyName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "SS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function avatarSvg(name, c1, c2) {
  const init = initials(name);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="64" fill="url(#g)" />
  <circle cx="128" cy="96" r="42" fill="rgba(255,255,255,0.2)" />
  <path d="M56 212c12-40 46-60 72-60s60 20 72 60" fill="rgba(255,255,255,0.18)" />
  <text x="50%" y="58%" text-anchor="middle" fill="#fff" font-size="62" font-weight="700" font-family="Outfit,Arial,sans-serif">${init}</text>
</svg>`;
}

function seedDemoData(database) {
  const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
  if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

  const demos = [
    {
      nom: "Amina Farah",
      email: "amina.farah@demo.skillswap.local",
      bio: "Data scientist senior, passionnee par la transmission et les projets utiles.",
      city: "Paris",
      country: "France",
      level: "Expert",
      score: 4.8,
      colors: ["#2563eb", "#0ea5e9"],
      offers: [
        ["Machine Learning", "Tech", "Expert"],
        ["Python Data", "Tech", "Avance"],
      ],
      seeks: [
        ["Prise de parole", "Soft skills", "Intermediaire"],
        ["Design narratif", "Creativite", "Debutant"],
      ],
    },
    {
      nom: "Lucas Bernard",
      email: "lucas.bernard@demo.skillswap.local",
      bio: "DevOps et cloud architect, j'aide a structurer des pipelines stables.",
      city: "Lyon",
      country: "France",
      level: "Expert",
      score: 4.6,
      colors: ["#1d4ed8", "#14b8a6"],
      offers: [
        ["CI/CD", "Tech", "Expert"],
        ["Docker", "Tech", "Avance"],
      ],
      seeks: [
        ["Leadership", "Soft skills", "Intermediaire"],
        ["Illustration", "Creativite", "Debutant"],
      ],
    },
    {
      nom: "Sofia Nadir",
      email: "sofia.nadir@demo.skillswap.local",
      bio: "Product designer, j'aime simplifier les interfaces et guider les equipes.",
      city: "Casablanca",
      country: "Maroc",
      level: "Intermediaire",
      score: 3.1,
      colors: ["#0ea5e9", "#22d3ee"],
      offers: [
        ["UX Writing", "Design", "Intermediaire"],
        ["Figma", "Design", "Intermediaire"],
      ],
      seeks: [
        ["SQL", "Tech", "Debutant"],
        ["Animation UI", "Design", "Debutant"],
      ],
    },
    {
      nom: "Yassine Diallo",
      email: "yassine.diallo@demo.skillswap.local",
      bio: "Analyste produit, specialise dans l'optimisation de parcours utilisateurs.",
      city: "Dakar",
      country: "Senegal",
      level: "Intermediaire",
      score: 2.7,
      colors: ["#0891b2", "#6366f1"],
      offers: [
        ["Google Analytics", "Data", "Intermediaire"],
        ["No-code automation", "Tech", "Intermediaire"],
      ],
      seeks: [
        ["React", "Tech", "Debutant"],
        ["Prise de parole", "Soft skills", "Debutant"],
      ],
    },
    {
      nom: "Lea Martin",
      email: "lea.martin@demo.skillswap.local",
      bio: "Nouvelle sur la plateforme, motivee pour progresser en developpement web.",
      city: "Toulouse",
      country: "France",
      level: "Debutant",
      score: 1.2,
      colors: ["#64748b", "#94a3b8"],
      offers: [
        ["Organisation de projet", "Soft skills", "Debutant"],
        ["Canva", "Creativite", "Debutant"],
      ],
      seeks: [
        ["JavaScript", "Tech", "Debutant"],
        ["Git", "Tech", "Debutant"],
      ],
    },
    {
      nom: "Nassim Ben Ali",
      email: "nassim.benali@demo.skillswap.local",
      bio: "Debutant en tech, tres actif et curieux sur les projets collaboratifs.",
      city: "Rabat",
      country: "Maroc",
      level: "Debutant",
      score: 0.8,
      colors: ["#475569", "#0f766e"],
      offers: [
        ["Arabe conversationnel", "Langues", "Debutant"],
        ["Support client", "Soft skills", "Debutant"],
      ],
      seeks: [
        ["Python", "Tech", "Debutant"],
        ["Base de donnees", "Tech", "Debutant"],
      ],
    },
  ];

  const pwdHash = bcrypt.hashSync("DemoSkillSwap2026!", 10);
  const getUserByEmail = database.prepare("SELECT id FROM users WHERE email = ?");
  const countUserSkills = database.prepare("SELECT COUNT(*) AS c FROM skills WHERE user_id = ?");
  const insertUser = database.prepare(
    `INSERT INTO users
      (nom, email, password, role, bio, credibility_score, avatar_filename, city, country, expertise_level, badge_label)
     VALUES (?, ?, ?, 'user', ?, ?, ?, ?, ?, ?, ?)`
  );
  const upsertUserMeta = database.prepare(
    `UPDATE users
        SET bio = COALESCE(NULLIF(bio, ''), ?),
            credibility_score = CASE WHEN credibility_score = 0 THEN ? ELSE credibility_score END,
            avatar_filename = COALESCE(avatar_filename, ?),
            city = COALESCE(city, ?),
            country = COALESCE(country, ?),
            expertise_level = COALESCE(expertise_level, ?),
            badge_label = COALESCE(badge_label, ?)
      WHERE id = ?`
  );
  const insertSkill = database.prepare(
    `INSERT INTO skills (user_id, nom_competence, categorie, niveau, rarete_weight, is_offer)
     VALUES (?, ?, ?, ?, 1, ?)`
  );
  const insertExchange = database.prepare(
    `INSERT INTO exchanges (proposer_id, receiver_id, offered_skill_id, requested_skill_id, status, learning_objective, estimated_duration_weeks)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const tx = database.transaction(() => {
    const idsByEmail = new Map();
    for (const d of demos) {
      const filename = `demo-${slugifyName(d.nom)}.svg`;
      const avatarPath = path.join(avatarDir, filename);
      if (!fs.existsSync(avatarPath)) {
        fs.writeFileSync(avatarPath, avatarSvg(d.nom, d.colors[0], d.colors[1]), "utf8");
      }
      const existing = getUserByEmail.get(d.email);
      if (!existing) {
        const res = insertUser.run(
          d.nom,
          d.email,
          pwdHash,
          d.bio,
          d.score,
          filename,
          d.city,
          d.country,
          d.level,
          d.level
        );
        idsByEmail.set(d.email, Number(res.lastInsertRowid));
      } else {
        upsertUserMeta.run(d.bio, d.score, filename, d.city, d.country, d.level, d.level, existing.id);
        idsByEmail.set(d.email, existing.id);
      }
    }

    for (const d of demos) {
      const uid = idsByEmail.get(d.email);
      const c = countUserSkills.get(uid)?.c || 0;
      if (c > 0) continue;
      for (const [name, cat, lvl] of d.offers) {
        insertSkill.run(uid, name, cat, lvl, 1);
      }
      for (const [name, cat, lvl] of d.seeks) {
        insertSkill.run(uid, name, cat, lvl, 0);
      }
    }

    // Harmonise les catégories des profils démo avec le référentiel officiel.
    const allDemoIds = Array.from(idsByEmail.values());
    if (allDemoIds.length) {
      const inSql = allDemoIds.map(() => "?").join(",");
      const mappings = [
        ["Tech", "Informatique / Développement"],
        ["Data", "Informatique / Développement"],
        ["Design", "Design / UI UX"],
        ["Creativite", "Artisanat"],
        ["Langues", "Langues"],
        ["Soft skills", "Business"],
      ];
      for (const [from, to] of mappings) {
        database
          .prepare(`UPDATE skills SET categorie = ? WHERE categorie = ? AND user_id IN (${inSql})`)
          .run(to, from, ...allDemoIds);
      }
    }

    const demoIds = Array.from(idsByEmail.values());
    if (demoIds.length >= 4) {
      const countExisting = database
        .prepare(`SELECT COUNT(*) AS c FROM exchanges WHERE proposer_id IN (${demoIds.map(() => "?").join(",")})`)
        .get(...demoIds)?.c;
      if (!countExisting) {
        const skillByUserAndType = database.prepare(
          "SELECT id FROM skills WHERE user_id = ? AND is_offer = ? ORDER BY id ASC LIMIT 1"
        );
        const userA = demoIds[0];
        const userB = demoIds[2];
        const userC = demoIds[4];
        const userD = demoIds[1];

        const aOffer = skillByUserAndType.get(userA, 1)?.id;
        const bWant = skillByUserAndType.get(userB, 0)?.id;
        if (aOffer && bWant) {
          insertExchange.run(userA, userB, aOffer, bWant, "pending", "Session decouverte des fondamentaux", 2);
        }
        const bOffer = skillByUserAndType.get(userB, 1)?.id;
        const cWant = skillByUserAndType.get(userC, 0)?.id;
        if (bOffer && cWant) {
          insertExchange.run(userB, userC, bOffer, cWant, "accepted", "Coaching pratique hebdomadaire", 3);
        }
        const dOffer = skillByUserAndType.get(userD, 1)?.id;
        const cWant2 = skillByUserAndType.get(userC, 0)?.id;
        if (dOffer && cWant2) {
          insertExchange.run(userD, userC, dOffer, cWant2, "completed", "Atelier intensif de 2 semaines", 2);
        }
      }
    }
  });

  tx();
}

function seedSkillCategories(database) {
  const categories = [
    "Informatique / Développement",
    "Design / UI UX",
    "Marketing",
    "Business",
    "Langues",
    "Photographie",
    "Vidéo / Montage",
    "Musique",
    "Cuisine",
    "Manucure / Beauté",
    "Coiffure",
    "Plomberie",
    "Électricité",
    "Artisanat",
    "Couture",
    "Sport / Coaching",
    "Agriculture",
    "Réseaux sociaux",
    "Rédaction",
    "Finance",
    "Soutien scolaire",
  ];
  const insertCategory = database.prepare("INSERT OR IGNORE INTO skill_categories (name) VALUES (?)");
  const tx = database.transaction(() => {
    for (const c of categories) insertCategory.run(c);
  });
  tx();
}

try {
  if (!tableHasColumn(sqlite, "users", "avatar_filename")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN avatar_filename TEXT;");
  }
  if (!tableHasColumn(sqlite, "users", "city")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN city TEXT;");
  }
  if (!tableHasColumn(sqlite, "users", "country")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN country TEXT;");
  }
  if (!tableHasColumn(sqlite, "users", "expertise_level")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN expertise_level TEXT;");
  }
  if (!tableHasColumn(sqlite, "users", "badge_label")) {
    sqlite.exec("ALTER TABLE users ADD COLUMN badge_label TEXT;");
  }
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS skill_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_skill_categories_name ON skill_categories(name);

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      jti TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ip TEXT,
      user_agent TEXT,
      revoked INTEGER NOT NULL DEFAULT 0 CHECK (revoked IN (0, 1)),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_jti ON auth_sessions(jti);
  `);
  seedSkillCategories(sqlite);
  seedDemoData(sqlite);
} catch (migErr) {
  console.error("[db] Migrations:", migErr.message);
  process.exit(1);
}

/**
 * API type mysql2 : execute(sql, params) -> Promise<[rows|ResultSetHeader]>
 * - SELECT : [tableau de lignes]
 * - INSERT/UPDATE/DELETE : [{ insertId, affectedRows }]
 */
async function execute(sql, params = []) {
  const trimmed = sql.trimStart();
  const head = trimmed.substring(0, 6).toUpperCase();
  const isSelect = head === "SELECT" || trimmed.toUpperCase().startsWith("WITH");

  if (isSelect) {
    const stmt = sqlite.prepare(sql);
    const rows = params.length === 0 ? stmt.all() : stmt.all(...params);
    return [rows];
  }

  const stmt = sqlite.prepare(sql);
  const info = params.length === 0 ? stmt.run() : stmt.run(...params);
  return [
    {
      affectedRows: info.changes ?? 0,
      insertId: Number(info.lastInsertRowid ?? 0),
    },
  ];
}

module.exports.execute = execute;
module.exports.raw = sqlite;
