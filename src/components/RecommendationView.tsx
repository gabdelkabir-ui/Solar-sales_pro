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
  Fade,
  Zoom,
  useTheme,
  LinearProgress,
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BoltIcon from '@mui/icons-material/Bolt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SelectedEquipment, CustomerInfo, ProductRecommendation } from '../types';
import { calculateConsumption } from '../utils/solarCalculations';
import { getRecommendationFromProducts } from '../utils/productsApi';

interface RecommendationViewProps {
  equipment: SelectedEquipment[];
  customer: CustomerInfo;
  onNext: () => void;
  onSaveSuccess: () => void;
}

const STORAGE_KEY = 'solar_saved_projects';

const RecommendationView: React.FC<RecommendationViewProps> = ({ equipment, customer, onNext, onSaveSuccess }) => {
  const theme = useTheme();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rec, setRec] = useState<ProductRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const hasEquipment = equipment.length > 0;
  const hasCustomer = !!(customer.name && customer.phone);
  const canGenerate = hasEquipment && hasCustomer;

  const { dailyKWh, totalPower } = calculateConsumption(equipment);

  const loadRecommendation = useCallback(async () => {
    if (!canGenerate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getRecommendationFromProducts(dailyKWh, totalPower);
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
  }, [dailyKWh, totalPower, canGenerate]);

  useEffect(() => {
    loadRecommendation();
  }, [loadRecommendation]);

  const handleSave = () => {
    if (!rec) return;
    setSaving(true);
    try {
      // Save to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      const projects = saved ? JSON.parse(saved) : [];
      
      const newProject = {
        id: Date.now(),
        customer: { ...customer },
        equipment: [...equipment],
        recommendation: {
          panelPower: rec.panelPower,
          panelCount: rec.panelCount,
          panelModel: `${rec.panel.outputPowerW}W ${rec.panel.brand}`,
          batteryCapacity: rec.batteryCapacity,
          batteryModel: `${rec.battery.name}`,
          autonomyDays: rec.autonomyDays,
          inverterPower: rec.inverterPower,
          inverterModel: `${(rec.inverter.outputPowerW || 0) / 1000}kW ${rec.inverter.brand}`,
        },
        createdAt: new Date().toISOString(),
      };
      
      projects.unshift(newProject);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      
      setSnackbar({ open: true, message: 'Projet enregistré localement avec succès !', severity: 'success' });
      setTimeout(() => {
        onSaveSuccess();
      }, 1500);
    } catch (err) {
      console.error('Save failed:', err);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement local', severity: 'error' });
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
      <Fade in>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Solution solaire recommandée
            </Typography>
          </Box>
          <Paper 
            sx={{ 
              p: 6, 
              textAlign: 'center',
              borderRadius: 4,
              border: `2px dashed ${theme.palette.divider}`,
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 72, color: theme.palette.warning.main, mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
              Données insuffisantes
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 500, mx: 'auto' }}>
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
      </Fade>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Calcul de la solution solaire optimale...
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Analyse de votre consommation et sélection des produits adaptés
        </Typography>
        <LinearProgress sx={{ width: 300, mt: 3, borderRadius: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <WarningAmberIcon sx={{ fontSize: 72, color: theme.palette.error.main, mb: 2 }} />
        <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 500 }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={loadRecommendation} 
          sx={{ mt: 2, borderRadius: 3, textTransform: 'none' }}
        >
          Réessayer
        </Button>
      </Box>
    );
  }

  if (!rec) return null;

  const recommendationCards = [
    {
      title: 'Panneaux solaires',
      icon: <SolarPowerIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      specs: [
        { label: 'Puissance totale', value: `${rec.panelPower} Wp` },
        { label: 'Quantité', value: `${rec.panelCount} x ${rec.panel.name}` },
        { label: 'Marque', value: rec.panel.brand },
        { label: 'Prix unitaire', value: formatPrice(rec.panel.priceMad) },
      ],
      color: theme.palette.primary.main,
      gradient: 'linear-gradient(135deg, #1976d2, #42a5f5)',
      url: rec.panel.url,
    },
    {
      title: 'Batterie Lithium',
      icon: <BatteryChargingFullIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      specs: [
        { label: 'Capacité', value: `${rec.batteryCapacity.toFixed(2)} kWh` },
        { label: 'Modèle', value: rec.battery.name },
        { label: 'Extensible', value: rec.battery.expandable ? 'Oui ✓' : 'Non' },
        { label: 'Prix', value: formatPrice(rec.battery.priceMad) },
      ],
      color: theme.palette.secondary.main,
      gradient: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
      url: rec.battery.url,
    },
    {
      title: 'Onduleur Hybride',
      icon: <BoltIcon sx={{ fontSize: 40, color: '#fbc02d' }} />,
      specs: [
        { label: 'Puissance onduleur', value: `${rec.inverterPower} W` },
        { label: 'Modèle', value: rec.inverter.name },
        { label: 'Marque', value: rec.inverter.brand },
        { label: 'Prix', value: formatPrice(rec.inverter.priceMad) },
      ],
      color: '#fbc02d',
      gradient: 'linear-gradient(135deg, #f57c00, #ffb74d)',
      url: rec.inverter.url,
    }
  ];

  return (
    <Fade in timeout={500}>
      <Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4, 
          flexWrap: 'wrap', 
          gap: 2,
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Solution solaire recommandée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dimensionnement personnalisé basé sur votre consommation
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button 
              variant="contained"
              color="success"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ 
                borderRadius: 3, 
                textTransform: 'none',
                boxShadow: theme.shadows[2],
                '&:hover': { boxShadow: theme.shadows[6] },
              }}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button 
              variant="contained" 
              endIcon={<ArrowForwardIcon />}
              onClick={onNext}
              sx={{ 
                borderRadius: 3, 
                textTransform: 'none',
                boxShadow: theme.shadows[2],
                '&:hover': { boxShadow: theme.shadows[6] },
              }}
            >
              Générer le rapport
            </Button>
          </Box>
        </Box>

        <Stack spacing={4}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
            {recommendationCards.map((card, index) => (
              <Zoom in timeout={300 + index * 100} key={index}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    position: 'relative', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <Box sx={{ 
                    background: card.gradient, 
                    height: 6, 
                    width: '100%',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                  }} />
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {card.icon}
                    </Box>
                    <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 700 }}>
                      {card.title}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1.5}>
                      {card.specs.map((spec, i) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">{spec.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{spec.value}</Typography>
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
                        sx={{ borderRadius: 3, textTransform: 'none' }}
                      >
                        Voir le produit
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Zoom>
            ))}
          </Box>

          <Paper 
            sx={{ 
              p: 4, 
              borderRadius: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 32, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Analyse de dimensionnement experte
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.95 }}>
                  Basée sur une consommation journalière calculée de <strong>{dailyKWh.toFixed(2)} kWh</strong> et une puissance de pointe de <strong>{totalPower} Watts</strong>, 
                  cette installation est conçue pour couvrir 100 % de vos besoins énergétiques avec <strong>{rec.autonomyDays} jour{rec.autonomyDays > 1 ? 's' : ''} d'autonomie</strong>. 
                  L'onduleur hybride permet une alimentation solaire et un soutien réseau si nécessaire.
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Consommation journalière</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{dailyKWh.toFixed(2)} kWh</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Puissance de pointe</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalPower} W</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Autonomie</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{rec.autonomyDays} jour{rec.autonomyDays > 1 ? 's' : ''}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Stack>

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
            sx={{ borderRadius: 3 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default RecommendationView;