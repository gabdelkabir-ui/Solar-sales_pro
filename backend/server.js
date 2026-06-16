const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

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
          CreatedAt DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Table Projects created successfully';
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
          PriceMad INT NULL,
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
    console.log('Tables "Projects", "Clients", "Products", and "EquipmentItems" are ready');
  } catch (err) {
    console.error('Error ensuring tables exist:', err);
  }
};

// POST /api/projects — Save a new project
app.post('/api/projects', async (req, res) => {
  try {
    const { customer, equipment, recommendation } = req.body;

    if (!customer || !equipment) {
      return res.status(400).json({ error: 'customer and equipment are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('CustomerInfo', sql.NVarChar(sql.MAX), JSON.stringify(customer))
      .input('Equipment', sql.NVarChar(sql.MAX), JSON.stringify(equipment))
      .input('Recommendation', sql.NVarChar(sql.MAX), JSON.stringify(recommendation || {}))
      .query(`
        INSERT INTO Projects (CustomerInfo, Equipment, Recommendation)
        OUTPUT INSERTED.Id
        VALUES (@CustomerInfo, @Equipment, @Recommendation)
      `);

    const newId = result.recordset[0].Id;
    res.status(201).json({ id: newId, message: 'Projet enregistré avec succès' });
  } catch (err) {
    console.error('Error saving project:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du projet' });
  }
});

// GET /api/projects — List all projects (summary)
app.get('/api/projects', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Id, CustomerInfo, CreatedAt
      FROM Projects
      ORDER BY CreatedAt DESC
    `);

    const projects = result.recordset.map((row) => {
      const customer = JSON.parse(row.CustomerInfo);
      return {
        id: row.Id,
        customer,
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
app.get('/api/projects/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .query(`
        SELECT Id, CustomerInfo, Equipment, Recommendation, CreatedAt
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
      createdAt: row.CreatedAt,
    };

    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Erreur lors du chargement du projet' });
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
        SELECT Id, Name, Phone, City, Notes
        FROM Clients
        WHERE Name LIKE @search OR REPLACE(Phone, ' ', '') LIKE @search
        ORDER BY Name ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error searching clients:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche des clients' });
  }
});

// POST /api/clients/import — Import clients from Excel data
app.post('/api/clients/import', async (req, res) => {
  try {
    const { clients } = req.body;
    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ error: 'Aucun client à importer' });
    }

    const pool = await poolPromise;
    let imported = 0;

    for (const client of clients) {
      if (!client.name || !client.phone) continue;
      // Normalize phone: strip spaces, dashes, dots
      const cleanPhone = client.phone.replace(/[\s\-\.\(\)]/g, '');
      await pool.request()
        .input('Name', sql.NVarChar(255), client.name)
        .input('Phone', sql.NVarChar(100), cleanPhone)
        .input('City', sql.NVarChar(255), client.city || '')
        .input('Notes', sql.NVarChar(sql.MAX), client.notes || '')
        .query(`
          INSERT INTO Clients (Name, Phone, City, Notes)
          VALUES (@Name, @Phone, @City, @Notes)
        `);
      imported++;
    }

    res.json({ message: `${imported} client(s) importé(s) avec succès`, count: imported });
  } catch (err) {
    console.error('Error importing clients:', err);
    res.status(500).json({ error: 'Erreur lors de l\'import des clients' });
  }
});

// DELETE /api/projects/:id — Delete a project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .query(`
        DELETE FROM Projects
        OUTPUT DELETED.Id
        WHERE Id = @Id
      `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    res.json({ message: 'Projet supprimé avec succès' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
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
app.post('/api/products', async (req, res) => {
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
      .input('PriceMad', sql.Int, priceMad || null)
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

// DELETE /api/products/:id — Delete a product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Id', sql.Int, parseInt(req.params.id))
      .query(`
        DELETE FROM Products
        WHERE Id = @Id;
        SELECT @@ROWCOUNT AS DeletedCount;
      `);

    if (!result.recordset || result.recordset.length === 0 || result.recordset[0].DeletedCount === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

// POST /api/products/seed — Seed initial products for recommendation engine
app.post('/api/products/seed', async (req, res) => {
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
        name: 'EcoFlow 110W Portable Solar Panel',
        slug: '110w-portable-solar-panel',
        category: 'panel',
        brand: 'EcoFlow',
        capacityWh: null,
        outputPowerW: 110,
        expandable: false,
        description: 'Foldable portable solar panel with high efficiency.',
        keyFeatures: JSON.stringify(['110W output', '23% conversion rate', 'IP68 waterproof', 'Foldable monobloc design']),
        priceMad: 1995,
        url: 'https://www.easypower.ma/en/shop/pso-000006-110w-portable-solar-panel-81',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow 160W Portable Solar Panel',
        slug: '160w-portable-solar-panel',
        category: 'panel',
        brand: 'EcoFlow',
        capacityWh: null,
        outputPowerW: 160,
        expandable: false,
        description: 'Lightweight foldable solar panel (7kg).',
        keyFeatures: JSON.stringify(['160W output', 'Portable and foldable', 'High efficiency']),
        priceMad: 3150,
        url: 'https://www.easypower.ma/en/shop/pso-000007-160w-portable-solar-panel-85',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow 400W Portable Solar Panel',
        slug: '400w-portable-solar-panel',
        category: 'panel',
        brand: 'EcoFlow',
        capacityWh: null,
        outputPowerW: 400,
        expandable: false,
        description: 'High-power foldable solar panel for home and off-grid use.',
        keyFeatures: JSON.stringify(['400W output', 'Highly efficient', 'Foldable design']),
        priceMad: 8000,
        url: 'https://www.easypower.ma/en/shop/pso-000008-400w-portable-solar-panel-87',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow 100W Rigid Solar Panel',
        slug: '100w-rigid-solar-panel',
        category: 'panel',
        brand: 'EcoFlow',
        capacityWh: null,
        outputPowerW: 100,
        expandable: false,
        description: 'All-black rigid solar panel for permanent installation.',
        keyFeatures: JSON.stringify(['100W output', '23% conversion rate', 'IP68 waterproof', '5-year warranty']),
        priceMad: 1029,
        url: 'https://www.easypower.ma/en/shop/pso-000009-100w-rigid-solar-panel-83',
        imageUrl: '',
        isActive: 1,
      },

      // ========== POWER STATIONS & BATTERIES (category: battery) ==========
      {
        name: 'EcoFlow DELTA Pro',
        slug: 'delta-pro',
        category: 'battery',
        brand: 'EcoFlow',
        capacityWh: 3600,
        outputPowerW: 3600,
        expandable: true,
        description: 'Portable home battery with up to 25 kWh expandable capacity. Integrates with Smart Home Panel.',
        keyFeatures: JSON.stringify(['3600W output (4500W with X-Boost)', 'Expandable to 25 kWh', 'Fastest charging in the world', 'EV charging compatible', 'Smart Home Panel integration']),
        priceMad: 37800,
        url: 'https://www.easypower.ma/en/shop/sel-000011-delta-pro-int-75',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow DELTA 2',
        slug: 'delta-2',
        category: 'battery',
        brand: 'EcoFlow',
        capacityWh: 1024,
        outputPowerW: 1800,
        expandable: true,
        description: 'Expandable portable power station from 1 kWh to 3 kWh.',
        keyFeatures: JSON.stringify(['1 kWh base capacity', 'Expandable to 3 kWh', '1800W output', 'Fast AC charging', 'App control']),
        priceMad: 10500,
        url: 'https://www.easypower.ma/en/shop/category/power-stations-ecoflow-ecoflow-delta-88',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow DELTA 2 Max',
        slug: 'delta-2-max',
        category: 'battery',
        brand: 'EcoFlow',
        capacityWh: 2048,
        outputPowerW: 2400,
        expandable: true,
        description: 'Expandable from 2 kWh to 6 kWh. Ideal for home backup and outdoor use.',
        keyFeatures: JSON.stringify(['2 kWh base capacity', 'Expandable to 6 kWh', '2400W output', 'Fast solar charging', 'App control']),
        priceMad: 17010,
        url: 'https://www.easypower.ma/en/shop/sel-000010-delta-2-max-100',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow RIVER 2',
        slug: 'river-2',
        category: 'battery',
        brand: 'EcoFlow',
        capacityWh: 256,
        outputPowerW: 300,
        expandable: false,
        description: 'Compact and lightweight portable power station.',
        keyFeatures: JSON.stringify(['256Wh capacity', '300W output', 'Fast charging', 'Lightweight design']),
        priceMad: null,
        url: 'https://www.easypower.ma/en/shop',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow RIVER 2 Max',
        slug: 'river-2-max',
        category: 'battery',
        brand: 'EcoFlow',
        capacityWh: 512,
        outputPowerW: 500,
        expandable: false,
        description: 'Mid-size portable power station with good capacity.',
        keyFeatures: JSON.stringify(['512Wh capacity', '500W output', 'Fast charging', 'Portable design']),
        priceMad: null,
        url: 'https://www.easypower.ma/en/shop',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow RIVER 2 Pro',
        slug: 'river-2-pro',
        category: 'battery',
        brand: 'EcoFlow',
        capacityWh: 768,
        outputPowerW: 800,
        expandable: false,
        description: 'High-performance portable power station.',
        keyFeatures: JSON.stringify(['768Wh capacity', '800W output', 'Fast charging', 'Multiple ports']),
        priceMad: null,
        url: 'https://www.easypower.ma/en/shop',
        imageUrl: '',
        isActive: 1,
      },

      // ========== BATTERY EXTENSIONS (category: battery) ==========
      {
        name: 'EcoFlow DELTA Pro Battery Extension',
        slug: 'delta-pro-battery-extension',
        category: 'battery',
        brand: 'EcoFlow',
        capacityWh: 3600,
        outputPowerW: null,
        expandable: false,
        description: 'Extra battery for DELTA Pro (expands capacity significantly).',
        keyFeatures: JSON.stringify(['3600Wh additional capacity', 'Seamless integration', 'LFP battery']),
        priceMad: 25000,
        url: 'https://www.easypower.ma/en/shop/bex-000005-delta-pro-battery-extension-74',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow DELTA 2 Battery Extension',
        slug: 'delta-2-battery-extension',
        category: 'battery',
        brand: 'EcoFlow',
        capacityWh: 1024,
        outputPowerW: null,
        expandable: false,
        description: 'Extra battery for DELTA 2 series.',
        keyFeatures: JSON.stringify(['1024Wh additional capacity', 'Easy plug-in', 'Storage compartment']),
        priceMad: 6900,
        url: 'https://www.easypower.ma/en/shop/bex-000004-delta-2-battery-extension-72',
        imageUrl: '',
        isActive: 1,
      },

      // ========== INVERTERS (category: inverter) ==========
      // Using high-output power stations as inverters for the recommendation engine
      {
        name: 'EcoFlow DELTA Pro (Inverter 3600W)',
        slug: 'delta-pro-inverter',
        category: 'inverter',
        brand: 'EcoFlow',
        capacityWh: null,
        outputPowerW: 3600,
        expandable: false,
        description: 'Powerful inverter from DELTA Pro, 3600W continuous output (4500W with X-Boost).',
        keyFeatures: JSON.stringify(['3600W continuous output', '4500W with X-Boost', 'Pure sine wave', 'EV charging compatible']),
        priceMad: null,
        url: 'https://www.easypower.ma/en/shop/sel-000011-delta-pro-int-75',
        imageUrl: '',
        isActive: 1,
      },
      {
        name: 'EcoFlow Smart Home Panel',
        slug: 'smart-home-panel-inverter',
        category: 'inverter',
        brand: 'EcoFlow',
        capacityWh: null,
        outputPowerW: 5000,
        expandable: false,
        description: 'Whole-home backup integration panel for DELTA Pro. Automatic backup power.',
        keyFeatures: JSON.stringify(['Whole-home integration', 'Automatic backup', 'Compatible with DELTA Pro']),
        priceMad: 25829,
        url: 'https://www.easypower.ma/en/shop/5004601008-smart-home-panel-76',
        imageUrl: '',
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
        .input('PriceMad', sql.Int, p.priceMad)
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
app.post('/api/equipment', async (req, res) => {
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
app.put('/api/equipment/:id', async (req, res) => {
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

// DELETE /api/equipment/:id — Soft-delete an equipment item
app.delete('/api/equipment/:id', async (req, res) => {
  try {
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
      .query(`
        UPDATE EquipmentItems SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE Id = @Id
      `);

    res.json({ message: 'Équipement supprimé avec succès' });
  } catch (err) {
    console.error('Error deleting equipment:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'équipement' });
  }
});

// POST /api/equipment/seed — Seed initial equipment catalog from static data
app.post('/api/equipment/seed', async (req, res) => {
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
