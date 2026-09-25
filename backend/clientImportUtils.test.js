const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeImportValue, clientDuplicateKey, clientIdentityCandidates } = require('./clientImportUtils');

test('normalise accents, espaces et casse', () => {
  assert.equal(normalizeImportValue('  Société Énergie  '), 'societe energie');
});

test('détecte deux lignes strictement identiques malgré le format du téléphone', () => {
  assert.equal(
    clientDuplicateKey({ name: 'Energies Plus', phone: '06 12-34-56-78', city: 'Riom' }),
    clientDuplicateKey({ name: ' ENERGIES PLUS ', phone: '0612345678', city: 'RIOM' }),
  );
});

test('ne confond pas des sociétés différentes', () => {
  assert.notEqual(
    clientDuplicateKey({ name: 'ENERGIES PLUS', phone: '0612345678', city: 'Riom', chiffreAffaires: '25 M' }),
    clientDuplicateKey({ name: 'ECO ENERGIES', phone: '0612345678', city: 'Riom', chiffreAffaires: '25 M' }),
  );
  assert.notEqual(
    clientDuplicateKey({ name: 'SYS CLIM', phone: '0612345678' }),
    clientDuplicateKey({ name: '2H ECO ENERGIE', phone: '0612345678' }),
  );
});

test('les métadonnées internes ne participent pas à la clé de données', () => {
  assert.equal(
    clientDuplicateKey({ name: 'Client importé ligne 2', chiffreAffaires: '25 M', _sourceRow: 2 }),
    clientDuplicateKey({ name: 'Client importé ligne 3', chiffreAffaires: '25 M', _sourceRow: 3 }),
  );
});

test('l’identité ne dépend pas des colonnes facultatives', () => {
  const first = clientIdentityCandidates({ name: 'HAIER FRANCE', email: 'france@haiereurope.com', chiffreAffaires: '275 M' });
  const second = clientIdentityCandidates({ name: 'HAIER FRANCE', email: 'france@haiereurope.com', effectif: '100 - 199' });
  assert.equal(first[0], second[0]);
});
