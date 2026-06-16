import React, { useState, useCallback } from 'react';
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
  FormControl,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { CustomerInfo, Client, ColumnMapping } from '../types';
import * as XLSX from 'xlsx';

interface CustomerFormProps {
  customer: CustomerInfo;
  setCustomer: (customer: CustomerInfo) => void;
  onNext: () => void;
  isAdmin?: boolean;
}

const API_URL = `http://${window.location.hostname}:5000/api`;

const FIELD_OPTIONS: { value: ColumnMapping['field']; label: string }[] = [
  { value: 'name', label: 'Nom' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'city', label: 'Ville' },
  { value: 'notes', label: 'Notes' },
  { value: 'skip', label: 'Ignorer' },
];

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
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);

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

  const handleSelectClient = (client: any) => {
    if (client) {
      const name = client.Name || client.name;
      const phone = client.Phone || client.phone;
      const city = client.City || client.city || '';
      const notes = client.Notes || client.notes || '';
      setCustomer({ name, phone, city, notes });
      setSelectedClient({ id: client.Id || client.id, name, phone, city, notes });
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

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        setImportResult('Le fichier Excel doit contenir au moins 2 lignes (en-tête + données).');
        return;
      }

      const headers = jsonData[0].map((h: any) => String(h).trim());
      const rows = jsonData.slice(1, 6); // preview first 5 data rows

      setExcelColumns(headers);
      setPreviewRows(rows);
      setMappings(
        headers.map((h: string) => ({
          excelColumn: h,
          field: 'skip' as ColumnMapping['field'],
        }))
      );
      setImportDialogOpen(true);
    };
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
    if (!excelFile) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      // Build field index mapping
      const fieldIdx: Record<string, number> = {};
      mappings.forEach((m, idx) => {
        if (m.field !== 'skip') {
          fieldIdx[m.field] = idx;
        }
      });

      // Parse all data rows (skip header at row 0)
      const clients: { name: string; phone: string; city: string; notes: string }[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        const name = row[fieldIdx['name']]?.toString().trim() || '';
        const phone = row[fieldIdx['phone']]?.toString().trim() || '';
        if (!name || !phone) continue;
        clients.push({
          name,
          phone,
          city: fieldIdx['city'] !== undefined ? row[fieldIdx['city']]?.toString().trim() || '' : '',
          notes: fieldIdx['notes'] !== undefined ? row[fieldIdx['notes']]?.toString().trim() || '' : '',
        });
      }

      if (clients.length === 0) {
        setImportResult('Aucun client valide trouvé (nom + téléphone requis).');
        setImporting(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/clients/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clients }),
        });
        const result = await res.json();
        if (res.ok) {
          setImportResult(`${result.count} client(s) importé(s) avec succès !`);
          // Close dialog after short delay
          setTimeout(() => {
            setImportDialogOpen(false);
            setImportResult(null);
            setExcelFile(null);
            // Auto-fill first client
            if (clients.length > 0) {
              setCustomer({
                name: clients[0].name,
                phone: clients[0].phone,
                city: clients[0].city || '',
                notes: clients[0].notes || '',
              });
            }
          }, 1500);
        } else {
          setImportResult('Erreur lors de l\'import: ' + (result.error || 'inconnue'));
        }
      } catch (err) {
        console.error('Import error:', err);
        setImportResult('Erreur de connexion au serveur.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(excelFile);
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                label="Nom du client"
                name="name"
                value={customer.name}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                label="Numéro de téléphone"
                name="phone"
                value={customer.phone}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                label="Ville / Localisation"
                name="city"
                value={customer.city}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={customer.notes}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={onNext}
              disabled={!customer.name || !customer.phone}
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
      <Dialog open={importDialogOpen} onClose={() => { setImportDialogOpen(false); setImportResult(null); }} maxWidth="md" fullWidth>
        <DialogTitle>
          Mapper les colonnes Excel
          <IconButton onClick={() => { setImportDialogOpen(false); setImportResult(null); }} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {importResult ? (
            <Alert severity={importResult.includes('succès') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {importResult}
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Associez chaque colonne Excel au champ correspondant dans la base de données.
                Les colonnes marquées "Ignorer" ne seront pas importées.
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Colonne Excel</TableCell>
                      <TableCell>Champ base de données</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {excelColumns.map((col, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Chip label={col} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={mappings[idx]?.field || 'skip'}
                              onChange={(e) => handleMappingChange(idx, e.target.value as ColumnMapping['field'])}
                            >
                              {FIELD_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {previewRows.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Aperçu des données</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {excelColumns.map((col, idx) => (
                            <TableCell key={idx}>{col}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewRows.map((row, ri) => (
                          <TableRow key={ri}>
                            {excelColumns.map((_, ci) => (
                              <TableCell key={ci}>{row[ci]?.toString() || ''}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImportDialogOpen(false); setImportResult(null); }}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={importing || !mappings.some((m) => m.field === 'name') || !!importResult}
            startIcon={importing ? <CircularProgress size={20} /> : undefined}
          >
            {importing ? 'Importation...' : 'Importer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerForm;