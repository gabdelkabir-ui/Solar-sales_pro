import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Divider,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BoltIcon from '@mui/icons-material/Bolt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { SelectedEquipment, CustomerInfo, ProductRecommendation } from '../types';
import { useProjectStore } from '../hooks/useProjectStore';
import { calculateConsumption } from '../utils/solarCalculations';
import { getRecommendationFromProducts } from '../utils/productsApi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecommendationViewProps {
  equipment: SelectedEquipment[];
  customer: CustomerInfo;
  onNext: () => void;
  onSaveSuccess: () => void;
}

const generateOrderNumber = () => {
  return `BC-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
};

const RecommendationView: React.FC<RecommendationViewProps> = ({ equipment, customer, onNext, onSaveSuccess }) => {
  const { orderNumber, paymentDate, setPaymentDate, setOrderNumber, energySimulation } = useProjectStore();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rec, setRec] = useState<ProductRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'report' | null>(null);
  const [paymentDateInput, setPaymentDateInput] = useState(paymentDate);

  const hasEquipment = equipment.length > 0;
  const hasCustomer = !!(customer.name && customer.phone);
  const canGenerate = hasEquipment && hasCustomer;

  const { dailyKWh, totalPower } = calculateConsumption(equipment);

  const includePanels = energySimulation.presencePanneaux;

  const loadRecommendation = useCallback(async () => {
    if (!canGenerate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getRecommendationFromProducts(dailyKWh, totalPower, includePanels);
      if (result) {
        setRec(result);
      } else {
        setError('Impossible de générer une recommandation. Vérifiez que des produits sont disponibles dans le catalogue.');
      }
    } catch (err) {
      console.error('Error loading recommendation:', err);
      setError('Erreur lors du chargement des produits recommandés.');
    } finally {
      setLoading(false);
    }
  }, [dailyKWh, totalPower, canGenerate, includePanels]);

  useEffect(() => {
    loadRecommendation();
  }, [loadRecommendation]);

  // Generate a new unique order number each time we enter this tab
  useEffect(() => {
    setOrderNumber(generateOrderNumber());
  }, []);

  const openPaymentDialog = (action: 'save' | 'report') => {
    setPaymentDateInput(paymentDate);
    setPendingAction(action);
    setPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = async () => {
    setPaymentDate(paymentDateInput);
    setPaymentDialogOpen(false);
    if (pendingAction === 'save') {
      handleSave();
    } else if (pendingAction === 'report') {
      // Save the project first, then go to report
      if (rec) {
        setSaving(true);
        try {
          const recommendation: Record<string, any> = {
            panelPower: rec.panelPower,
            panelCount: rec.panelCount,
            panelModel: `${rec.panel.outputPowerW}W ${rec.panel.brand}`,
            batteryCapacity: rec.batteryCapacity,
            batteryModel: `${rec.battery.name}`,
            autonomyDays: rec.autonomyDays,
            orderNumber,
            paymentDate: paymentDateInput,
          };
          if (rec.inverter) {
            recommendation.inverterPower = rec.inverterPower;
            recommendation.inverterModel = `${(rec.inverter.outputPowerW || 0) / 1000}kW ${rec.inverter.brand}`;
          }
          await fetch(`http://${window.location.hostname}:5000/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer,
              equipment,
              recommendation,
              energySimulation,
            }),
          });
        } catch (err) {
          console.error('Auto-save before report failed:', err);
        } finally {
          setSaving(false);
        }
      }
      onNext();
    }
    setPendingAction(null);
  };

  const handleSave = async () => {
    if (!rec) return;
    setSaving(true);
    try {
      const recommendation: Record<string, any> = {
        panelPower: rec.panelPower,
        panelCount: rec.panelCount,
        panelModel: `${rec.panel.outputPowerW}W ${rec.panel.brand}`,
        batteryCapacity: rec.batteryCapacity,
        batteryModel: `${rec.battery.name}`,
        autonomyDays: rec.autonomyDays,
        orderNumber,
        paymentDate,
      };
      if (rec.inverter) {
        recommendation.inverterPower = rec.inverterPower;
        recommendation.inverterModel = `${(rec.inverter.outputPowerW || 0) / 1000}kW ${rec.inverter.brand}`;
      }
      const response = await fetch(`http://${window.location.hostname}:5000/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          equipment,
          recommendation,
          energySimulation,
        }),
      });

      if (!response.ok) throw new Error('Erreur serveur');

      setSnackbar({ open: true, message: 'Projet enregistré avec succès !', severity: 'success' });
      setTimeout(() => {
        onSaveSuccess();
      }, 1500);
    } catch (err) {
      console.error('Save failed:', err);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
  };

  // Missing data state
  if (!canGenerate && !loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color="primary">Solution solaire recommandée</Typography>
        </Box>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <WarningAmberIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Données insuffisantes pour générer une recommandation
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {!hasCustomer && !hasEquipment && (
              <>Veuillez d'abord renseigner les informations du client dans l'onglet <strong>Client</strong> et ajouter des équipements dans l'onglet <strong>Calculatrice</strong>.</>
            )}
            {!hasCustomer && hasEquipment && (
              <>Veuillez d'abord renseigner les informations du client dans l'onglet <strong>Client</strong>.</>
            )}
            {hasCustomer && !hasEquipment && (
              <>Veuillez d'abord ajouter des équipements dans l'onglet <strong>Calculatrice</strong>.</>
            )}
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">
          Calcul de la solution solaire optimale...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={loadRecommendation} sx={{ mt: 2 }}>
          Réessayer
        </Button>
      </Box>
    );
  }

  if (!rec) return null;

  const recommendationCards = [
    ...(rec.panelCount > 0 ? [{
      title: 'Panneaux solaires',
      icon: <SolarPowerIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      specs: [
        { label: 'Puissance totale', value: `${rec.panelPower} Wp` },
        { label: 'Quantité', value: `${rec.panelCount} x ${rec.panel.name}` },
        { label: 'Marque', value: rec.panel.brand },
        { label: 'Prix unitaire', value: formatPrice(rec.panel.priceMad) },
      ],
      color: 'primary.main',
      url: rec.panel.url,
      imageUrl: rec.panel.imageUrl,
    }] : []),
    {
      title: 'Batterie Lithium',
      icon: <BatteryChargingFullIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      specs: [
        { label: 'Capacité', value: `${rec.batteryCapacity.toFixed(2)} kWh` },
        { label: 'Modèle', value: rec.battery.name },
        { label: 'Extensible', value: rec.battery.expandable ? 'Oui' : 'Non' },
        { label: 'Prix', value: formatPrice(rec.battery.priceMad) },
      ],
      color: 'secondary.main',
      url: rec.battery.url,
      imageUrl: rec.battery.imageUrl,
    },
    ...(rec.inverter ? [{
      title: 'Onduleur Hybride',
      icon: <BoltIcon sx={{ fontSize: 40, color: '#fbc02d' }} />,
      specs: [
        { label: 'Puissance onduleur', value: `${rec.inverterPower} W` },
        { label: 'Modèle', value: rec.inverter.name },
        { label: 'Marque', value: rec.inverter.brand },
        { label: 'Prix', value: formatPrice(rec.inverter.priceMad) },
      ],
      color: '#fbc02d',
      url: rec.inverter.url,
      imageUrl: rec.inverter.imageUrl,
    }] : []),
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" color="primary">Solution solaire recommandée</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained"
            color="success"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={() => openPaymentDialog('save')}
            disabled={saving}
          >
            Enregistrer
          </Button>
          <Button 
            variant="contained" 
            endIcon={<ArrowForwardIcon />}
            onClick={() => openPaymentDialog('report')}
          >
            Générer le rapport
          </Button>
        </Box>
      </Box>

      <Stack spacing={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: rec.inverter ? '1fr 1fr 1fr' : '1fr 1fr' }, gap: 3 }}>
          {recommendationCards.map((card, index) => (
            <Card key={index} sx={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ bgcolor: card.color, height: 4, width: '100%' }} />
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                {card.imageUrl && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, height: 120 }}>
                    <Box
                      component="img"
                      src={card.imageUrl}
                      alt={card.title}
                      sx={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: 1,
                      }}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h6" align="center" gutterBottom>
                  {card.title}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  {card.specs.map((spec, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{spec.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{spec.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
              {card.url && (
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<OpenInNewIcon />}
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ borderRadius: 4 }}
                  >
                    Voir le produit
                  </Button>
                </CardActions>
              )}
            </Card>
          ))}
        </Box>

        <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" gutterBottom>Analyse de dimensionnement experte</Typography>
          <Typography variant="body1">
            Basée sur une consommation journalière calculée de <strong>{dailyKWh.toFixed(2)} kWh</strong> et une puissance de pointe de <strong>{totalPower} Watts</strong>, 
            cette installation est conçue pour couvrir 100 % de vos besoins énergétiques avec au moins 1 jour d'autonomie.
          </Typography>
        </Paper>
      </Stack>

      {/* Payment Date Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Conditions de paiement</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Veuillez sélectionner la date d'échéance de paiement :
          </Typography>
          <TextField
            fullWidth
            type="date"
            label="Date de paiement"
            value={paymentDateInput}
            onChange={(e) => setPaymentDateInput(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handlePaymentConfirm}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

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

export default RecommendationView;