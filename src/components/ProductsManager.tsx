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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import InventoryIcon from '@mui/icons-material/Inventory';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Product } from '../types';
import { fetchProducts, seedProducts, resolveProductImageUrl } from '../utils/productsApi';

const API_BASE = `http://${window.location.hostname}:5000/api`;

const CATEGORY_LABELS: Record<string, string> = {
  power_station: 'Stations électriques',
  panel: 'Panneaux solaires',
  battery: 'Batteries',
  accessory: 'Accessoires',
  solar_kit: 'Kit solaire',
  energy_kit_component: 'Composants Kits énergie',
  air_conditioning: 'Climatisation',
  portable_fridge: 'Réfrigérateurs portables / Glacières électriques',
  inverter: 'Onduleur',
  other: 'Autre',
};

const CATEGORY_COLORS: Record<string, string> = {
  power_station: '#1565c0',
  panel: '#1976d2',
  battery: '#2e7d32',
  accessory: '#6a1b9a',
  solar_kit: '#ef6c00',
  energy_kit_component: '#00838f',
  air_conditioning: '#0277bd',
  portable_fridge: '#455a64',
  inverter: '#f57c00',
  other: '#9c27b0',
};

const CATEGORY_OPTIONS = [
  { value: 'power_station', label: 'Stations électriques' },
  { value: 'panel', label: 'Panneaux solaires' },
  { value: 'battery', label: 'Batteries' },
  { value: 'accessory', label: 'Accessoires' },
  { value: 'solar_kit', label: 'Kit solaire' },
  { value: 'energy_kit_component', label: 'Composants Kits énergie' },
  { value: 'air_conditioning', label: 'Climatisation' },
  { value: 'portable_fridge', label: 'Réfrigérateurs portables / Glacières électriques' },
  // Compatibilité avec les anciennes lignes du catalogue.
  { value: 'inverter', label: 'Onduleur (ancien catalogue)' },
  { value: 'other', label: 'Autre (ancien catalogue)' },
];

interface FormData {
  name: string;
  slug: string;
  category: string;
  brand: string;
  outputPowerW: string;
  capacityWh: string;
  priceMad: string;
  expandable: boolean;
  description: string;
  keyFeatures: string;
}

const emptyForm: FormData = {
  name: '',
  slug: '',
  category: 'panel',
  brand: 'EcoFlow',
  outputPowerW: '',
  capacityWh: '',
  priceMad: '',
  expandable: false,
  description: '',
  keyFeatures: '',
};

const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSeed = async () => {
    setSeeding(true);
    const ok = await seedProducts();
    if (ok) {
      setSnackbar({ open: true, message: 'Produits de démonstration ajoutés avec succès !', severity: 'success' });
      loadProducts();
    } else {
      setSnackbar({ open: true, message: 'Erreur lors de l\'ajout des produits', severity: 'error' });
    }
    setSeeding(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      setSnackbar({ open: true, message: 'Nom et slug sont requis', severity: 'error' });
      return;
    }
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        brand: form.brand,
        expandable: form.expandable,
        description: form.description || null,
        keyFeatures: form.keyFeatures ? form.keyFeatures.split('\n').filter(Boolean) : null,
         priceMad: form.priceMad ? parseFloat(form.priceMad) : null,
        url: '',
      };
      if (form.outputPowerW) body.outputPowerW = parseInt(form.outputPowerW);
      if (form.capacityWh) body.capacityWh = parseInt(form.capacityWh);

      const res = await fetch(`${API_BASE}/products${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
       if (!res.ok) {
        const errData = await res.json();
         throw new Error(errData.error || 'Create failed');
       }
       const savedProduct = await res.json();
       const productId = editingId || savedProduct.id;
       if (imageFile && productId) {
         const imageData = new FormData();
         imageData.append('image', imageFile);
         const imageResponse = await fetch(`${API_BASE}/products/${productId}/image`, {
           method: 'POST', credentials: 'include', body: imageData,
         });
         const imageResult = await imageResponse.json().catch(() => ({}));
         if (!imageResponse.ok) throw new Error(imageResult.error || 'Produit enregistré, mais l’image n’a pas pu être envoyée');
       }
       setSnackbar({ open: true, message: editingId ? 'Produit et image modifiés avec succès' : 'Produit et image créés avec succès', severity: 'success' });
        setDialogOpen(false);
        setForm(emptyForm);
        setEditingId(null);
       setImageFile(null);
       setImagePreview(null);
        loadProducts();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Erreur lors de la création', severity: 'error' });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name, slug: product.slug, category: product.category, brand: product.brand || 'EcoFlow',
      outputPowerW: product.outputPowerW?.toString() || '', capacityWh: product.capacityWh?.toString() || '',
      priceMad: product.priceMad?.toString() || '', expandable: product.expandable,
      description: product.description || '', keyFeatures: product.keyFeatures?.join('\n') || '',
     });
    setImageFile(null);
    setImagePreview(resolveProductImageUrl(product.imageUrl));
     setDialogOpen(true);
   };

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDeleteImage = async () => {
    if (!editingId) return;
    const res = await fetch(`${API_BASE}/products/${editingId}/image`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSnackbar({ open: true, message: data.error || 'Erreur lors de la suppression de l’image', severity: 'error' });
      return;
    }
    setImageFile(null);
    setImagePreview(null);
    setSnackbar({ open: true, message: 'Image supprimée avec succès', severity: 'success' });
    loadProducts();
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Supprimer définitivement « ${product.name} » de la base ? Les ventes historiques seront conservées.`)) return;
    try {
      const res = await fetch(`${API_BASE}/products/${product.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression');
      setSnackbar({ open: true, message: 'Produit supprimé définitivement de la base', severity: 'success' });
      loadProducts();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Erreur lors de la suppression', severity: 'error' });
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleFormChange = (field: keyof FormData, value: any) => {
    const updated = { ...form, [field]: value };
    if (field === 'name') {
      updated.slug = generateSlug(value);
    }
    setForm(updated);
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('fr-FR').format(price) + ' €';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" color="primary">
          <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestion des produits
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProducts}
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
            Ajouter produits démo
          </Button>
           <Button
             variant="contained"
             startIcon={<AddIcon />}
             onClick={() => { setEditingId(null); setForm(emptyForm); setImageFile(null); setImagePreview(null); setDialogOpen(true); }}
          >
            Nouveau produit
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <InventoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun produit dans le catalogue
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Cliquez sur "Ajouter produits démo" pour charger des produits par défaut ou "Nouveau produit" pour en créer un.
          </Typography>
          <Button variant="contained" onClick={handleSeed} disabled={seeding}>
            Ajouter produits démo
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
           <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell><strong>Catégorie</strong></TableCell>
                <TableCell><strong>Marque</strong></TableCell>
                <TableCell align="center"><strong>Puissance (W)</strong></TableCell>
                <TableCell align="center"><strong>Capacité (Wh)</strong></TableCell>
                <TableCell align="center"><strong>Extensible</strong></TableCell>
                 <TableCell align="right"><strong>Prix (€)</strong></TableCell>
                 <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Slug: {product.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={CATEGORY_LABELS[product.category] || product.category}
                      size="small"
                      sx={{
                        bgcolor: CATEGORY_COLORS[product.category] || '#999',
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell align="center">{product.outputPowerW ?? '-'}</TableCell>
                  <TableCell align="center">
                    {product.capacityWh ? `${(product.capacityWh / 1000).toFixed(2)} kWh` : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {product.expandable ? (
                      <Chip label="Oui" size="small" color="success" variant="outlined" />
                    ) : (
                      <Chip label="Non" size="small" variant="outlined" />
                    )}
                  </TableCell>
                   <TableCell align="right" sx={{ fontWeight: 500 }}>
                     {formatPrice(product.priceMad)}
                   </TableCell>
                   <TableCell align="center">
                     <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(product)}>Modifier</Button>
                     <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(product)}>Supprimer</Button>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Product Dialog */}
       <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); setImageFile(null); setImagePreview(null); }} maxWidth="md" fullWidth>
         <DialogTitle>{editingId ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Nom du produit"
                required
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                size="small"
              />
              <TextField
                label="Slug (URL)"
                required
                value={form.slug}
                onChange={(e) => handleFormChange('slug', e.target.value)}
                size="small"
                helperText="Identifiant unique pour l'URL"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <FormControl size="small">
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={form.category}
                  label="Catégorie"
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                   {CATEGORY_OPTIONS.map((category) => (
                     <MenuItem key={category.value} value={category.value}>{category.label}</MenuItem>
                   ))}
                </Select>
              </FormControl>
              <TextField
                label="Marque"
                value={form.brand}
                onChange={(e) => handleFormChange('brand', e.target.value)}
                size="small"
              />
              <TextField
                label="Prix € "
                type="number"
                value={form.priceMad}
                onChange={(e) => handleFormChange('priceMad', e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Puissance de sortie (W)"
                type="number"
                value={form.outputPowerW}
                onChange={(e) => handleFormChange('outputPowerW', e.target.value)}
                size="small"
                helperText="Pour panneaux et onduleurs"
              />
              <TextField
                label="Capacité (Wh)"
                type="number"
                value={form.capacityWh}
                onChange={(e) => handleFormChange('capacityWh', e.target.value)}
                size="small"
                helperText="Pour batteries uniquement"
              />
            </Box>
            <TextField
              label="Description"
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              size="small"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" component="label">
                {imageFile ? 'Changer l’image sélectionnée' : 'Télécharger une image'}
                <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => handleImageChange(event.target.files?.[0])} />
              </Button>
              <Typography variant="caption" color="text.secondary">JPG, PNG, WEBP ou GIF — maximum 5 Mo</Typography>
              {imagePreview && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box component="img" src={imagePreview} alt="Aperçu du produit" sx={{ width: 80, height: 60, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 1 }} />
                  {editingId && !imageFile && <Button size="small" color="error" onClick={handleDeleteImage}>Supprimer l’image</Button>}
                </Box>
              )}
            </Box>
            <TextField
              label="Caractéristiques clés (une par ligne)"
              multiline
              rows={3}
              value={form.keyFeatures}
              onChange={(e) => handleFormChange('keyFeatures', e.target.value)}
              size="small"
              placeholder="Rendement >21%&#10;Garantie 25 ans&#10;Cellules mono PERC"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.expandable}
                  onChange={(e) => handleFormChange('expandable', e.target.checked)}
                />
              }
              label="Produit extensible / modulaire"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setForm(emptyForm); setEditingId(null); setImageFile(null); setImagePreview(null); }}>Annuler</Button>
          <Button variant="contained" onClick={handleSave}>{editingId ? 'Enregistrer les modifications' : 'Créer le produit'}</Button>
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

export default ProductsManager;
