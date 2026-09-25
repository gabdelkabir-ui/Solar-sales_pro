import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import InventoryIcon from '@mui/icons-material/Inventory';
import { Equipment } from '../types';
import { fetchEquipment, seedEquipment, createEquipment, updateEquipment } from '../utils/equipmentApi';
import { getEquipmentIcon } from '../utils/equipmentIcons';

const CATEGORIES = [
  '1. Création de contenu & médias terrain',
  '2. Événementiel & commerce mobile',
  '3. Travail mobile & services professionnels',
  '4. BTP, maintenance & interventions techniques',
  '5. Agriculture & sites isolés',
  '6. Secours, humanitaire & sécurité',
  '7. Hospitality & hébergements off-grid',
] as const;

interface FormData {
  name: string;
  defaultPower: string;
  icon: string;
  category: string;
  subCategory: string;
}

// Extended type for equipment from DB (with numeric id)
interface EquipmentItem extends Omit<Equipment, 'id'> {
  id: number;
}

const emptyForm: FormData = {
  name: '',
  defaultPower: '',
  icon: 'Videocam',
  category: CATEGORIES[0],
  subCategory: 'Photographes professionnels terrain (74.20Z)',
};

const ICON_OPTIONS = [
  'Videocam', 'Monitor', 'FiberManualRecord', 'Laptop', 'Storage', 'Router', 'Light', 'BatteryChargingFull',
  'CameraAlt', 'Camera', 'Print', 'Flight', 'Tablet', 'Explore', 'Tune', 'VolumeUp', 'Mic',
  'DesktopWindows', 'Draw', 'LinearScale', 'Construction', 'Compress', 'Bolt', 'Cable', 'NetworkCheck',
  'ElectricalServices', 'SolarPower', 'AcUnit', 'Kitchen', 'Cooktop', 'Air', 'CoffeeMaker',
  'Waves', 'PointOfSale', 'CreditCard', 'TouchApp', 'DisplaySettings', 'SmartToy', 'Cloud',
  'Tv', 'Satellite', 'Radio', 'MedicalServices', 'SettingsRemote', 'MonitorHeart', 'HotTub',
  'ChargingStation', 'Smartphone', 'Projector', 'Straighten', 'ViewInAr', 'CleaningServices',
  'Diagnostics', 'Explore',
];

const EquipmentManager: React.FC = () => {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    const data = await fetchEquipment();
    // Map DB items to our type - DB returns numeric ids
    setItems(data as unknown as EquipmentItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSeed = async () => {
    setSeeding(true);
    const ok = await seedEquipment();
    if (ok) {
      setSnackbar({ open: true, message: 'Équipements de démonstration ajoutés avec succès !', severity: 'success' });
      loadItems();
    } else {
      setSnackbar({ open: true, message: 'Erreur lors de l\'ajout des équipements', severity: 'error' });
    }
    setSeeding(false);
  };

  const handleEdit = (item: EquipmentItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      defaultPower: String(item.defaultPower),
      icon: item.icon,
      category: item.category,
      subCategory: item.subCategory,
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.defaultPower || !form.subCategory) {
      setSnackbar({ open: true, message: 'Nom, puissance et sous-catégorie sont requis', severity: 'error' });
      return;
    }

    const payload = {
      name: form.name,
      defaultPower: parseInt(form.defaultPower) || 0,
      icon: form.icon,
      category: form.category,
      subCategory: form.subCategory,
    };

    let ok: boolean;
    if (editingId !== null) {
      ok = await updateEquipment(editingId, payload);
    } else {
      const result = await createEquipment(payload);
      ok = result !== null;
    }

    if (ok) {
      setSnackbar({ open: true, message: editingId ? 'Équipement mis à jour avec succès' : 'Équipement créé avec succès', severity: 'success' });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      loadItems();
    } else {
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement', severity: 'error' });
    }
  };

  const getShortCategory = (cat: string) => {
    return cat.replace(/^\d+\.\s*/, '').split('&')[0].trim();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" color="primary">
          <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestion des équipements
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadItems}
            disabled={loading}
          >
            Actualiser
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={seeding ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleSeed}
            disabled={seeding}
          >
            Ajouter équipements démo
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Nouvel équipement
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <InventoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun équipement dans le catalogue
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Cliquez sur "Ajouter équipements démo" pour charger les équipements par défaut ou "Nouvel équipement" pour en créer un.
          </Typography>
          <Button variant="contained" onClick={handleSeed} disabled={seeding}>
            Ajouter équipements démo
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell width={40}><strong>Icône</strong></TableCell>
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell align="center"><strong>Puissance (W)</strong></TableCell>
                <TableCell><strong>Catégorie</strong></TableCell>
                <TableCell><strong>Sous-catégorie</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    {getEquipmentIcon(item.icon, 20)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${item.defaultPower} W`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {getShortCategory(item.category)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {item.subCategory}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="Modifier">
                        <IconButton size="small" color="primary" onClick={() => handleEdit(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Equipment Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Modifier l\'équipement' : 'Nouvel équipement'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Nom de l'équipement"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                size="small"
              />
              <TextField
                label="Puissance par défaut (W)"
                required
                type="number"
                value={form.defaultPower}
                onChange={(e) => setForm({ ...form, defaultPower: e.target.value })}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <FormControl size="small">
                <InputLabel>Icône</InputLabel>
                <Select
                  value={form.icon}
                  label="Icône"
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  renderValue={(value) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getEquipmentIcon(value, 18)}
                      <span>{value}</span>
                    </Box>
                  )}
                >
                  {ICON_OPTIONS.map((icon) => (
                    <MenuItem key={icon} value={icon}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getEquipmentIcon(icon, 18)}
                        <span>{icon}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Catégorie personnalisable"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                helperText="Vous pouvez saisir une nouvelle catégorie."
                size="small"
              />
              <TextField
                label="Sous-catégorie personnalisable"
                required
                value={form.subCategory}
                onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                helperText="Ex. Photographie, BTP, Agriculture…"
                size="small"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); }}>Annuler</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingId ? 'Mettre à jour' : 'Créer l\'équipement'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EquipmentManager;
