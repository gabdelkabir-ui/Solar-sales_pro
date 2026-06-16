const { execSync } = require('child_process');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'SolarPro_db';
const INSTANCE_NAME = process.env.LOCALDB_INSTANCE || 'mssqllocaldb';

// Ensure LocalDB instance is running
function ensureLocalDbRunning() {
  try { execSync(`sqllocaldb create ${INSTANCE_NAME} 2>nul`, { encoding: 'utf8' }); } catch {}
  try { execSync(`sqllocaldb start ${INSTANCE_NAME}`, { encoding: 'utf8' }); } catch {}
}

console.log(`======================================`);
console.log(`  Solar Sales Pro Backend`);
console.log(`======================================`);
console.log(``);

ensureLocalDbRunning();

console.log(`LocalDB instance: ${INSTANCE_NAME}`);
console.log(`Target database: ${DB_NAME}`);
console.log(``);
console.log(`Connect via SQL Server Management Studio:`);
console.log(`  Server: (localdb)\\${INSTANCE_NAME}`);
console.log(`  Authentication: Windows Authentication`);
console.log(``);

console.log(`Establishing connection...`);

// Use msnodesqlv8 directly with explicit ODBC driver
const msnodesql = require('msnodesqlv8');

function createConnection() {
  return new Promise((resolve, reject) => {
    const connStr = `Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\${INSTANCE_NAME};Database=${DB_NAME};Trusted_Connection=Yes;`;
    msnodesql.open({ conn_str: connStr }, function(err, connection) {
      if (err) {
        return reject(new Error(err.message));
      }
      console.log('✓ Connected to SQL Server (LocalDB) successfully!');
      resolve(connection);
    });
  });
}

// Wrapper to match the mssql request API expected by server.js
class RequestWrapper {
  constructor(connection) {
    this._connection = connection;
    this._queryText = '';
    this._inputs = [];
  }

  input(name, type, value) {
    this._inputs.push({ name, value });
    return this;
  }

  query(text) {
    this._queryText = text;
    return this._execute();
  }

  _execute() {
    const self = this;
    return new Promise(function(resolve, reject) {
      let queryText = self._queryText;

      // Replace @param placeholders with actual values (replace ALL occurrences)
      self._inputs.forEach(function(input) {
        const val = typeof input.value === 'string' ? "'" + input.value.replace(/'/g, "''") + "'" : input.value;
        const re = new RegExp('@' + input.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        queryText = queryText.replace(re, val);
      });

      self._connection.query(queryText, function(err, rows) {
        if (err) return reject(err);
        resolve({
          recordset: rows || [],
          rowsAffected: [rows ? rows.length : 0]
        });
      });
    });
  }
}

let _connection = null;

const poolPromise = createConnection().then(function(connection) {
  _connection = connection;
  return {
    request: function() {
      return new RequestWrapper(_connection);
    }
  };
}).catch(function(err) {
  console.error('✗ Database connection failed:', err.message);
  console.error('');
  console.error('Steps to fix:');
  console.error('1. Ensure LocalDB is running: sqllocaldb start mssqllocaldb');
  console.error('2. Ensure the database exists: sqlcmd -S "(localdb)\\mssqllocaldb" -i script.sql');
  console.error('3. Make sure ODBC Driver 17 for SQL Server is installed');
  console.error('');
  process.exit(1);
});

// Types to match mssql API
const sql = {
  NVarChar: function() { return {}; },
  Int: {},
  MAX: 'MAX'
};

module.exports = { sql, poolPromise };