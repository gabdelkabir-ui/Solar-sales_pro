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
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Product } from '../types';

const API_BASE = `http://${window.location.hostname}:5000/api`;

const TVA_RATE = 0.20;

interface Client {
  id: number;
  name: string;
  phone: string;
  city: string;
  notes: string;
}

interface SaleProduct {
  product: Product;
  quantity: number;
}

interface Sale {
  id: number;
  customer: { name: string; phone: string; city: string; notes: string };
  products: SaleProduct[];
  orderNumber: string | null;
  paymentDate: string | null;
  createdAt: string;
}

const generateOrderNumber = () => {
  return `VS-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
};

interface OtherProductsSaleProps {
  onGenerateReport?: (sale: Sale, type: 'bon-de-commande' | 'facture') => void;
}

const OtherProductsSale: React.FC<OtherProductsSaleProps> = ({ onGenerateReport }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New sale form
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [cart, setCart] = useState<SaleProduct[]>([]);

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }, []);

  const loadSales = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/other-sales`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Error loading sales:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProducts(), loadSales()]).finally(() => setLoading(false));
  }, [loadProducts, loadSales]);

  // Client search
  useEffect(() => {
    if (clientSearch.length < 1) {
      setClientOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/clients/search?q=${encodeURIComponent(clientSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setClientOptions(data);
        }
      } catch (err) {
        console.error('Error searching clients:', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  const addToCart = () => {
    if (!selectedProduct) return;
    const existing = cart.find((item) => item.product.id === selectedProduct.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === selectedProduct.id
            ? { ...item, quantity: item.quantity + productQuantity }
            : item
        )
      );
    } else {
      setCart([...cart, { product: selectedProduct, quantity: productQuantity }]);
    }
    setSelectedProduct(null);
    setProductQuantity(1);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotalHT = () => {
    return cart.reduce((sum, item) => sum + (item.product.priceMad || 0) * item.quantity, 0);
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price) + ' €';
  };

  const handleSaveSale = async () => {
    if (!selectedClient) {
      setSnackbar({ open: true, message: 'Veuillez sélectionner un client', severity: 'error' });
      return;
    }
    if (cart.length === 0) {
      setSnackbar({ open: true, message: 'Veuillez ajouter au moins un produit', severity: 'error' });
      return;
    }
    setPaymentDialogOpen(true);
  };

  const confirmSaveSale = async () => {
    setSaving(true);
    try {
      const orderNumber = generateOrderNumber();
      const customerInfo = {
        name: selectedClient!.name,
        phone: selectedClient!.phone,
        city: selectedClient!.city,
        notes: selectedClient!.notes,
      };

      const res = await fetch(`${API_BASE}/other-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customerInfo,
          products: cart,
          orderNumber,
          paymentDate,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors de la sauvegarde');
      }

      setSnackbar({ open: true, message: 'Vente enregistrée avec succès !', severity: 'success' });
      setPaymentDialogOpen(false);
      setSelectedClient(null);
      setClientSearch('');
      setCart([]);
      setSelectedProduct(null);
      setProductQuantity(1);
      loadSales();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Erreur lors de la sauvegarde', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getProductCount = (sale: Sale) => {
    return sale.products.reduce((sum, p) => sum + p.quantity, 0);
  };

  const getSaleTotalHT = (sale: Sale) => {
    return sale.products.reduce((sum, p) => sum + (p.product.priceMad || 0) * p.quantity, 0);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const totalHT = calculateTotalHT();
  const tva = totalHT * TVA_RATE;
  const totalTTC = totalHT + tva;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* ===== SECTION: Nouvelle vente ===== */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          <AddShoppingCartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Nouvelle vente
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Stack spacing={2}>
          {/* Client search */}
          <Autocomplete
            options={clientOptions}
            getOptionLabel={(option) => `${option.name} (${option.phone})`}
            value={selectedClient}
            onChange={(_e, newValue) => setSelectedClient(newValue)}
            inputValue={clientSearch}
            onInputChange={(_e, newValue) => setClientSearch(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rechercher un client"
                placeholder="Tapez le nom ou le téléphone..."
                size="small"
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.phone} {option.city ? `- ${option.city}` : ''}
                  </Typography>
                </Box>
              </li>
            )}
            noOptionsText="Aucun client trouvé"
          />

          {/* Product selection */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => `${option.name} - ${formatPrice(option.priceMad)}`}
              value={selectedProduct}
              onChange={(_e, newValue) => setSelectedProduct(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sélectionner un produit"
                  placeholder="Rechercher un produit..."
                  size="small"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.brand}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatPrice(option.priceMad)}
                    </Typography>
                  </Box>
                </li>
              )}
              noOptionsText="Aucun produit trouvé"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Quantité"
              type="number"
              value={productQuantity}
              onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              size="small"
              sx={{ width: 100 }}
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <Button
              variant="outlined"
              onClick={addToCart}
              disabled={!selectedProduct}
              sx={{ mt: 0.5 }}
            >
              Ajouter
            </Button>
          </Box>

          {/* Cart table */}
          {cart.length > 0 && (
            <TableContainer component={Box}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Produit</strong></TableCell>
                    <TableCell align="center"><strong>Qté</strong></TableCell>
                    <TableCell align="right"><strong>PU HT</strong></TableCell>
                    <TableCell align="right"><strong>Total HT</strong></TableCell>
                    <TableCell width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.product.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.product.brand}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatPrice(item.product.priceMad)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {formatPrice((item.product.priceMad || 0) * item.quantity)}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => removeFromCart(item.product.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Totals */}
          {cart.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: 300, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total HT</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatPrice(totalHT)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">TVA ({(TVA_RATE * 100).toFixed(0)}%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatPrice(tva)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Total TTC</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatPrice(totalTTC)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Save button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSaveSale}
              disabled={!selectedClient || cart.length === 0}
            >
              Enregistrer la vente
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* ===== SECTION: Ventes enregistrées ===== */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Ventes enregistrées
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {sales.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Aucune vente enregistrée.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>N° Commande</strong></TableCell>
                  <TableCell><strong>Client</strong></TableCell>
                  <TableCell align="center"><strong>Nb Produits</strong></TableCell>
                  <TableCell align="right"><strong>Total TTC</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => {
                  const saleTotalHT = getSaleTotalHT(sale);
                  const saleTotalTTC = saleTotalHT + saleTotalHT * TVA_RATE;
                  return (
                    <TableRow key={sale.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {sale.orderNumber || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {sale.customer.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sale.customer.phone}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{getProductCount(sale)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {formatPrice(saleTotalTTC)}
                      </TableCell>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<AssessmentIcon />}
                            onClick={() => onGenerateReport?.(sale, 'bon-de-commande')}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Rapport
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            startIcon={<ReceiptIcon />}
                            onClick={() => onGenerateReport?.(sale, 'facture')}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Facture
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Payment Date Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Date de paiement</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Veuillez définir la date de paiement pour cette vente.
            </Typography>
            <TextField
              label="Date de paiement"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={confirmSaveSale} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Confirmer la vente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OtherProductsSale;