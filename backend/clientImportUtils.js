function normalizeImportValue(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeComparableValue(key, value) {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  if (!text) return '';
  if (key === 'phone') return text.replace(/\D/g, '');
  return normalizeImportValue(text).replace(/\s+/g, ' ');
}

function identityValue(value) {
  return normalizeImportValue(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Identifiants métier indépendants des colonnes facultatives importées.
 * Une ligne enrichie avec une nouvelle colonne reste donc le même client.
 */
function clientIdentityCandidates(client) {
  const name = identityValue(client.name || client.raisonSociale);
  const email = identityValue(client.email);
  const phone = String(client.phone || '').replace(/\D/g, '');
  const city = identityValue(client.city);
  const address = identityValue(client.address);
  const candidates = [];
  if (email) candidates.push(`email:${email}`);
  if (name && email) candidates.push(`name-email:${name}|${email}`);
  if (name && phone) candidates.push(`name-phone:${name}|${phone}`);
  if (name && address) candidates.push(`name-address:${name}|${address}`);
  if (name && city) candidates.push(`name-city:${name}|${city}`);
  if (name) candidates.push(`name:${name}`);
  return candidates;
}

function clientDuplicateKey(client) {
  // Un doublon signifie ici la même ligne métier, pas seulement le même nom,
  // téléphone ou email. Plusieurs sociétés peuvent partager un standard
  // téléphonique et des noms proches doivent rester distincts.
  const comparable = Object.entries(client)
    .filter(([key, value]) => {
      if (key.startsWith('_')) return false;
      if (key === 'name' && /^client importe ligne/i.test(normalizeImportValue(value))) return false;
      return value !== '' && value !== null && value !== undefined;
    })
    .map(([key, value]) => [key, normalizeComparableValue(key, value)])
    .filter(([, value]) => value !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return comparable.length ? `data:${JSON.stringify(comparable)}` : '';
}

module.exports = { normalizeImportValue, normalizeComparableValue, clientDuplicateKey, clientIdentityCandidates };
