import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  useTheme,
  SelectChangeEvent,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SavingsIcon from '@mui/icons-material/Savings';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BoltIcon from '@mui/icons-material/Bolt';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import { EnergySimulation as EnergySimulationType, Product } from '../types';
import { executerSimulation, SimulationResults } from '../utils/energyCalculations';
import { fetchProducts } from '../utils/productsApi';

interface EnergySimulationProps {
  energySimulation: EnergySimulationType;
  setEnergySimulation: (data: EnergySimulationType) => void;
  onNext: () => void;
  onBack: () => void;
}

const EnergySimulation: React.FC<EnergySimulationProps> = ({
  energySimulation,
  setEnergySimulation,
  onNext,
  onBack,
}) => {
  const theme = useTheme();
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [batteries, setBatteries] = useState<Product[]>([]);
  const [panels, setPanels] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Charger les produits au montage du composant
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const [batteryProducts, panelProducts] = await Promise.all([
          fetchProducts('battery'),
          fetchProducts('panel'),
        ]);
        setBatteries(batteryProducts);
        setPanels(panelProducts);
      } catch (err) {
        console.error('Erreur lors du chargement des produits:', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  const handleInputChange = (field: keyof EnergySimulationType, value: any) => {
    setEnergySimulation({ ...energySimulation, [field]: value });
    // Reset results when inputs change
    if (showResults) {
      setShowResults(false);
      setSimulationResults(null);
    }
  };

  // Gestionnaire pour le changement de batterie sélectionnée
  const handleBatteryChange = (productId: number | null) => {
    setEnergySimulation({ ...energySimulation, selectedBatteryId: productId });
    if (showResults) {
      setShowResults(false);
      setSimulationResults(null);
    }
  };

  // Gestionnaire pour le changement de panneau sélectionné
  const handlePanelChange = (productId: number | null) => {
    setEnergySimulation({ ...energySimulation, selectedPanelId: productId });
    if (showResults) {
      setShowResults(false);
      setSimulationResults(null);
    }
  };

  const handleSimulate = () => {
    // Trouver les produits sélectionnés
    const selectedBattery = batteries.find(b => b.id === energySimulation.selectedBatteryId) || null;
    const selectedPanel = panels.find(p => p.id === energySimulation.selectedPanelId) || null;

    const results = executerSimulation({
      factureMensuelle: energySimulation.factureMensuelle,
      typeContrat: energySimulation.typeContrat,
      consommationHP: energySimulation.consommationHP,
      consommationHC: energySimulation.consommationHC,
      tarifHP: energySimulation.tarifHP,
      tarifHC: energySimulation.tarifHC,
      presencePanneaux: energySimulation.presencePanneaux,
      selectedBattery,
      selectedPanel,
    });
    setSimulationResults(results);
    setShowResults(true);
  };

  const hasInputData = useMemo(() => {
    return (
      energySimulation.consommationHP !== '' &&
      energySimulation.consommationHC !== '' &&
      energySimulation.tarifHP !== '' &&
      energySimulation.tarifHC !== ''
    );
  }, [energySimulation]);

  const getPotentielColor = (potentiel: string) => {
    switch (potentiel) {
      case 'Important': return theme.palette.success.main;
      case 'Moyen': return theme.palette.warning.main;
      case 'Faible': return theme.palette.info.main;
      default: return theme.palette.grey[400];
    }
  };

  const getPotentielIcon = (potentiel: string) => {
    switch (potentiel) {
      case 'Important': return '🔴';
      case 'Moyen': return '🟡';
      case 'Faible': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ElectricBoltIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
          <Typography variant="h5" color="primary">
            EASY POWER - Votre potentiel d'optimisation
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
          >
            Retour
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={onNext}
          >
            Tableau de bord
          </Button>
        </Box>
      </Box>

      {/* Sélecteurs de produits */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f4ff', border: `1px solid ${theme.palette.primary.light}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BatteryChargingFullIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Sélectionnez vos équipements
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <FormControl size="small" disabled={loadingProducts}>
            <InputLabel>Batterie</InputLabel>
            <Select
              value={energySimulation.selectedBatteryId == null ? '' : energySimulation.selectedBatteryId}
              label="Batterie"
              onChange={(e: SelectChangeEvent<number | string>) => {
                const val = e.target.value;
                handleBatteryChange(val === '' ? null : Number(val));
              }}
            >
              <MenuItem value="">
                <em>Par défaut (BALCO 260 - 2560Wh)</em>
              </MenuItem>
              {batteries.map((bat) => (
                <MenuItem key={bat.id} value={bat.id}>
                  {bat.name} ({bat.capacityWh}Wh) - {bat.priceMad?.toFixed(2)} €
                </MenuItem>
              ))}
            </Select>
            {loadingProducts && <Typography variant="caption" color="text.secondary">Chargement...</Typography>}
          </FormControl>

          <FormControl size="small" disabled={loadingProducts}>
            <InputLabel>Panneau solaire</InputLabel>
            <Select
              value={energySimulation.selectedPanelId == null ? '' : energySimulation.selectedPanelId}
              label="Panneau solaire"
              onChange={(e: SelectChangeEvent<number | string>) => {
                const val = e.target.value;
                handlePanelChange(val === '' ? null : Number(val));
              }}
            >
              <MenuItem value="">
                <em>Aucun (valeurs par défaut)</em>
              </MenuItem>
              {panels.map((panel) => (
                <MenuItem key={panel.id} value={panel.id}>
                  {panel.name} ({panel.outputPowerW}W) - {panel.priceMad?.toFixed(2)} €
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {simulationResults && (
          <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {simulationResults.batteryName && (
              <Typography variant="caption" color="text.secondary">
                Batterie sélectionnée : <strong>{simulationResults.batteryName}</strong> ({simulationResults.batteryCapacity}Wh)
              </Typography>
            )}
            {simulationResults.panelName && (
              <Typography variant="caption" color="text.secondary">
                Panneau sélectionné : <strong>{simulationResults.panelName}</strong> ({simulationResults.panelPower}W)
              </Typography>
            )}
          </Box>
        )}

        {/* Spécifications des produits sélectionnés */}
        {(energySimulation.selectedBatteryId || energySimulation.selectedPanelId) && (
          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {(() => {
              const selectedBat = batteries.find(b => b.id === energySimulation.selectedBatteryId);
              const selectedPan = panels.find(p => p.id === energySimulation.selectedPanelId);
              return (
                <>
                  {selectedBat && (
                    <Card variant="outlined" sx={{ bgcolor: '#e3f2fd' }}>
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 1 }}>
                          🔋 {selectedBat.name}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Capacité</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedBat.capacityWh} Wh</Typography>
                          <Typography variant="caption" color="text.secondary">Puissance sortie</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedBat.outputPowerW} W</Typography>
                          <Typography variant="caption" color="text.secondary">Prix</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedBat.priceMad?.toFixed(2)} €</Typography>
                          <Typography variant="caption" color="text.secondary">Marque</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedBat.brand}</Typography>
                          <Typography variant="caption" color="text.secondary">Extensible</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedBat.expandable ? 'Oui' : 'Non'}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                  {selectedPan && (
                    <Card variant="outlined" sx={{ bgcolor: '#e8f5e9' }}>
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: theme.palette.success.main, mb: 1 }}>
                          ☀️ {selectedPan.name}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Puissance</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedPan.outputPowerW} W</Typography>
                          <Typography variant="caption" color="text.secondary">Prix</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedPan.priceMad?.toFixed(2)} €</Typography>
                          <Typography variant="caption" color="text.secondary">Marque</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{selectedPan.brand}</Typography>
                          <Typography variant="caption" color="text.secondary">Production estimée</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{(selectedPan.outputPowerW ? (selectedPan.outputPowerW * 4.5 * 0.9 / 1000).toFixed(2) : '—')} kWh/jour</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </>
              );
            })()}
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Left Column: Steps 1-3 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* ÉTAPE 1: Votre facture */}
          <Paper sx={{ p: 3, borderLeft: `6px solid ${theme.palette.primary.main}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" color="primary">
                ① Votre facture
              </Typography>
              <Typography variant="body2" color="text.secondary">
                — Analysons votre facture
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Facture mensuelle"
                type="number"
                value={energySimulation.factureMensuelle}
                onChange={(e) => handleInputChange('factureMensuelle', e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>€</Typography>,
                  },
                }}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffde7' } }}
              />

              <FormControl size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffde7' } }}>
                <InputLabel>Type de contrat</InputLabel>
                <Select
                  value={energySimulation.typeContrat}
                  label="Type de contrat"
                  onChange={(e) => handleInputChange('typeContrat', e.target.value)}
                >
                  <MenuItem value="HP/HC">HP / HC</MenuItem>
                  <MenuItem value="Base">Base</MenuItem>
                  <MenuItem value="Tempo">Tempo</MenuItem>
                  <MenuItem value="EJP">EJP</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Consommation HP"
                type="number"
                value={energySimulation.consommationHP}
                onChange={(e) => handleInputChange('consommationHP', e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: <Typography sx={{ ml: 0.5, color: 'text.secondary' }}>kWh</Typography>,
                  },
                }}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffde7' } }}
              />

              <TextField
                label="Consommation HC"
                type="number"
                value={energySimulation.consommationHC}
                onChange={(e) => handleInputChange('consommationHC', e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: <Typography sx={{ ml: 0.5, color: 'text.secondary' }}>kWh</Typography>,
                  },
                }}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffde7' } }}
              />

              <TextField
                label="Tarif HP"
                type="number"
                value={energySimulation.tarifHP}
                onChange={(e) => handleInputChange('tarifHP', e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>€</Typography>,
                    endAdornment: <Typography sx={{ ml: 0.5, color: 'text.secondary' }}>/kWh</Typography>,
                  },
                }}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffde7' } }}
              />

              <TextField
                label="Tarif HC"
                type="number"
                value={energySimulation.tarifHC}
                onChange={(e) => handleInputChange('tarifHC', e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>€</Typography>,
                    endAdornment: <Typography sx={{ ml: 0.5, color: 'text.secondary' }}>/kWh</Typography>,
                  },
                }}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffde7' } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={energySimulation.presencePanneaux}
                    onChange={(e) => handleInputChange('presencePanneaux', e.target.checked)}
                    color="success"
                  />
                }
                label="Panneaux photovoltaïques"
                sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
              />
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSimulate}
                disabled={!hasInputData}
                startIcon={<BoltIcon />}
                sx={{ px: 4 }}
              >
                Lancer la simulation
              </Button>
            </Box>
          </Paper>

          {/* ÉTAPE 2: Diagnostic énergétique */}
          {showResults && simulationResults && (
            <Paper sx={{ p: 3, borderLeft: `6px solid ${getPotentielColor(simulationResults.potentielOptimisation)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LightbulbIcon sx={{ color: theme.palette.warning.main }} />
                <Typography variant="h6">
                  ② Diagnostic énergétique
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                      HP {simulationResults.pourcentageHP}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {parseFloat(energySimulation.consommationHP || '0').toFixed(0)} kWh
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={simulationResults.pourcentageHP}
                    sx={{
                      height: 24,
                      borderRadius: 2,
                      bgcolor: '#e8f5e9',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.error.main,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      HC {simulationResults.pourcentageHC}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {parseFloat(energySimulation.consommationHC || '0').toFixed(0)} kWh
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={simulationResults.pourcentageHC}
                    sx={{
                      height: 24,
                      borderRadius: 2,
                      bgcolor: '#fce4ec',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.success.main,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Potentiel d'optimisation :
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: getPotentielColor(simulationResults.potentielOptimisation),
                      fontWeight: 'bold',
                    }}
                  >
                    {getPotentielIcon(simulationResults.potentielOptimisation)} {simulationResults.potentielOptimisation}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2">
                    <strong>Consommation totale :</strong> {simulationResults.totalConsommation.toFixed(0)} kWh/mois
                  </Typography>
                  <Typography variant="body2">
                    <strong>Écart tarifaire :</strong> {simulationResults.ecartTarifaire.toFixed(4)} €/kWh
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* ÉTAPE 3: Fonctionnement BALCO 260 */}
          <Paper sx={{ p: 3, borderLeft: `6px solid ${theme.palette.info.main}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SolarPowerIcon sx={{ color: theme.palette.info.main }} />
              <Typography variant="h6" color="info.main">
                ③ Comment fonctionne la batterie
              </Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              {/* Schéma de flux */}
              {energySimulation.presencePanneaux ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3">☀️</Typography>
                      <Typography variant="caption">Panneaux</Typography>
                    </Box>
                    <Typography variant="h4">↓</Typography>
                    <Box sx={{ textAlign: 'center', px: 2, py: 1, bgcolor: theme.palette.primary.main, color: 'white', borderRadius: 2 }}>
                      <Typography variant="h5">🔋</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{simulationResults?.batteryName || 'Batterie'}</Typography>
                    </Box>
                    <Typography variant="h4">↓</Typography>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3">⚡</Typography>
                      <Typography variant="caption">Équipements</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">⇅</Typography>
                    <Typography variant="body2" color="text.secondary">Réseau</Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4">🔌</Typography>
                      <Typography variant="caption">Réseau</Typography>
                    </Box>
                    <Typography variant="h4">⇄</Typography>
                    <Box sx={{ textAlign: 'center', px: 3, py: 1, bgcolor: theme.palette.primary.main, color: 'white', borderRadius: 2 }}>
                      <Typography variant="h5">🔋</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{simulationResults?.batteryName || 'Batterie'}</Typography>
                    </Box>
                    <Typography variant="h4">⇄</Typography>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4">⚡</Typography>
                      <Typography variant="caption">Équipements</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                La batterie stocke l'énergie en Heures Creuses pour la restituer en Heures Pleines,
                optimisant ainsi votre consommation et réduisant votre facture.
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Right Column: Steps 4-7 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* ÉTAPE 4: Simulation personnalisée */}
          {showResults && simulationResults && (
            <Paper sx={{ p: 3, borderLeft: `6px solid ${theme.palette.secondary.main}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TimelineIcon sx={{ color: theme.palette.secondary.main }} />
                <Typography variant="h6" color="secondary">
                  ④ Ce que ferait la {simulationResults.batteryName || 'batterie'} chez vous
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Card variant="outlined" sx={{ bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Aujourd'hui
                    </Typography>
                    <Typography variant="body2">
                      <strong>HP :</strong> {parseFloat(energySimulation.consommationHP || '0').toFixed(0)} kWh
                    </Typography>
                    <Typography variant="body2">
                      <strong>HC :</strong> {parseFloat(energySimulation.consommationHC || '0').toFixed(0)} kWh
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ bgcolor: '#e8f5e9' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Après {simulationResults.batteryName || 'BALCO'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>HP :</strong> {simulationResults.consoApresHp.toFixed(0)} kWh
                    </Typography>
                    <Typography variant="body2">
                      <strong>HC :</strong> {simulationResults.consoApresHc.toFixed(0)} kWh
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ mt: 2, textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                <Typography variant="h6" color="primary">
                  ⚡ Énergie déplacée : {simulationResults.energieDeplacee} kWh/mois
                </Typography>
              </Box>
            </Paper>
          )}

          {/* ÉTAPE 5: Économies */}
          {showResults && simulationResults && (
            <Paper sx={{ p: 3, borderLeft: `6px solid ${theme.palette.success.main}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SavingsIcon sx={{ color: theme.palette.success.main }} />
                <Typography variant="h6" color="success.main">
                  ⑤ Vos économies
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Card sx={{ bgcolor: '#e8f5e9' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Quotidienne</Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {simulationResults.economieQuotidienne.toFixed(2)} €
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ bgcolor: '#c8e6c9' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Mensuelle</Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {simulationResults.economieMensuelle.toFixed(2)} €
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ bgcolor: '#a5d6a7' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" color="text.secondary">Annuelle</Typography>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {simulationResults.economieAnnuelle.toFixed(2)} €
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Paper>
          )}

          {/* ÉTAPE 6: ROI */}
          {showResults && simulationResults && (
            <Paper sx={{ p: 3, borderLeft: `6px solid ${theme.palette.warning.main}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountBalanceIcon sx={{ color: theme.palette.warning.main }} />
                <Typography variant="h6" color="warning.main">
                  ⑥ Retour sur investissement
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Prix {simulationResults.batteryName || 'BALCO 260'}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {simulationResults.prixBalco.toFixed(2)} €
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="caption" color="text.secondary">Économie annuelle</Typography>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {simulationResults.economieAnnuelle.toFixed(2)} €
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">ROI</Typography>
                  <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {simulationResults.roi > 0 ? `${simulationResults.roi} an${simulationResults.roi > 1 ? 's' : ''}` : '—'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* ÉTAPE 7: Résumé */}
          {showResults && simulationResults && (
            <Paper sx={{ p: 3, borderLeft: `6px solid ${theme.palette.primary.main}`, bgcolor: '#f3e5f5' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h6" color="primary">
                  ⑦ Résumé
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Aujourd'hui</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {parseFloat(energySimulation.factureMensuelle || '0').toFixed(2)} €/mois
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Après {simulationResults.batteryName || 'BALCO'}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                    {Math.max(0, parseFloat(energySimulation.factureMensuelle || '0') - simulationResults.economieMensuelle).toFixed(2)} €/mois
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Économies</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                    {simulationResults.economieMensuelle.toFixed(2)} €/mois
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {simulationResults.conclusion}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Message si pas encore simulé */}
          {!showResults && (
            <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <ElectricBoltIcon sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Remplissez les informations de votre facture
              </Typography>
              <Typography variant="body2" color="text.secondary">
                puis cliquez sur "Lancer la simulation" pour découvrir votre potentiel d'économies avec la batterie.
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EnergySimulation;