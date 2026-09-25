import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Grid, 
  Paper, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { CustomerInfo, Client, ColumnMapping } from '../types';
import { CUSTOMER_FIELDS } from '../constants/customerFields';
import * as XLSX from 'xlsx';
import { inferCustomerField, getCustomCustomerFields } from '../utils/customer';

interface CustomerFormProps {
  customer: CustomerInfo;
  setCustomer: (customer: CustomerInfo) => void;
  onNext: () => void;
  isAdmin?: boolean;
}

const API_URL = `http://${window.location.hostname}:5000/api`;

// Options du mapping Excel générées depuis le registre des champs client (extensible)
const FIELD_OPTIONS: { value: string; label: string }[] = [
  ...CUSTOMER_FIELDS.map((f) => ({ value: f.key, label: f.label })),
];

const IMPORT_BATCH_SIZE = 200;

interface ImportProgress {
  status: 'idle' | 'running' | 'complete' | 'error';
  total: number;
  processed: number;
  imported: number;
  updated: number;
  duplicates: number;
  currentBatch: number;
  totalBatches: number;
  startedAt: number | null;
}

const initialImportProgress: ImportProgress = {
  status: 'idle', total: 0, processed: 0, imported: 0, updated: 0, duplicates: 0,
  currentBatch: 0, totalBatches: 0, startedAt: null,
};

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, setCustomer, onNext, isAdmin }) => {
  // Client search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Excel import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [excelRows, setExcelRows] = useState<any[][]>([]);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress>(initialImportProgress);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [importedClients, setImportedClients] = useState<Client[]>([]);
  const [duplicateRows, setDuplicateRows] = useState<Array<{ sourceRow: number; name: string; reason: string }>>([]);

  useEffect(() => {
    if (importProgress.status !== 'running' || !importProgress.startedAt) return;
    const update = () => setElapsedSeconds(Math.floor((Date.now() - importProgress.startedAt!) / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [importProgress.status, importProgress.startedAt]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return minutes > 0 ? `${minutes} min ${remainder.toString().padStart(2, '0')} s` : `${remainder} s`;
  };

  const resetImport = () => {
    setImportDialogOpen(false);
    setImportResult(null);
    setExcelFile(null);
    setExcelRows([]);
    setPreviewRows([]);
    setImportedClients([]);
    setDuplicateRows([]);
    setImportProgress(initialImportProgress);
    setElapsedSeconds(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  // ---------- Client Search ----------
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/clients/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const readClientField = (client: any, key: string): string => {
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    const value = client[key] ?? client[pascal] ?? client[key.toLowerCase()] ?? '';
    return value === undefined ? '' : String(value).trim();
  };

  const handleSelectClient = (client: any) => {
    if (client) {
      // Ne jamais perdre les champs importés (CA, effectif, raison sociale, etc.).
      const customer: CustomerInfo = { ...client };
      CUSTOMER_FIELDS.forEach((f) => {
        customer[f.key] = readClientField(client, f.key);
      });
      setCustomer(customer);
      setSelectedClient({ id: client.Id || client.id, ...customer });
    }
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ---------- Excel Import ----------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setImportResult(null);
    setImportedClients([]);
    setDuplicateRows([]);
    setImportProgress(initialImportProgress);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '', raw: false });

      if (jsonData.length < 2) {
        setImportResult('Le fichier Excel doit contenir au moins 2 lignes (en-tête + données).');
        return;
      }

      const headers = jsonData[0].map((h: any, index: number) => String(h).trim() || `Colonne ${index + 1}`);
      const rows = jsonData.slice(1);

      setExcelColumns(headers);
      setExcelRows(rows);
      setPreviewRows(rows.slice(0, 20));
      setMappings(headers.map((h: string, i: number) => ({
        excelColumn: h,
        field: inferCustomerField(h, i),
      })));
      setImportDialogOpen(true);
    };
    reader.onerror = () => setImportResult('Impossible de lire ce fichier Excel. Vérifiez qu’il n’est pas endommagé.');
    reader.readAsArrayBuffer(file);

    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleMappingChange = (colIndex: number, field: ColumnMapping['field']) => {
    const updated = [...mappings];
    updated[colIndex] = { ...updated[colIndex], field };
    setMappings(updated);
  };

  const handleImport = async () => {
    if (!excelFile || excelRows.length === 0) return;
    const activeMappings = mappings
      .map((mapping, index) => ({ ...mapping, index, field: (mapping.field || '').trim() }))
      .filter((mapping) => mapping.field && mapping.field !== 'skip');
    const duplicateTargets = activeMappings.map((mapping) => mapping.field).filter((field, index, all) => all.indexOf(field) !== index);
    if (duplicateTargets.length) {
      setImportResult(`Mapping invalide : le champ « ${duplicateTargets[0]} » est utilisé par plusieurs colonnes.`);
      return;
    }

    const clients: Record<string, any>[] = [];
    excelRows.forEach((row, rowIndex) => {
      const client: Record<string, any> = { _fieldLabels: {}, _sourceRow: rowIndex + 2 };
      activeMappings.forEach((mapping) => {
        const value = row[mapping.index];
        client[mapping.field] = value === undefined || value === null ? '' : String(value).trim();
        // Le libellé cible est conservé : un champ personnalisé édité par
        // l'utilisateur doit ressortir exactement comme il a été écrit.
        client._fieldLabels[mapping.field] = CUSTOMER_FIELDS.find((field) => field.key === mapping.field)?.label || mapping.field;
      });
      const hasValue = activeMappings.some((mapping) => client[mapping.field] !== '');
      if (hasValue) clients.push(client);
    });

    if (clients.length === 0) {
      setImportResult('Aucune ligne non vide n’a été trouvée dans les colonnes sélectionnées.');
      return;
    }

    const totalBatches = Math.ceil(clients.length / IMPORT_BATCH_SIZE);
    const startedAt = Date.now();
    setImporting(true);
    setImportResult(null);
    setImportedClients([]);
    setDuplicateRows([]);
    setElapsedSeconds(0);
    setImportProgress({ status: 'running', total: clients.length, processed: 0, imported: 0, updated: 0, duplicates: 0, currentBatch: 1, totalBatches, startedAt });

    let imported = 0;
    let updated = 0;
    let duplicates = 0;
    let importId: string | null = null;
    const verified: Client[] = [];
    const skipped: Array<{ sourceRow: number; name: string; reason: string }> = [];
    try {
      const startResponse = await fetch(`${API_URL}/clients/import-start`, { method: 'POST', credentials: 'include' });
      const startResult = await startResponse.json().catch(() => ({}));
      if (!startResponse.ok || !startResult.importId) throw new Error(startResult.error || 'Impossible de préparer la session d’import');
      importId = startResult.importId;
      for (let start = 0, batchNumber = 1; start < clients.length; start += IMPORT_BATCH_SIZE, batchNumber++) {
        const batch = clients.slice(start, start + IMPORT_BATCH_SIZE);
        setImportProgress((previous) => ({ ...previous, currentBatch: batchNumber }));
        const response = await fetch(`${API_URL}/clients/import-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ clients: batch, importId }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(`${result.error || 'Erreur serveur'}${result.details ? ` : ${result.details}` : ''}`);
        imported += result.count || 0;
        updated += result.updatedCount || 0;
        duplicates += result.duplicateCount || 0;
        verified.push(...(result.inserted || []));
        skipped.push(...(result.duplicates || []));
        const processed = Math.min(start + batch.length, clients.length);
        setImportedClients([...verified]);
        setDuplicateRows([...skipped]);
        setImportProgress({ status: 'running', total: clients.length, processed, imported, updated, duplicates, currentBatch: batchNumber, totalBatches, startedAt });
      }
      const duration = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(duration);
      setImportProgress({ status: 'complete', total: clients.length, processed: clients.length, imported, updated, duplicates, currentBatch: totalBatches, totalBatches, startedAt });
      setImportResult(`${imported} nouveau(x) client(s) enregistré(s), ${updated} fiche(s) existante(s) enrichie(s), ${duplicates} doublon(s) ignoré(s).`);
      if (verified[0]) setCustomer({ ...verified[0] } as CustomerInfo);
    } catch (error: any) {
      console.error('Batch import error:', error);
      setImportProgress((previous) => ({ ...previous, status: 'error' }));
      setImportResult(`Import interrompu : ${error.message || 'erreur inconnue'}. ${imported} ligne(s) déjà enregistrée(s) restent conservées.`);
    } finally {
      if (importId) {
        fetch(`${API_URL}/clients/import-finish`, {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ importId }),
        }).catch(() => undefined);
      }
      setImporting(false);
    }
  };

  return (
    <>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom color="primary">
              Informations Client
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Saisissez les coordonnées du client ou importez depuis Excel.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {/* Import Excel Button - Admin only */}
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                component="label"
              >
                Importer Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </Button>
            )}
            {/* Search Client Button */}
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => setSearchOpen(true)}
            >
              Chercher Client
            </Button>
          </Stack>
        </Box>

        {selectedClient && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            action={
              <IconButton size="small" onClick={() => { setSelectedClient(null); setCustomer({ name: '', phone: '', city: '', notes: '' }); }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            Client chargé depuis la base de données : <strong>{selectedClient.name}</strong> — {selectedClient.phone}
          </Alert>
        )}

        <Box component="form" noValidate sx={{ mt: 1 }}>
          <Grid container spacing={3}>
            {CUSTOMER_FIELDS.map((f) => {
              const isMultiline = !!f.multiline;
              const sm = isMultiline || f.key === 'address' ? 12 : 6;
              return (
                <Grid size={{ xs: 12, sm }} key={f.key}>
                  <TextField
                    fullWidth
                    label={f.label}
                    name={f.key}
                    value={customer[f.key] ?? ''}
                    onChange={handleChange}
                    multiline={isMultiline}
                    rows={isMultiline ? (f.key === 'notes' ? 4 : 2) : undefined}
                    variant="outlined"
                  />
                </Grid>
              );
            })}
            {getCustomCustomerFields(customer).map((field) => (
              <Grid size={{ xs: 12, sm: 6 }} key={field.key}>
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.key}
                  value={customer[field.key] ?? ''}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={onNext}
            >
              Continuer vers la Calculatrice
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Search Client Dialog */}
      <Dialog open={searchOpen} onClose={() => { setSearchOpen(false); setSearchResults([]); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          Rechercher un client
          <IconButton onClick={() => { setSearchOpen(false); setSearchResults([]); }} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Rechercher par nom ou téléphone"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            placeholder="Tapez au moins 1 caractère..."
          />
          {searching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!searching && searchResults.length === 0 && searchQuery.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Aucun client trouvé
            </Typography>
          )}
          {searchResults.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Ville</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((client) => (
                    <TableRow key={(client as any).Id || client.id} hover>
                      <TableCell>{(client as any).Name || client.name}</TableCell>
                      <TableCell>{(client as any).Phone || client.phone}</TableCell>
                      <TableCell>{(client as any).City || client.city || '—'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="contained" onClick={() => handleSelectClient(client)}>
                          Sélectionner
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Excel Import Mapping Dialog */}
      <Dialog open={importDialogOpen} onClose={importing ? undefined : resetImport} maxWidth="lg" fullWidth>
        <DialogTitle>
          Importer les clients depuis Excel
          <IconButton disabled={importing} onClick={resetImport} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {importResult && (
            <Alert severity={importProgress.status === 'complete' ? 'success' : 'error'} sx={{ mt: 1, mb: 2 }}>
              {importResult}
            </Alert>
          )}

          {(importProgress.status === 'idle' || importProgress.status === 'error') && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choisissez un champ standard ou saisissez librement un champ métier. Les libellés et valeurs des colonnes personnalisées seront conservés. Cochez « Ignorer » uniquement si la colonne ne doit pas être enregistrée.
              </Typography>
              <TableContainer sx={{ maxHeight: 360, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Colonne Excel</TableCell>
                      <TableCell>Champ cible (standard ou personnalisé)</TableCell>
                      <TableCell align="center" width={110}>Ignorer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {excelColumns.map((col, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Chip label={col} variant="outlined" /></TableCell>
                        <TableCell>
                          <Autocomplete
                            freeSolo
                            size="small"
                            disabled={mappings[idx]?.field === 'skip'}
                            options={FIELD_OPTIONS.map((option) => option.value)}
                            inputValue={mappings[idx]?.field === 'skip' ? '' : (mappings[idx]?.field || '')}
                            onInputChange={(_event, value, reason) => {
                              if (reason === 'input' || reason === 'clear') handleMappingChange(idx, value);
                            }}
                            onChange={(_event, value) => handleMappingChange(idx, value || '')}
                            getOptionLabel={(option) => FIELD_OPTIONS.find((item) => item.value === option)?.label || option}
                            renderOption={(props, option) => (
                              <li {...props} key={option}>
                                <Box>
                                  <Typography variant="body2">{FIELD_OPTIONS.find((item) => item.value === option)?.label || option}</Typography>
                                  <Typography variant="caption" color="text.secondary">{option}</Typography>
                                </Box>
                              </li>
                            )}
                            renderInput={(params) => <TextField {...params} placeholder="Choisir ou saisir un champ" />}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <FormControlLabel
                            sx={{ m: 0 }}
                            control={<Checkbox checked={mappings[idx]?.field === 'skip'} onChange={(event) => handleMappingChange(idx, event.target.checked ? 'skip' : inferCustomerField(col, idx))} />}
                            label=""
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {previewRows.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Aperçu complet des colonnes</Typography>
                    <Typography variant="caption" color="text.secondary">{previewRows.length} première(s) ligne(s) sur {excelRows.length}</Typography>
                  </Box>
                  <TableContainer sx={{ maxHeight: 360, border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small" stickyHeader sx={{ minWidth: Math.max(700, excelColumns.length * 170) }}>
                      <TableHead>
                        <TableRow>{excelColumns.map((col, idx) => <TableCell key={idx} sx={{ minWidth: 170, fontWeight: 600 }}>{col}</TableCell>)}</TableRow>
                      </TableHead>
                      <TableBody>
                        {previewRows.map((row, ri) => (
                          <TableRow key={ri}>
                            {excelColumns.map((_, ci) => (
                              <TableCell key={ci} sx={{ whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>
                                {row[ci] === undefined || row[ci] === null ? '' : String(row[ci])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}

          {importProgress.status !== 'idle' && (
            <Paper variant="outlined" sx={{ p: 2.5, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {importProgress.status === 'running' ? 'Importation en cours' : importProgress.status === 'complete' ? 'Importation terminée' : 'Importation interrompue'}
                </Typography>
                <Typography variant="body2" color="text.secondary">Temps écoulé : {formatDuration(elapsedSeconds)}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={importProgress.total ? (importProgress.processed / importProgress.total) * 100 : 0}
                color={importProgress.status === 'error' ? 'error' : importProgress.status === 'complete' ? 'success' : 'primary'}
                sx={{ height: 10, borderRadius: 5, mb: 1.5 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2"><strong>{importProgress.processed} / {importProgress.total}</strong> lignes traitées</Typography>
                <Typography variant="body2">Lot {importProgress.currentBatch} / {importProgress.totalBatches}</Typography>
                <Typography variant="body2" color="success.main">{importProgress.imported} nouvelles</Typography>
                <Typography variant="body2" color="info.main">{importProgress.updated} fiches enrichies</Typography>
                <Typography variant="body2" color="warning.main">{importProgress.duplicates} doublons ignorés</Typography>
              </Box>
              {importProgress.status === 'running' && importProgress.processed > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Temps restant estimé : {formatDuration(Math.max(0, Math.round((elapsedSeconds / importProgress.processed) * (importProgress.total - importProgress.processed))))}
                </Typography>
              )}
            </Paper>
          )}

          {importProgress.status === 'complete' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Vérification des données enregistrées</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Ces lignes ont été retournées par SQL Server après insertion. {importedClients.length > 100 && `Les 100 premières sont affichées sur ${importedClients.length}.`}
              </Typography>
              <TableContainer sx={{ maxHeight: 380, border: '1px solid', borderColor: 'divider' }}>
                <Table size="small" stickyHeader sx={{ minWidth: Math.max(700, mappings.filter((mapping) => mapping.field !== 'skip').length * 160) }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID SQL</TableCell>
                      {mappings.filter((mapping) => mapping.field && mapping.field !== 'skip').map((mapping) => (
                        <TableCell key={mapping.field} sx={{ minWidth: 150 }}>{mapping.excelColumn}</TableCell>
                      ))}
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importedClients.slice(0, 100).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.id}</TableCell>
                        {mappings.filter((mapping) => mapping.field && mapping.field !== 'skip').map((mapping) => (
                          <TableCell key={mapping.field} sx={{ wordBreak: 'break-word' }}>{client[mapping.field] === '' || client[mapping.field] === undefined ? '—' : String(client[mapping.field])}</TableCell>
                        ))}
                        <TableCell><Chip label="Enregistré" color="success" size="small" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {duplicateRows.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {duplicateRows.length} doublon(s) non réinséré(s). Exemples : {duplicateRows.slice(0, 5).map((row) => `ligne ${row.sourceRow} (${row.name})`).join(', ')}.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {importProgress.status === 'complete' ? (
            <Button variant="contained" color="success" onClick={resetImport}>Terminer</Button>
          ) : (
            <>
              <Button disabled={importing} onClick={resetImport}>Annuler</Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={importing || !mappings.some((mapping) => mapping.field && mapping.field !== 'skip')}
                startIcon={importing ? <CircularProgress size={20} /> : undefined}
              >
                {importing ? `${importProgress.processed} / ${importProgress.total}` : importProgress.status === 'error' ? 'Réessayer' : 'Démarrer l’import'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerForm;
