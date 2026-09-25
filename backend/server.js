const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { randomUUID, scryptSync, timingSafeEqual } = require('crypto');
const { sql, poolPromise } = require('./db');
const { clientDuplicateKey, clientIdentityCandidates } = require('./clientImportUtils');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_SESSION_COOKIE = 'solar_admin_session';
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const adminSessions = new Map();
console.log(`Admin authentication: ${process.env.ADMIN_PASSWORD_HASH ? 'secure hash configured' : 'development fallback password active'}`);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const productUploadDirectory = path.join(__dirname, 'uploads', 'products');
fs.mkdirSync(productUploadDirectory, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, productUploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype));
  },
});

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

function verifyAdminPassword(password) {
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (configuredHash && configuredHash.includes(':')) {
    const [salt, expectedHex] = configuredHash.split(':');
    const actual = scryptSync(String(password || ''), salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  }
  // Compatibilité développement : utiliser ADMIN_PASSWORD dans .env.
  // Le fallback historique permet aux installations existantes de migrer sans blocage.
  const configuredPassword = process.env.ADMIN_PASSWORD || 'telco';
  const actual = Buffer.from(String(password || ''));
  const expected = Buffer.from(configuredPassword);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function requireAdmin(req, res, next) {
  const token = parseCookies(req)[ADMIN_SESSION_COOKIE];
  const session = token && adminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) adminSessions.delete(token);
    return res.status(401).json({ error: 'Authentification administrateur requise' });
  }
  session.expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  req.isAdmin = true;
  next();
}

function setAdminCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${ADMIN_SESSION_TTL_MS / 1000}${secure}`);
}

app.post('/api/auth/login', (req, res) => {
  if (!verifyAdminPassword(req.body?.password)) {
    return res.status(401).json({ error: 'Mot de passe administrateur incorrect' });
  }
  const token = randomUUID();
  adminSessions.set(token, { createdAt: Date.now(), expiresAt: Date.now() + ADMIN_SESSION_TTL_MS });
  setAdminCookie(res, token);
  res.json({ authenticated: true, expiresIn: ADMIN_SESSION_TTL_MS });
});

app.get('/api/auth/me', requireAdmin, (_req, res) => {
  res.json({ authenticated: true });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req)[ADMIN_SESSION_COOKIE];
  if (token) adminSessions.delete(token);
  res.setHeader('Set-Cookie', `${ADMIN_SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  res.json({ authenticated: false });
});

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) if (session.expiresAt < now) adminSessions.delete(token);
}, 15 * 60 * 1000).unref();

// Ensure tables exist on startup
const ensureTables = async () => {
  try {
    const pool = await poolPromise;
    // Projects table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
      BEGIN
        CREATE TABLE Projects (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          CustomerInfo NVARCHAR(MAX) NOT NULL,
          Equipment NVARCHAR(MAX) NOT NULL,
          Recommendation NVARCHAR(MAX) NOT NULL,
          OrderNumber NVARCHAR(50) NULL,
          PaymentDate DATE NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Table Projects created successfully';
      END
    `);
    // Add OrderNumber column if it doesn't exist (for existing databases)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'OrderNumber')
      BEGIN
        ALTER TABLE Projects ADD OrderNumber NVARCHAR(50) NULL;
        PRINT 'Column OrderNumber added to Projects table';
      END
    `);
    // Add PaymentDate column if it doesn't exist (for existing databases)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'PaymentDate')
      BEGIN
        ALTER TABLE Projects ADD PaymentDate DATE NULL;
        PRINT 'Column PaymentDate added to Projects table';
      END
    `);
    // Add EnergySimulation column if it doesn't exist (for existing databases)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'EnergySimulation')
      BEGIN
        ALTER TABLE Projects ADD EnergySimulation NVARCHAR(MAX) NULL;
        PRINT 'Column EnergySimulation added to Projects table';
      END
    `);
    // Clients table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clients')
      BEGIN
        CREATE TABLE Clients (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(255) NOT NULL,
          Phone NVARCHAR(100) NOT NULL,
          City NVARCHAR(255) NULL,
          Notes NVARCHAR(MAX) NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Table Clients created successfully';
      END
    `);
    // Add Extra (JSON) column to Clients for extensible fields
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Clients') AND name = 'Extra')
      BEGIN
        ALTER TABLE Clients ADD Extra NVARCHAR(MAX) NULL;
        PRINT 'Column Extra added to Clients table';
      END
    `);
    // Products table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
      BEGIN
        CREATE TABLE Products (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(255) NOT NULL,
          Slug NVARCHAR(255) NOT NULL,
          Category NVARCHAR(100) NOT NULL,
          Brand NVARCHAR(50) DEFAULT 'EcoFlow',
          CapacityWh INT NULL,
          OutputPowerW INT NULL,
          Expandable BIT DEFAULT 0,
          Description NVARCHAR(MAX) NULL,
          KeyFeatures NVARCHAR(MAX) NULL,
          PriceMad FLOAT NULL,
          Url NVARCHAR(MAX) NULL,
          ImageUrl NVARCHAR(MAX) NULL,
          IsActive BIT DEFAULT 1,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Table Products created successfully';
      END
    `);
    // EquipmentItems table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EquipmentItems')
      BEGIN
        CREATE TABLE EquipmentItems (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          Name NVARCHAR(255) NOT NULL,
          DefaultPower INT NOT NULL,
          Icon NVARCHAR(100) NOT NULL,
          Category NVARCHAR(255) NOT NULL,
          SubCategory NVARCHAR(255) NOT NULL,
          IsActive BIT DEFAULT 1,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Table EquipmentItems created successfully';
      END
    `);
    // OtherSales table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OtherSales')
      BEGIN
        CREATE TABLE OtherSales (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          CustomerInfo NVARCHAR(MAX) NOT NULL,
          Products NVARCHAR(MAX) NOT NULL,
          OrderNumber NVARCHAR(50) NULL,
          PaymentDate DATE NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Table OtherSales created successfully';
      END
    `);
    console.log('Tables "Projects", "Clients", "Products", "EquipmentItems", and "OtherSales" are ready');
  } catch (err) {
    console.error('Error ensuring tables exist:', err);
  }
};

// POST /api/projects — Save a new project
app.post('/api/projects', async (req, res) => {
  try {
    const { customer, equipment, recommendation, energySimulation } = req.body;

    if (!customer || !equipment) {
      return res.status(400).json({ error: 'customer and equipment are required' });
    }

    const orderNumber = recommendation?.orderNumber || null;
    const paymentDate = recommendation?.paymentDate || null;
    const energySimulationJson = energySimulation ? JSON.stringify(energySimulation) : null;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('CustomerInfo', sql.NVarChar(sql.MAX), JSON.stringify(customer))
      .input('Equipment', sql.NVarChar(sql.MAX), JSON.stringify(equipment))
      .input('Recommendation', sql.NVarChar(sql.MAX), JSON.stringify(recommendation || {}))
      .input('OrderNumber', sql.NVarChar(50), orderNumber)
      .input('PaymentDate', sql.Date, paymentDate)
      .input('EnergySimulation', sql.NVarChar(sql.MAX), energySimulationJson)
      .query(`
        INSERT INTO Projects (CustomerInfo, Equipment, Recommendation, OrderNumber, PaymentDate, EnergySimulation)
        OUTPUT INSERTED.Id, INSERTED.OrderNumber, INSERTED.PaymentDate
        VALUES (@CustomerInfo, @Equipment, @Recommendation, @OrderNumber, @PaymentDate, @EnergySimulation)
      `);

    const newId = result.recordset[0].Id;
    const savedOrderNumber = result.recordset[0].OrderNumber;
    const savedPaymentDate = result.recordset[0].PaymentDate;
    res.status(201).json({ id: newId, orderNumber: savedOrderNumber, paymentDate: savedPaymentDate, message: 'Projet enregistré avec succès' });
  } catch (err) {
    console.error('Error saving project:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du projet' });
  }
});

// GET /api/projects — List all projects (summary)
app.get('/api/projects', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Id, CustomerInfo, OrderNumber, PaymentDate, EnergySimulation, CreatedAt
      FROM Projects
      ORDER BY CreatedAt DESC
    `);

    const projects = result.recordset.map((row) => {
      const customer = JSON.parse(row.CustomerInfo);
      return {
        id: row.Id,
        customer,
        orderNumber: row.OrderNumber,
        paymentDate: row.PaymentDate,
        energySimulation: row.EnergySimulation ? JSON.parse(row.EnergySimulation) : null,
        createdAt: row.CreatedAt,
      };
    });

    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des projets' });
  }
});

// GET /api/projects/:id — Get full project details
app.get('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .query(`
        SELECT Id, CustomerInfo, Equipment, Recommendation, OrderNumber, PaymentDate, EnergySimulation, CreatedAt
        FROM Projects
        WHERE Id = @Id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    const row = result.recordset[0];
    const project = {
      id: row.Id,
      customer: JSON.parse(row.CustomerInfo),
      equipment: JSON.parse(row.Equipment),
      recommendation: JSON.parse(row.Recommendation),
      orderNumber: row.OrderNumber,
      paymentDate: row.PaymentDate,
      energySimulation: row.EnergySimulation ? JSON.parse(row.EnergySimulation) : null,
      createdAt: row.CreatedAt,
    };

    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Erreur lors du chargement du projet' });
  }
});

// Convertit une ligne Clients (avec Extra JSON) en objet client camelCase + champs étendus
function parseClientRow(row) {
  let extra = {};
  try {
    extra = JSON.parse(row.Extra || '{}');
  } catch (e) {
    extra = {};
  }
  const fieldLabels = extra._fieldLabels || {};
  const canonicalExtra = { ...extra, _fieldLabels: { ...fieldLabels } };
  let phone = String(row.Phone || '').trim();
  const legacyAliases = {
    dirigeants: 'dirigeants',
    dirigeant: 'dirigeants',
    coordonnees: 'phone',
    coordonnee: 'phone',
    creation: 'creation',
    creationenmoyenne: 'creation',
    chiffreaffaires: 'chiffreAffaires',
    chiffreaffairesenmoyenne: 'chiffreAffaires',
    resultatnet: 'resultatNet',
    resultatnetenmoyenne: 'resultatNet',
    effectif: 'effectif',
  };
  Object.entries(extra).forEach(([key, value]) => {
    if (key.startsWith('_')) return;
    const normalizedKey = String(key).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const canonicalKey = legacyAliases[normalizedKey];
    if (!canonicalKey || value === undefined || value === null || value === '') return;
    if (canonicalKey === 'phone' && !phone) phone = String(value).trim();
    if (canonicalKey !== 'phone' && canonicalExtra[canonicalKey] === undefined) canonicalExtra[canonicalKey] = value;
    if (canonicalKey !== 'phone' && !canonicalExtra._fieldLabels[canonicalKey]) canonicalExtra._fieldLabels[canonicalKey] = fieldLabels[key] || key;
    if (key !== canonicalKey) delete canonicalExtra[key];
  });

  const storedName = String(row.Name || '').trim();
  let displayName = storedName;
  if (!displayName || /^client import[eé] ligne/i.test(displayName)) {
    const nameEntry = Object.entries(extra).find(([key, value]) => {
      const normalizedKey = String(key).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const text = String(value || '').trim();
      return /raison.?sociale|nom.?entreprise|nom.?societe/.test(normalizedKey) && text && !/^client importe ligne/i.test(text);
    });
    if (nameEntry) displayName = String(nameEntry[1]).trim();
  }
  return { id: row.Id, name: displayName, phone, city: row.City || '', notes: row.Notes || '', ...canonicalExtra };
}

// GET /api/clients — List all clients
app.get('/api/clients', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Id, Name, Phone, City, Notes, Extra
      FROM Clients
      ORDER BY Name ASC
    `);
    res.json(result.recordset.map(parseClientRow));
  } catch (err) {
    console.error('Error listing clients:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des clients' });
  }
});

// GET /api/clients/search — Search clients
app.get('/api/clients/search', async (req, res) => {
  try {
    const search = req.query.q || '';
    const pool = await poolPromise;
    const result = await pool.request()
      .input('search', sql.NVarChar(255), `%${search}%`)
      .query(`
        SELECT Id, Name, Phone, City, Notes, Extra
        FROM Clients
         WHERE Name LIKE @search OR REPLACE(Phone, ' ', '') LIKE @search OR Extra LIKE @search
        ORDER BY Name ASC
      `);
    const clients = result.recordset.map(parseClientRow);
    res.json(clients);
  } catch (err) {
    console.error('Error searching clients:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche des clients' });
  }
});

const clientImportSessions = new Map();

async function createClientImportSession() {
  const pool = await poolPromise;
  const existingResult = await pool.request().query(`SELECT Id, Name, Phone, City, Notes, Extra FROM Clients`);
  const records = new Map();
  const identityIndex = new Map();
  existingResult.recordset.forEach((row) => {
    const client = parseClientRow(row);
    records.set(client.id, client);
    clientIdentityCandidates(client).forEach((key) => {
      if (!identityIndex.has(key)) identityIndex.set(key, new Set());
      identityIndex.get(key).add(client.id);
    });
  });
  const id = randomUUID();
  clientImportSessions.set(id, { records, identityIndex, touchedAt: Date.now() });
  return id;
}

function findExistingClient(client, session) {
  const candidateIds = new Set();
  for (const key of clientIdentityCandidates(client)) {
    const ids = session.identityIndex.get(key);
    if (ids) ids.forEach((id) => candidateIds.add(id));
  }
  if (candidateIds.size === 1) return [...candidateIds][0];
  // Si plusieurs fiches partagent le nom, ne fusionne jamais arbitrairement.
  // L'identité forte (email ou nom+téléphone) doit être unique.
  const strongKeys = clientIdentityCandidates(client).filter((key) => key.startsWith('name-email:') || key.startsWith('name-phone:'));
  const strongIds = new Set();
  strongKeys.forEach((key) => (session.identityIndex.get(key) || []).forEach((id) => strongIds.add(id)));
  if (strongIds.size === 1) return [...strongIds][0];
  // Si une ancienne importation a déjà créé plusieurs copies de la même
  // identité forte, on enrichit la plus ancienne au lieu d'en créer une autre.
  return strongIds.size > 1 ? Math.min(...strongIds) : null;
}

function mergeImportedClient(existing, incoming) {
  const coreKeys = ['name', 'phone', 'city', 'notes'];
  const merged = { ...existing };
  coreKeys.forEach((key) => {
    if (incoming[key] !== undefined && incoming[key] !== null && String(incoming[key]).trim() !== '' && !/^client importe ligne/i.test(String(incoming[key]))) {
      merged[key] = String(incoming[key]).trim();
    }
  });
  Object.entries(incoming).forEach(([key, value]) => {
    if (coreKeys.includes(key) || key.startsWith('_') || value === undefined || value === null || String(value).trim() === '') return;
    merged[key] = value;
  });
  merged._fieldLabels = { ...(existing._fieldLabels || {}), ...(incoming._fieldLabels || {}) };
  return merged;
}

function hasImportedChanges(existing, incoming) {
  for (const [key, value] of Object.entries(incoming)) {
    if (key.startsWith('_') || value === undefined || value === null || String(value).trim() === '') continue;
    if (key === 'name' && /^client importe ligne/i.test(String(value))) continue;
    if (String(existing[key] ?? '').trim() !== String(value).trim()) return true;
  }
  for (const [key, value] of Object.entries(incoming._fieldLabels || {})) {
    if ((existing._fieldLabels || {})[key] !== value) return true;
  }
  return false;
}

function clientExtra(client) {
  const extra = {};
  Object.entries(client).forEach(([key, value]) => {
    if (!['id', 'name', 'phone', 'city', 'notes', '_sourceRow'].includes(key) && value !== undefined && value !== null && value !== '') extra[key] = value;
  });
  return extra;
}

async function importClientBatch(clients, session) {
  const pool = await poolPromise;
  if (!session) {
    const existingResult = await pool.request().query(`SELECT Id, Name, Phone, City, Notes, Extra FROM Clients`);
    session = { records: new Map(), identityIndex: new Map(), touchedAt: Date.now() };
    existingResult.recordset.forEach((row) => {
      const client = parseClientRow(row);
      session.records.set(client.id, client);
      clientIdentityCandidates(client).forEach((key) => {
        if (!session.identityIndex.has(key)) session.identityIndex.set(key, new Set());
        session.identityIndex.get(key).add(client.id);
      });
    });
  }
  if (session) session.touchedAt = Date.now();
  const accepted = [];
  const updates = [];
  const duplicates = [];
  const pendingIdentityKeys = new Set();

  clients.forEach((rawClient, index) => {
    const client = rawClient && typeof rawClient === 'object' ? rawClient : {};
    const hasValue = Object.entries(client).some(([key, value]) => !key.startsWith('_') && value !== undefined && value !== null && String(value).trim() !== '');
    if (!hasValue) return;
    const safeClient = {
      ...client,
      name: String(client.name || `Client importé ligne ${client._sourceRow || index + 1}`).trim(),
      phone: String(client.phone || '').replace(/[\s\-\.\(\)]/g, ''),
      city: String(client.city || '').trim(),
      notes: String(client.notes || '').trim(),
    };
    const existingId = findExistingClient(safeClient, session);
    if (existingId) {
      const existing = session.records.get(existingId);
      const merged = mergeImportedClient(existing, safeClient);
      if (hasImportedChanges(existing, safeClient)) {
        updates.push({ id: existingId, client: merged, sourceRow: safeClient._sourceRow || index + 1 });
        session.records.set(existingId, merged);
        clientIdentityCandidates(merged).forEach((key) => {
          if (!session.identityIndex.has(key)) session.identityIndex.set(key, new Set());
          session.identityIndex.get(key).add(existingId);
        });
      } else {
        duplicates.push({ sourceRow: safeClient._sourceRow || index + 1, name: safeClient.name, reason: 'Ligne déjà enregistrée sans nouvelle donnée' });
      }
      return;
    }
    const incomingIdentityKeys = clientIdentityCandidates(safeClient);
    if (incomingIdentityKeys.some((key) => pendingIdentityKeys.has(key))) {
      duplicates.push({ sourceRow: safeClient._sourceRow || index + 1, name: safeClient.name, reason: 'Ligne identique déjà présente dans ce fichier' });
      return;
    }
    incomingIdentityKeys.forEach((key) => pendingIdentityKeys.add(key));
    accepted.push(safeClient);
  });

  // Les lignes nouvelles sont insérées ensemble.
  let inserted = [];
  if (accepted.length > 0) {
    const request = pool.request();
    const values = accepted.map((client, index) => {
      request
        .input(`name_${index}`, sql.NVarChar(255), client.name)
        .input(`phone_${index}`, sql.NVarChar(100), client.phone)
        .input(`city_${index}`, sql.NVarChar(255), client.city)
        .input(`notes_${index}`, sql.NVarChar(sql.MAX), client.notes)
        .input(`extra_${index}`, sql.NVarChar(sql.MAX), JSON.stringify(clientExtra(client)));
      return `(@name_${index}, @phone_${index}, @city_${index}, @notes_${index}, @extra_${index})`;
    });
    const result = await request.query(`
      INSERT INTO Clients (Name, Phone, City, Notes, Extra)
      OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Phone, INSERTED.City, INSERTED.Notes, INSERTED.Extra
      VALUES ${values.join(',\n')}
    `);
    inserted = result.recordset.map(parseClientRow);
    inserted.forEach((client) => {
      session.records.set(client.id, client);
      clientIdentityCandidates(client).forEach((key) => {
        if (!session.identityIndex.has(key)) session.identityIndex.set(key, new Set());
        session.identityIndex.get(key).add(client.id);
      });
    });
  }

  // Les fiches existantes sont enrichies sans créer une deuxième ligne.
  let updated = [];
  if (updates.length > 0) {
    const request = pool.request();
    const statements = updates.map((entry, index) => {
      request
        .input(`update_id_${index}`, sql.Int, entry.id)
        .input(`update_name_${index}`, sql.NVarChar(255), entry.client.name)
        .input(`update_phone_${index}`, sql.NVarChar(100), entry.client.phone)
        .input(`update_city_${index}`, sql.NVarChar(255), entry.client.city)
        .input(`update_notes_${index}`, sql.NVarChar(sql.MAX), entry.client.notes)
        .input(`update_extra_${index}`, sql.NVarChar(sql.MAX), JSON.stringify(clientExtra(entry.client)));
      return `UPDATE Clients SET Name=@update_name_${index}, Phone=@update_phone_${index}, City=@update_city_${index}, Notes=@update_notes_${index}, Extra=@update_extra_${index}, CreatedAt=CreatedAt WHERE Id=@update_id_${index};`;
    });
    await request.query(statements.join('\n'));
    const ids = updates.map((entry) => entry.id).join(',');
    const verified = await pool.request().query(`SELECT Id, Name, Phone, City, Notes, Extra FROM Clients WHERE Id IN (${ids})`);
    updated = verified.recordset.map(parseClientRow);
  }
  return { inserted: [...inserted, ...updated], duplicates, updated };
}

// Initialise une session : les clés existantes ne sont chargées qu'une fois pour tous les lots.
app.post('/api/clients/import-start', requireAdmin, async (_req, res) => {
  try {
    const importId = await createClientImportSession();
    res.json({ importId });
  } catch (err) {
    console.error('Error starting client import:', err);
    res.status(500).json({ error: 'Impossible de préparer l’import', details: err.message });
  }
});

app.post('/api/clients/import-finish', requireAdmin, (req, res) => {
  if (req.body?.importId) clientImportSessions.delete(req.body.importId);
  res.json({ message: 'Session d’import terminée' });
});

// POST /api/clients/import-batch — insertion SQL groupée avec retour de vérification
app.post('/api/clients/import-batch', requireAdmin, async (req, res) => {
  try {
    const { clients } = req.body || {};
    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ error: 'Aucun client à importer' });
    }
    if (clients.length > 250) return res.status(400).json({ error: 'Un lot ne peut pas dépasser 250 lignes' });
    const session = req.body.importId ? clientImportSessions.get(req.body.importId) : null;
    if (req.body.importId && !session) return res.status(410).json({ error: 'Session d’import expirée. Veuillez recommencer.' });
    const result = await importClientBatch(clients, session);
    res.json({
      message: `${result.inserted.length - result.updated.length} nouveau(x) client(s), ${result.updated.length} fiche(s) enrichie(s)`,
      count: result.inserted.length - result.updated.length,
      updatedCount: result.updated.length,
      duplicateCount: result.duplicates.length,
      inserted: result.inserted,
      duplicates: result.duplicates,
    });
  } catch (err) {
    console.error('Error importing client batch:', err);
    res.status(500).json({ error: 'Échec de l’insertion du lot', details: err.message });
  }
});

// Nettoyage des sessions abandonnées après 30 minutes.
setInterval(() => {
  const expiration = Date.now() - 30 * 60 * 1000;
  for (const [id, session] of clientImportSessions.entries()) {
    if (session.touchedAt < expiration) clientImportSessions.delete(id);
  }
}, 5 * 60 * 1000).unref();

// Compatibilité avec les anciennes versions du frontend (maximum 250 lignes).
app.post('/api/clients/import', requireAdmin, async (req, res) => {
  try {
    const clients = Array.isArray(req.body?.clients) ? req.body.clients : [];
    if (!clients.length) return res.status(400).json({ error: 'Aucun client à importer' });
    if (clients.length > 250) return res.status(400).json({ error: 'Utilisez /api/clients/import-batch par lots de 250 lignes maximum' });
    const result = await importClientBatch(clients);
    res.json({ count: result.inserted.length, duplicateCount: result.duplicates.length });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l’import des clients', details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Products API
// ─────────────────────────────────────────────────────────────

// GET /api/products — List all active products, optionally filtered by category
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const pool = await poolPromise;
    let query = `
      SELECT Id, Name, Slug, Category, Brand, CapacityWh, OutputPowerW,
             Expandable, Description, KeyFeatures, PriceMad, Url, ImageUrl,
             IsActive, CreatedAt, UpdatedAt
      FROM Products
      WHERE IsActive = 1
    `;
    const params = [];
    if (category) {
      query += ` AND Category = @Category`;
      params.push({ name: 'Category', value: category });
    }
    query += ` ORDER BY Category, Name`;

    const request = pool.request();
    params.forEach(p => request.input(p.name, sql.NVarChar(100), p.value));
    const result = await request.query(query);

    const products = result.recordset.map(row => ({
      id: row.Id,
      name: row.Name,
      slug: row.Slug,
      category: row.Category,
      brand: row.Brand,
      capacityWh: row.CapacityWh,
      outputPowerW: row.OutputPowerW,
      expandable: row.Expandable === true || row.Expandable === 1 || row.Expandable === '1',
      description: row.Description,
      keyFeatures: row.KeyFeatures ? JSON.parse(row.KeyFeatures) : null,
      priceMad: row.PriceMad,
      url: row.Url,
      imageUrl: row.ImageUrl,
      isActive: row.IsActive,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
    }));

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des produits' });
  }
});

// GET /api/products/:slug — Get a single product by slug
app.get('/api/products/:slug', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Slug', sql.NVarChar(255), req.params.slug)
      .query(`
        SELECT Id, Name, Slug, Category, Brand, CapacityWh, OutputPowerW,
               Expandable, Description, KeyFeatures, PriceMad, Url, ImageUrl,
               IsActive, CreatedAt, UpdatedAt
        FROM Products
        WHERE Slug = @Slug AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const row = result.recordset[0];
    res.json({
      id: row.Id,
      name: row.Name,
      slug: row.Slug,
      category: row.Category,
      brand: row.Brand,
      capacityWh: row.CapacityWh,
      outputPowerW: row.OutputPowerW,
      expandable: row.Expandable === true || row.Expandable === 1 || row.Expandable === '1',
      description: row.Description,
      keyFeatures: row.KeyFeatures ? JSON.parse(row.KeyFeatures) : null,
      priceMad: row.PriceMad,
      url: row.Url,
      imageUrl: row.ImageUrl,
      isActive: row.IsActive,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Erreur lors du chargement du produit' });
  }
});

// POST /api/products — Create a new product
app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const { name, slug, category, brand, capacityWh, outputPowerW, expandable,
            description, keyFeatures, priceMad, url, imageUrl } = req.body;

    if (!name || !slug || !category) {
      return res.status(400).json({ error: 'name, slug, and category are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Name', sql.NVarChar(255), name)
      .input('Slug', sql.NVarChar(255), slug)
      .input('Category', sql.NVarChar(100), category)
      .input('Brand', sql.NVarChar(50), brand || 'EcoFlow')
      .input('CapacityWh', sql.Int, capacityWh || null)
      .input('OutputPowerW', sql.Int, outputPowerW || null)
      .input('Expandable', sql.Bit, expandable ? 1 : 0)
      .input('Description', sql.NVarChar(sql.MAX), description || null)
      .input('KeyFeatures', sql.NVarChar(sql.MAX), keyFeatures ? JSON.stringify(keyFeatures) : null)
      .input('PriceMad', sql.Float, priceMad || null)
      .input('Url', sql.NVarChar(sql.MAX), url || null)
      .input('ImageUrl', sql.NVarChar(sql.MAX), imageUrl || null)
      .query(`
        INSERT INTO Products (Name, Slug, Category, Brand, CapacityWh, OutputPowerW,
                Expandable, Description, KeyFeatures, PriceMad, Url, ImageUrl)
        OUTPUT INSERTED.Id
        VALUES (@Name, @Slug, @Category, @Brand, @CapacityWh, @OutputPowerW,
                @Expandable, @Description, @KeyFeatures, @PriceMad, @Url, @ImageUrl)
      `);

    res.status(201).json({ id: result.recordset[0].Id, message: 'Produit créé avec succès' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Un produit avec ce slug existe déjà' });
    }
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
});

// PUT /api/products/:id — Modification complète d'un produit (admin)
app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const { name, slug, category, brand, capacityWh, outputPowerW, expandable,
      description, keyFeatures, priceMad, url, imageUrl } = req.body;
    if (!name || !slug || !category) return res.status(400).json({ error: 'name, slug, and category are required' });
    const pool = await poolPromise;
    const exists = await pool.request().input('Id', sql.Int, parseInt(req.params.id)).query(`SELECT Id FROM Products WHERE Id=@Id AND IsActive=1`);
    if (!exists.recordset.length) return res.status(404).json({ error: 'Produit non trouvé' });
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .input('Name', sql.NVarChar(255), name)
      .input('Slug', sql.NVarChar(255), slug)
      .input('Category', sql.NVarChar(100), category)
      .input('Brand', sql.NVarChar(50), brand || 'EcoFlow')
      .input('CapacityWh', sql.Int, capacityWh === '' || capacityWh === undefined ? null : parseInt(capacityWh))
      .input('OutputPowerW', sql.Int, outputPowerW === '' || outputPowerW === undefined ? null : parseInt(outputPowerW))
      .input('Expandable', sql.Bit, expandable ? 1 : 0)
      .input('Description', sql.NVarChar(sql.MAX), description || null)
      .input('KeyFeatures', sql.NVarChar(sql.MAX), keyFeatures ? JSON.stringify(keyFeatures) : null)
      .input('PriceMad', sql.Float, priceMad === '' || priceMad === undefined ? null : parseFloat(priceMad))
      .input('Url', sql.NVarChar(sql.MAX), url || null)
      .query(`
        UPDATE Products SET Name=@Name, Slug=@Slug, Category=@Category, Brand=@Brand,
          CapacityWh=@CapacityWh, OutputPowerW=@OutputPowerW, Expandable=@Expandable,
          Description=@Description, KeyFeatures=@KeyFeatures, PriceMad=@PriceMad,
          Url=@Url, UpdatedAt=GETDATE()
        WHERE Id=@Id AND IsActive=1
      `);
    res.json({ message: 'Produit modifié avec succès' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Un produit avec ce slug existe déjà' });
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Erreur lors de la modification du produit' });
  }
});

// POST /api/products/:id/image — Upload local optimisé, SQL ne conserve que l'URL
app.post('/api/products/:id/image', requireAdmin, (req, res) => {
  productImageUpload.single('image')(req, res, async (uploadError) => {
    if (uploadError) {
      const message = uploadError.code === 'LIMIT_FILE_SIZE'
        ? 'Image trop volumineuse (maximum 5 Mo)'
        : 'Format d’image non accepté. Utilisez JPG, PNG, WEBP ou GIF.';
      return res.status(400).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucune image reçue' });
    try {
      const id = parseInt(req.params.id);
      const pool = await poolPromise;
      const oldResult = await pool.request().input('Id', sql.Int, id)
        .query(`SELECT ImageUrl FROM Products WHERE Id=@Id AND IsActive=1`);
      if (!oldResult.recordset.length) {
        fs.unlink(req.file.path, () => undefined);
        return res.status(404).json({ error: 'Produit non trouvé' });
      }
      const imageUrl = `/uploads/products/${req.file.filename}`;
      await pool.request()
        .input('Id', sql.Int, id)
        .input('ImageUrl', sql.NVarChar(sql.MAX), imageUrl)
        .query(`UPDATE Products SET ImageUrl=@ImageUrl, UpdatedAt=GETDATE() WHERE Id=@Id`);

      const oldUrl = oldResult.recordset[0].ImageUrl;
      if (oldUrl && oldUrl.startsWith('/uploads/products/')) {
        fs.unlink(path.join(__dirname, oldUrl.replace(/^\//, '')), () => undefined);
      }
      res.json({ imageUrl, message: 'Image du produit enregistrée avec succès' });
    } catch (err) {
      fs.unlink(req.file.path, () => undefined);
      console.error('Error uploading product image:', err);
      res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’image' });
    }
  });
});

app.delete('/api/products/:id/image', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pool = await poolPromise;
    const result = await pool.request().input('Id', sql.Int, id)
      .query(`SELECT ImageUrl FROM Products WHERE Id=@Id AND IsActive=1`);
    if (!result.recordset.length) return res.status(404).json({ error: 'Produit non trouvé' });
    const imageUrl = result.recordset[0].ImageUrl;
    await pool.request().input('Id', sql.Int, id)
      .query(`UPDATE Products SET ImageUrl=NULL, UpdatedAt=GETDATE() WHERE Id=@Id`);
    if (imageUrl && imageUrl.startsWith('/uploads/products/')) fs.unlink(path.join(__dirname, imageUrl.replace(/^\//, '')), () => undefined);
    res.json({ message: 'Image supprimée avec succès' });
  } catch (err) {
    console.error('Error deleting product image:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de l’image' });
  }
});

// DELETE /api/products/:id — Suppression physique du catalogue.
// Les ventes historiques stockent déjà le snapshot du produit dans OtherSales,
// donc la suppression du catalogue ne casse pas les anciens documents.
app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const exists = await pool.request().input('Id', sql.Int, parseInt(req.params.id)).query(`SELECT Id FROM Products WHERE Id=@Id`);
    if (!exists.recordset.length) return res.status(404).json({ error: 'Produit non trouvé' });
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .query(`DELETE FROM Products WHERE Id=@Id`);
    res.json({ message: 'Produit supprimé définitivement du catalogue' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

// POST /api/products/seed — Seed initial products for recommendation engine
app.post('/api/products/seed', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;

    // Check if products already exist
    const check = await pool.request().query(`SELECT COUNT(*) AS cnt FROM Products`);
    if (check.recordset[0].cnt > 0) {
      return res.json({ message: 'Des produits existent déjà, aucun seed effectué', count: 0 });
    }

   const products = [
  // ========== SOLAR PANELS (category: panel) ==========
  {
    name: 'BLUETTI 400W Portable Solar Panel',
    slug: '400w-portable-solar-panel',
    category: 'panel',
    brand: 'BLUETTI',
    capacityWh: null,
    outputPowerW: 400,
    expandable: false,
    description: 'Foldable 400W portable solar panel designed for BLUETTI portable power stations and energy storage systems.',
    keyFeatures: JSON.stringify([
      '400W output',
      'Foldable design',
      'Portable',
      'High conversion efficiency',
      'Compatible with BLUETTI power stations',
      'Outdoor use'
    ]),
    priceMad: 583.33,
    url: 'https://fr.ecoflow.com/products/400w-lightweight-portable-solar-panel?variant=51300297998683',
    imageUrl: 'https://www.easypower.ma/web/image/product.product/87/image_1024/%5BPSO-000008%5D%20400W%20PORTABLE%20SOLAR%20PANEL?unique=b565004',
    isActive: 1,
  },

  // ========== POWER STATIONS & BATTERIES (category: battery) ==========
  {
    name: 'BLUETTI Premium 100 V2',
    slug: 'premium-100-v2',
    category: 'battery',
    brand: 'BLUETTI',
    capacityWh: 1024,
    outputPowerW: 1800,
    expandable: false,
    description: 'Portable LiFePO4 power station with 1024Wh capacity, 1800W AC output (2700W Power Lifting), ultra-fast charging and 1000W solar input.',
    keyFeatures: JSON.stringify([
      '1024Wh LiFePO4 battery',
      '1800W AC output (2700W peak Power Lifting)',
      '1000W solar input',
      '1200W Turbo AC charging',
      '80% charge in 45 minutes',
      '4000+ battery cycles',
      '30dB quiet operation',
      '10-year battery lifespan'
    ]),
    priceMad: 599,
    url: 'https://fr.bluettipower.eu/products/bluetti-premium-100-v2-station-d-energie-portable?srsltid=AfmBOopMzIsAt7uUCGwsOMEiCE446_SsOdyZpqvRxEI-5v5JyfaJFpf9',
    imageUrl: 'https://fr.bluettipower.eu/cdn/shop/files/Premium100V2EU_1.svg?v=1776948374&width=800',
    isActive: 1,
  },
  {
    name: 'BLUETTI Premium 200 V2',
    slug: 'premium-200-v2',
    category: 'battery',
    brand: 'BLUETTI',
    capacityWh: 2073.6,
    outputPowerW: 2700,
    expandable: false,
    description: 'Portable LiFePO₄ power station with 2073.6Wh capacity, 2700W AC output (4050W Power Lifting), ultra-fast charging, 1000W solar input, and intelligent app control.',
    keyFeatures: JSON.stringify([
      '2073.6Wh LiFePO₄ battery',
      '2700W AC output (4050W Power Lifting)',
      '1000W solar input',
      '1500W Turbo AC charging',
      '6000+ battery cycles',
      '0.015s UPS mode',
      'WiFi & Bluetooth app control',
      '100W USB-C fast charging',
      '15W wireless charging',
      '10-year battery lifespan'
    ]),
    priceMad: 1099.17,
    url: 'https://fr.bluettipower.eu/products/bluetti-premium-200-v2-portable-power-station?srsltid=AfmBOorFA04DPNO_VggDrSnOkwHyn2FAPl0mbuu6IcB4AynVdy5-bRHt',
    imageUrl: 'https://fr.bluettipower.eu/cdn/shop/files/Premium_200_V2_EU_1x_4eb94afd-ffa3-4dac-ba71-4960a4a922b9.png?v=1779264826&width=800',
    isActive: 1,
  },
  {
    name: 'BLUETTI Balco 260',
    slug: 'balco-260',
    category: 'battery',
    brand: 'BLUETTI',
    capacityWh: 2560,
    outputPowerW: 1200,
    expandable: true,
    description: 'Smart balcony solar energy storage system with integrated bidirectional inverter and expandable LiFePO4 battery.',
    keyFeatures: JSON.stringify([
      '2560Wh LiFePO4 battery',
      '1200W bidirectional inverter',
      '2400W solar input (4 MPPT)',
      'Expandable to 15kWh',
      '96.1% conversion efficiency',
      '6000 battery cycles',
      'IP65 protection',
      'Wi-Fi & Bluetooth'
    ]),
    priceMad: 874.17,
    url: 'https://fr.bluettipower.eu/pages/panneau-solaire-balcon?srsltid=AfmBOoptzGZN6tVpS6I90FE3Kq6PPKZ3POgJ0kHfah8w92EPDEUS4BR3',
    imageUrl: 'https://www.revolution-energetique.com/_next/image/?url=https%3A%2F%2Fcdn.revolution-energetique.com%2Fuploads%2F2026%2F06%2Fbluetti-balco-260.jpg&w=3840&q=75',
    isActive: 1,
  },
];

    let inserted = 0;
    for (const p of products) {
      await pool.request()
        .input('Name', sql.NVarChar(255), p.name)
        .input('Slug', sql.NVarChar(255), p.slug)
        .input('Category', sql.NVarChar(100), p.category)
        .input('Brand', sql.NVarChar(50), p.brand)
        .input('CapacityWh', sql.Int, p.capacityWh)
        .input('OutputPowerW', sql.Int, p.outputPowerW)
        .input('Expandable', sql.Bit, p.expandable ? 1 : 0)
        .input('Description', sql.NVarChar(sql.MAX), p.description)
        .input('KeyFeatures', sql.NVarChar(sql.MAX), p.keyFeatures)
        .input('PriceMad', sql.Float, p.priceMad)
        .input('Url', sql.NVarChar(sql.MAX), p.url)
        .input('ImageUrl', sql.NVarChar(sql.MAX), p.imageUrl)
        .input('IsActive', sql.Bit, p.isActive)
        .query(`
          INSERT INTO Products (Name, Slug, Category, Brand, CapacityWh, OutputPowerW,
                  Expandable, Description, KeyFeatures, PriceMad, Url, ImageUrl, IsActive)
          VALUES (@Name, @Slug, @Category, @Brand, @CapacityWh, @OutputPowerW,
                  @Expandable, @Description, @KeyFeatures, @PriceMad, @Url, @ImageUrl, @IsActive)
        `);
      inserted++;
    }

    res.json({ message: `${inserted} produits ajoutés avec succès`, count: inserted });
  } catch (err) {
    console.error('Error seeding products:', err);
    res.status(500).json({ error: 'Erreur lors du seed des produits' });
  }
});

// ─────────────────────────────────────────────────────────────
// Equipment Items API
// ─────────────────────────────────────────────────────────────

// GET /api/equipment — List all active equipment, optionally filtered by category
app.get('/api/equipment', async (req, res) => {
  try {
    const { category } = req.query;
    const pool = await poolPromise;
    let query = `
      SELECT Id, Name, DefaultPower, Icon, Category, SubCategory, IsActive, CreatedAt, UpdatedAt
      FROM EquipmentItems
      WHERE IsActive = 1
    `;
    const params = [];
    if (category) {
      query += ` AND Category = @Category`;
      params.push({ name: 'Category', value: category });
    }
    query += ` ORDER BY Category, SubCategory, Name`;

    const request = pool.request();
    params.forEach(p => request.input(p.name, sql.NVarChar(255), p.value));
    const result = await request.query(query);

    const items = result.recordset.map(row => ({
      id: row.Id,
      name: row.Name,
      defaultPower: row.DefaultPower,
      icon: row.Icon,
      category: row.Category,
      subCategory: row.SubCategory,
      isActive: row.IsActive === true || row.IsActive === 1 || row.IsActive === '1',
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des équipements' });
  }
});

// POST /api/equipment — Create a new equipment item
app.post('/api/equipment', requireAdmin, async (req, res) => {
  try {
    const { name, defaultPower, icon, category, subCategory } = req.body;

    if (!name || defaultPower === undefined || !icon || !category || !subCategory) {
      return res.status(400).json({ error: 'name, defaultPower, icon, category, and subCategory are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Name', sql.NVarChar(255), name)
      .input('DefaultPower', sql.Int, parseInt(defaultPower))
      .input('Icon', sql.NVarChar(100), icon)
      .input('Category', sql.NVarChar(255), category)
      .input('SubCategory', sql.NVarChar(255), subCategory)
      .query(`
        INSERT INTO EquipmentItems (Name, DefaultPower, Icon, Category, SubCategory)
        OUTPUT INSERTED.Id
        VALUES (@Name, @DefaultPower, @Icon, @Category, @SubCategory)
      `);

    res.status(201).json({ id: result.recordset[0].Id, message: 'Équipement créé avec succès' });
  } catch (err) {
    console.error('Error creating equipment:', err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'équipement' });
  }
});

// PUT /api/equipment/:id — Update an equipment item
app.put('/api/equipment/:id', requireAdmin, async (req, res) => {
  try {
    const { name, defaultPower, icon, category, subCategory } = req.body;
    const pool = await poolPromise;

    // Check existence first
    const check = await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .query(`SELECT Id FROM EquipmentItems WHERE Id = @Id AND IsActive = 1`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ error: 'Équipement non trouvé' });
    }

    await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .input('Name', sql.NVarChar(255), name)
      .input('DefaultPower', sql.Int, parseInt(defaultPower))
      .input('Icon', sql.NVarChar(100), icon)
      .input('Category', sql.NVarChar(255), category)
      .input('SubCategory', sql.NVarChar(255), subCategory)
      .query(`
        UPDATE EquipmentItems
        SET Name = @Name, DefaultPower = @DefaultPower, Icon = @Icon,
            Category = @Category, SubCategory = @SubCategory,
            UpdatedAt = GETDATE()
        WHERE Id = @Id
      `);

    res.json({ message: 'Équipement mis à jour avec succès' });
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'équipement' });
  }
});

// POST /api/equipment/seed — Seed initial equipment catalog from static data
app.post('/api/equipment/seed', requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;

    // Check if equipment already exists
    const check = await pool.request().query(`SELECT COUNT(*) AS cnt FROM EquipmentItems`);
    if (check.recordset[0].cnt > 0) {
      return res.json({ message: 'Des équipements existent déjà, aucun seed effectué', count: 0 });
    }

    // Static equipment catalog data
    const CATEGORIES = [
      '1. Création de contenu & médias terrain',
      '2. Événementiel & commerce mobile',
      '3. Travail mobile & services professionnels',
      '4. BTP, maintenance & interventions techniques',
      '5. Agriculture & sites isolés',
      '6. Secours, humanitaire & sécurité',
      '7. Hospitality & hébergements off-grid',
    ];

    const equipmentData = [
      // ── 1. Création de contenu & médias terrain ──
      // 1.1 Production audiovisuelle mobile (59.11B)
      { name: 'Caméra cinéma / pro', defaultPower: 25, icon: 'Videocam', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
      { name: 'Moniteur terrain', defaultPower: 30, icon: 'Monitor', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
      { name: 'Enregistreur / recorder', defaultPower: 15, icon: 'FiberManualRecord', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
      { name: 'Station montage laptop', defaultPower: 90, icon: 'Laptop', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
      { name: 'SSD / stockage externe', defaultPower: 10, icon: 'Storage', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
      { name: 'Routeur 4G/5G', defaultPower: 10, icon: 'Router', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
      { name: 'Éclairage LED vidéo', defaultPower: 150, icon: 'Light', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
      { name: 'Batteries / chargeurs', defaultPower: 60, icon: 'BatteryChargingFull', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
      // 1.2 Photographes professionnels terrain (74.20Z)
      { name: 'Appareil photo pro', defaultPower: 10, icon: 'CameraAlt', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
      { name: 'Objectifs motorisés / accessoires', defaultPower: 5, icon: 'Camera', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
      { name: 'Laptop retouche', defaultPower: 60, icon: 'Laptop', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
      { name: 'SSD stockage', defaultPower: 10, icon: 'Storage', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
      { name: 'Imprimante photo portable', defaultPower: 120, icon: 'Print', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
      { name: 'Batterie / chargeurs', defaultPower: 40, icon: 'BatteryChargingFull', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
      // 1.3 Télépilotes drones professionnels (74.90B)
      { name: 'Drone (charge + prep)', defaultPower: 80, icon: 'Flight', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
      { name: 'Stations batteries multiples', defaultPower: 200, icon: 'BatteryChargingFull', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
      { name: 'Contrôleur / écran terrain', defaultPower: 25, icon: 'Tablet', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
      { name: 'Laptop analyse', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
      { name: 'Tablette contrôle', defaultPower: 15, icon: 'Tablet', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
      { name: 'GPS / instruments', defaultPower: 10, icon: 'Explore', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
      // 1.4 Sonorisation / régie mobile (90.02Z)
      { name: 'Console audio', defaultPower: 80, icon: 'Tune', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
      { name: 'Enceintes actives', defaultPower: 1000, icon: 'VolumeUp', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
      { name: 'Amplificateurs', defaultPower: 1500, icon: 'VolumeUp', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
      { name: 'Micro HF / systèmes RF', defaultPower: 20, icon: 'Mic', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
      { name: 'Laptop régie', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
      { name: 'Éclairage scène LED', defaultPower: 500, icon: 'Light', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
      // 1.5 Studios créatifs mobiles (74.10Z)
      { name: 'Station de montage pro', defaultPower: 150, icon: 'DesktopWindows', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
      { name: 'Écran calibré', defaultPower: 40, icon: 'Monitor', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
      { name: 'NAS / stockage', defaultPower: 60, icon: 'Storage', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
      { name: 'Routeur fibre/4G', defaultPower: 15, icon: 'Router', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
      { name: 'Éclairage studio LED', defaultPower: 200, icon: 'Light', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
      { name: 'Tablette graphique', defaultPower: 20, icon: 'Draw', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
      { name: 'Interface audio/vidéo', defaultPower: 30, icon: 'LinearScale', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },

      // ── 2. Événementiel & commerce mobile ──
      // 2.1 Organisation événementielle mobile (82.30Z)
      { name: 'Sonorisation mobile (PA)', defaultPower: 800, icon: 'VolumeUp', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
      { name: 'Console de mixage', defaultPower: 80, icon: 'Tune', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
      { name: 'Éclairage événementiel LED', defaultPower: 600, icon: 'Light', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
      { name: 'Écran LED / projection', defaultPower: 300, icon: 'DisplaySettings', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
      { name: 'Régie / laptop', defaultPower: 90, icon: 'Laptop', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
      { name: 'Routeur 4G/5G', defaultPower: 10, icon: 'Router', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
      { name: 'Groupe froid mobile (option)', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
      // 2.2 Food trucks (56.10C)
      { name: 'Réfrigérateur professionnel', defaultPower: 200, icon: 'Kitchen', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
      { name: 'Congélateur coffre', defaultPower: 250, icon: 'Kitchen', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
      { name: 'Plaque cuisson / gaz électrique', defaultPower: 3500, icon: 'Cooktop', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
      { name: 'Friteuse électrique', defaultPower: 3500, icon: 'Cooktop', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
      { name: 'Hotte aspirante', defaultPower: 300, icon: 'Air', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
      { name: 'Machine café (option)', defaultPower: 3000, icon: 'CoffeeMaker', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
      { name: 'Éclairage LED', defaultPower: 50, icon: 'Light', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
      // 2.3 Coffee trucks (56.10C)
      { name: 'Machine espresso pro', defaultPower: 3000, icon: 'CoffeeMaker', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
      { name: 'Moulin à café', defaultPower: 350, icon: 'CoffeeMaker', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
      { name: 'Réfrigérateur lait', defaultPower: 150, icon: 'Kitchen', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
      { name: 'Pompe eau / système', defaultPower: 200, icon: 'Waves', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
      { name: 'Éclairage LED', defaultPower: 50, icon: 'Light', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
      { name: 'POS / caisse', defaultPower: 40, icon: 'PointOfSale', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
      // 2.4 Pop-up retail (47.19B)
      { name: 'Éclairage vitrine LED', defaultPower: 200, icon: 'Light', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
      { name: 'Écrans publicitaires', defaultPower: 150, icon: 'DisplaySettings', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
      { name: 'Caisse / POS', defaultPower: 40, icon: 'PointOfSale', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
      { name: 'Routeur internet', defaultPower: 10, icon: 'Router', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
      { name: 'Terminal paiement', defaultPower: 10, icon: 'CreditCard', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
      { name: 'Climatisation mobile', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
      // 2.5 Stands commerciaux mobiles (73.11Z)
      { name: 'Écran interactif', defaultPower: 200, icon: 'TouchApp', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
      { name: 'PC portable', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
      { name: 'Imprimante tickets', defaultPower: 50, icon: 'Print', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
      { name: 'Éclairage LED', defaultPower: 100, icon: 'Light', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
      { name: 'Routeur 4G', defaultPower: 10, icon: 'Router', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
      // 2.6 Retail mobile premium (47.43Z)
      { name: 'Éclairage design LED', defaultPower: 300, icon: 'Light', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
      { name: 'Vitrine réfrigérée', defaultPower: 400, icon: 'Kitchen', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
      { name: 'Système audio ambiance', defaultPower: 150, icon: 'VolumeUp', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
      { name: 'POS + paiement', defaultPower: 50, icon: 'PointOfSale', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
      { name: 'Climatisation mobile', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
      { name: 'Écran marketing', defaultPower: 200, icon: 'DisplaySettings', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },

      // ── 3. Travail mobile & services professionnels ──
      { name: 'Ordinateurs portables (x3 moy.)', defaultPower: 180, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
      { name: 'Écrans externes', defaultPower: 90, icon: 'Monitor', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
      { name: 'Routeur 4G/5G', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
      { name: 'Imprimante compacte', defaultPower: 50, icon: 'Print', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
      { name: 'Éclairage LED', defaultPower: 80, icon: 'Light', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
      { name: 'Chargeurs divers', defaultPower: 60, icon: 'ChargingStation', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
      { name: 'Laptop pro', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
      { name: 'Écran externe', defaultPower: 40, icon: 'Monitor', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
      { name: 'Routeur internet', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
      { name: 'Smartphone / charge', defaultPower: 10, icon: 'Smartphone', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
      { name: 'Éclairage LED', defaultPower: 30, icon: 'Light', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
      { name: 'Laptop léger', defaultPower: 60, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
      { name: 'Tablette', defaultPower: 15, icon: 'Tablet', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
      { name: 'Smartphone', defaultPower: 10, icon: 'Smartphone', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
      { name: 'Routeur mobile', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
      { name: 'Batterie externe / charge', defaultPower: 20, icon: 'BatteryChargingFull', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
      { name: 'PC portable', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
      { name: 'Vidéoprojecteur', defaultPower: 250, icon: 'Projector', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
      { name: 'Écran portable', defaultPower: 60, icon: 'Monitor', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
      { name: 'Sonorisation portable', defaultPower: 80, icon: 'VolumeUp', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
      { name: 'Routeur 4G', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
      { name: 'Éclairage salle', defaultPower: 100, icon: 'Light', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
      { name: 'Station CAO (laptop puissant)', defaultPower: 120, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
      { name: 'Écran haute résolution', defaultPower: 60, icon: 'Monitor', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
      { name: 'Tablette graphique', defaultPower: 20, icon: 'Draw', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
      { name: 'Stockage SSD/NAS', defaultPower: 40, icon: 'Storage', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
      { name: 'Routeur internet', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
      { name: 'Stations de calcul', defaultPower: 150, icon: 'DesktopWindows', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
      { name: 'Écrans doubles', defaultPower: 80, icon: 'Monitor', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
      { name: 'Instruments de mesure', defaultPower: 30, icon: 'Straighten', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
      { name: 'Serveur portable', defaultPower: 80, icon: 'Storage', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
      { name: 'Routeur 4G', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
      { name: 'Station GNSS', defaultPower: 20, icon: 'Explore', category: CATEGORIES[2], subCategory: 'Géomètres' },
      { name: 'Ordinateur portable', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Géomètres' },
      { name: 'Scanner 3D terrain', defaultPower: 80, icon: 'ViewInAr', category: CATEGORIES[2], subCategory: 'Géomètres' },
      { name: 'Tablette terrain', defaultPower: 15, icon: 'Tablet', category: CATEGORIES[2], subCategory: 'Géomètres' },
      { name: 'Routeur mobile', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Géomètres' },

      // ── 4. BTP, maintenance & interventions techniques ──
      { name: 'Outillage électroportatif (moyenne)', defaultPower: 800, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
      { name: 'Compresseur portable', defaultPower: 1500, icon: 'Compress', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
      { name: 'Poste à souder inverter', defaultPower: 4000, icon: 'Bolt', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
      { name: 'Lampe chantier LED', defaultPower: 100, icon: 'Light', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
      { name: 'Chargeurs batteries', defaultPower: 200, icon: 'BatteryChargingFull', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
      { name: 'Outillage mixte (visseuse, meuleuse)', defaultPower: 600, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
      { name: 'Station diagnostic portable', defaultPower: 120, icon: 'Diagnostics', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
      { name: 'Fer à souder / électronique', defaultPower: 80, icon: 'Bolt', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
      { name: 'Éclairage atelier mobile', defaultPower: 150, icon: 'Light', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
      { name: 'PC portable diagnostic', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
      { name: 'Perforateur / perceuse', defaultPower: 1000, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
      { name: 'Meuleuse', defaultPower: 1200, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
      { name: 'Testeurs électriques', defaultPower: 30, icon: 'ElectricalServices', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
      { name: 'Aspirateur chantier', defaultPower: 1200, icon: 'CleaningServices', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
      { name: 'Éclairage chantier LED', defaultPower: 150, icon: 'Light', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
      { name: 'Outillage électroportatif', defaultPower: 800, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
      { name: 'Analyseur réseau solaire', defaultPower: 60, icon: 'SolarPower', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
      { name: 'PC portable terrain', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
      { name: 'Charge batteries outils', defaultPower: 300, icon: 'BatteryChargingFull', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
      { name: 'Éclairage chantier', defaultPower: 100, icon: 'Light', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
      { name: 'Soudeuse fibre optique', defaultPower: 60, icon: 'Cable', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
      { name: 'OTDR / analyse réseau', defaultPower: 40, icon: 'NetworkCheck', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
      { name: 'PC portable diagnostic', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
      { name: 'Routeur test / 4G', defaultPower: 10, icon: 'Router', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
      { name: 'Éclairage terrain', defaultPower: 100, icon: 'Light', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
      { name: 'Outillage chantier mixte', defaultPower: 1500, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
      { name: 'Compresseur', defaultPower: 2000, icon: 'Compress', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
      { name: 'Bétonnière électrique', defaultPower: 1000, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
      { name: 'Éclairage chantier', defaultPower: 300, icon: 'Light', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
      { name: "Groupes d'alimentation mobile", defaultPower: 2000, icon: 'Bolt', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
      { name: 'Réfrigérateur', defaultPower: 150, icon: 'Kitchen', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
      { name: 'Éclairage LED', defaultPower: 200, icon: 'Light', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
      { name: 'Climatisation mobile', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
      { name: 'Chauffe-eau', defaultPower: 2200, icon: 'HotTub', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
      { name: 'PC / administratif', defaultPower: 100, icon: 'DesktopWindows', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
      { name: 'Recharge outils', defaultPower: 300, icon: 'BatteryChargingFull', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },

      // ── 5. Agriculture & sites isolés ──
      { name: "Pompe d'arrosage mobile", defaultPower: 1000, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
      { name: 'Groupe de pression eau', defaultPower: 800, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
      { name: 'Chambre froide mobile', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
      { name: 'Éclairage LED exploitation', defaultPower: 100, icon: 'Light', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
      { name: 'Chargeurs / outils', defaultPower: 200, icon: 'BatteryChargingFull', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
      { name: 'Petit matériel électrique', defaultPower: 300, icon: 'ElectricalServices', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
      { name: 'Pompe immergée', defaultPower: 1500, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
      { name: 'Pompe de surface', defaultPower: 1000, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
      { name: "Système automatisé irrigation", defaultPower: 50, icon: 'SmartToy', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
      { name: 'Capteurs sol / météo', defaultPower: 20, icon: 'Cloud', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
      { name: 'Routeur IoT', defaultPower: 10, icon: 'Router', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
      { name: 'Batterie / contrôle', defaultPower: 100, icon: 'BatteryChargingFull', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
      { name: 'Réfrigérateur solaire', defaultPower: 120, icon: 'Kitchen', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
      { name: 'Congélateur', defaultPower: 150, icon: 'Kitchen', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
      { name: 'Éclairage LED habitation', defaultPower: 80, icon: 'Light', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
      { name: 'TV / divertissement', defaultPower: 100, icon: 'Tv', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
      { name: 'Pompe eau domestique', defaultPower: 600, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
      { name: 'Routeur internet satellite', defaultPower: 50, icon: 'Router', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
      { name: 'Recharge appareils', defaultPower: 200, icon: 'ChargingStation', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },

      // ── 6. Secours, humanitaire & sécurité ──
      { name: 'Ordinateurs portables', defaultPower: 120, icon: 'Laptop', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
      { name: 'Routeur satellite / 4G', defaultPower: 50, icon: 'Router', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
      { name: 'Stations de recharge', defaultPower: 200, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
      { name: 'Éclairage LED base', defaultPower: 150, icon: 'Light', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
      { name: 'Réfrigérateur médical', defaultPower: 200, icon: 'Kitchen', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
      { name: 'Charge dispositifs mobiles', defaultPower: 100, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
      { name: 'Communication satellite', defaultPower: 60, icon: 'Satellite', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
      { name: 'PC terrain', defaultPower: 100, icon: 'Laptop', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
      { name: 'Systèmes recharge mobile', defaultPower: 300, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
      { name: 'Éclairage mobile LED', defaultPower: 200, icon: 'Light', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
      { name: 'Réfrigération médicale', defaultPower: 200, icon: 'Kitchen', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
      { name: 'Pompe eau mobile', defaultPower: 600, icon: 'Waves', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
      { name: "Éclairage d'intervention", defaultPower: 300, icon: 'Light', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
      { name: 'Radios / communication', defaultPower: 30, icon: 'Radio', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
      { name: 'Chargeurs batteries', defaultPower: 200, icon: 'BatteryChargingFull', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
      { name: 'Défibrillateur / médical', defaultPower: 50, icon: 'MedicalServices', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
      { name: 'PC coordination', defaultPower: 100, icon: 'DesktopWindows', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
      { name: 'Centre de commandement mobile', defaultPower: 300, icon: 'SettingsRemote', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
      { name: 'Radios multi-fréquences', defaultPower: 40, icon: 'Radio', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
      { name: "Éclairage d'urgence", defaultPower: 500, icon: 'Light', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
      { name: 'Surveillance vidéo mobile', defaultPower: 200, icon: 'Videocam', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
      { name: 'Serveur de coordination', defaultPower: 150, icon: 'Storage', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
      { name: 'Recharge équipements', defaultPower: 300, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
      { name: 'Réfrigérateur vaccins', defaultPower: 200, icon: 'Kitchen', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
      { name: "Concentrateur d'oxygène", defaultPower: 350, icon: 'MedicalServices', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
      { name: 'Éclairage médical LED', defaultPower: 150, icon: 'Light', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
      { name: 'Autoclave portable', defaultPower: 2000, icon: 'MedicalServices', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
      { name: 'Moniteurs médicaux', defaultPower: 100, icon: 'MonitorHeart', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
      { name: 'PC médical', defaultPower: 100, icon: 'DesktopWindows', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
      { name: 'Caméras de surveillance', defaultPower: 10, icon: 'Videocam', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
      { name: 'Centre de contrôle mobile', defaultPower: 150, icon: 'SettingsRemote', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
      { name: 'Éclairage sécurité', defaultPower: 300, icon: 'Light', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
      { name: 'Radios sécurité', defaultPower: 30, icon: 'Radio', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
      { name: 'Écrans monitoring', defaultPower: 200, icon: 'Monitor', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
      { name: 'Recharge équipements', defaultPower: 200, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },

      // ── 7. Hospitality & hébergements off-grid ──
      { name: 'Climatisation / chauffage', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
      { name: 'Éclairage ambiance LED', defaultPower: 150, icon: 'Light', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
      { name: 'Réfrigération minibar', defaultPower: 120, icon: 'Kitchen', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
      { name: 'Chauffe-eau', defaultPower: 2200, icon: 'HotTub', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
      { name: 'TV / divertissement', defaultPower: 100, icon: 'Tv', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
      { name: 'Routeur internet', defaultPower: 10, icon: 'Router', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
      { name: 'Recharge appareils clients', defaultPower: 200, icon: 'ChargingStation', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
      { name: 'Chauffage mobile / clim', defaultPower: 1200, icon: 'AcUnit', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
      { name: 'Éclairage LED tente', defaultPower: 100, icon: 'Light', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
      { name: 'Réfrigérateur compact', defaultPower: 100, icon: 'Kitchen', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
      { name: 'Chauffe-eau instantané', defaultPower: 2000, icon: 'HotTub', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
      { name: 'Prises recharge clients', defaultPower: 150, icon: 'ChargingStation', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
      { name: 'WiFi / routeur', defaultPower: 10, icon: 'Router', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
      { name: 'Réfrigérateur solaire', defaultPower: 120, icon: 'Kitchen', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
      { name: 'Système solaire + onduleur (pertes)', defaultPower: 200, icon: 'SolarPower', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
      { name: 'Éclairage LED logement', defaultPower: 80, icon: 'Light', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
      { name: 'Chauffage / climatisation', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
      { name: 'Pompe eau autonome', defaultPower: 600, icon: 'Waves', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
      { name: 'Routeur satellite / 4G', defaultPower: 50, icon: 'Router', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
      { name: 'Recharge équipements', defaultPower: 150, icon: 'ChargingStation', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
    ];

    let inserted = 0;
    for (const item of equipmentData) {
      await pool.request()
        .input('Name', sql.NVarChar(255), item.name)
        .input('DefaultPower', sql.Int, item.defaultPower)
        .input('Icon', sql.NVarChar(100), item.icon)
        .input('Category', sql.NVarChar(255), item.category)
        .input('SubCategory', sql.NVarChar(255), item.subCategory)
        .query(`
          INSERT INTO EquipmentItems (Name, DefaultPower, Icon, Category, SubCategory)
          VALUES (@Name, @DefaultPower, @Icon, @Category, @SubCategory)
        `);
      inserted++;
    }

    res.json({ message: `${inserted} équipements ajoutés avec succès`, count: inserted });
  } catch (err) {
    console.error('Error seeding equipment:', err);
    res.status(500).json({ error: 'Erreur lors du seed des équipements' });
  }
});

// ─────────────────────────────────────────────────────────────
// Other Sales API
// ─────────────────────────────────────────────────────────────

// GET /api/other-sales — List all other sales
app.get('/api/other-sales', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Id, CustomerInfo, Products, OrderNumber, PaymentDate, CreatedAt
      FROM OtherSales
      ORDER BY CreatedAt DESC
    `);

    const sales = result.recordset.map((row) => {
      const customer = JSON.parse(row.CustomerInfo);
      const products = JSON.parse(row.Products);
      return {
        id: row.Id,
        customer,
        products,
        orderNumber: row.OrderNumber,
        paymentDate: row.PaymentDate,
        createdAt: row.CreatedAt,
      };
    });

    res.json(sales);
  } catch (err) {
    console.error('Error fetching other sales:', err);
    res.status(500).json({ error: 'Erreur lors du chargement des ventes' });
  }
});

// GET /api/other-sales/:id — Get a single other sale by ID
app.get('/api/other-sales/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .query(`
        SELECT Id, CustomerInfo, Products, OrderNumber, PaymentDate, CreatedAt
        FROM OtherSales
        WHERE Id = @Id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Vente non trouvée' });
    }

    const row = result.recordset[0];
    const sale = {
      id: row.Id,
      customer: JSON.parse(row.CustomerInfo),
      products: JSON.parse(row.Products),
      orderNumber: row.OrderNumber,
      paymentDate: row.PaymentDate,
      createdAt: row.CreatedAt,
    };

    res.json(sale);
  } catch (err) {
    console.error('Error fetching other sale:', err);
    res.status(500).json({ error: 'Erreur lors du chargement de la vente' });
  }
});

// POST /api/other-sales — Create a new other sale
app.post('/api/other-sales', async (req, res) => {
  try {
    const { customer, products, orderNumber, paymentDate } = req.body;

    if (!customer || !products || !products.length) {
      return res.status(400).json({ error: 'customer and products are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('CustomerInfo', sql.NVarChar(sql.MAX), JSON.stringify(customer))
      .input('Products', sql.NVarChar(sql.MAX), JSON.stringify(products))
      .input('OrderNumber', sql.NVarChar(50), orderNumber || null)
      .input('PaymentDate', sql.Date, paymentDate || null)
      .query(`
        INSERT INTO OtherSales (CustomerInfo, Products, OrderNumber, PaymentDate)
        OUTPUT INSERTED.Id, INSERTED.OrderNumber, INSERTED.PaymentDate
        VALUES (@CustomerInfo, @Products, @OrderNumber, @PaymentDate)
      `);

    const newId = result.recordset[0].Id;
    const savedOrderNumber = result.recordset[0].OrderNumber;
    const savedPaymentDate = result.recordset[0].PaymentDate;

    res.status(201).json({
      id: newId,
      orderNumber: savedOrderNumber,
      paymentDate: savedPaymentDate,
      message: 'Vente enregistrée avec succès',
    });
  } catch (err) {
    console.error('Error creating other sale:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la vente' });
  }
});

// Start server - listen on all network interfaces (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = require('os').networkInterfaces();
  console.log(`Solar Sales Pro Backend running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${require('os').hostname()}:${PORT}`);
  // Also print all available IPs
  Object.keys(networkInterfaces).forEach((name) => {
    networkInterfaces[name].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`           http://${iface.address}:${PORT}`);
      }
    });
  });
  console.log('');
  ensureTables();
});
