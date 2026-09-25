import React, { useState, useEffect } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Box, 
  Tabs, 
  Tab, 
  Paper,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import theme from './theme';
import CustomerForm from './components/CustomerForm';
import EquipmentCalculator from './components/EquipmentCalculator';
import Dashboard from './components/Dashboard';
import RecommendationView from './components/RecommendationView';
import ReportView from './components/ReportView';
import SavedProjects from './components/SavedProjects';
import ProductsManager from './components/ProductsManager';
import EquipmentManager from './components/EquipmentManager';
import EnergySimulation from './components/EnergySimulation';
import OtherProductsSale from './components/OtherProductsSale';
import SaleReportView from './components/SaleReportView';
import { CustomerInfo, SelectedEquipment, ReportType } from './types';
import { useProjectStore } from './hooks/useProjectStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const tabConfigs = [
  { label: 'Client', key: 'customer', adminOnly: false },
  { label: 'Calculatrice', key: 'calculator', adminOnly: false },
  { label: 'Simulation Énergétique', key: 'energy', adminOnly: false },
  { label: 'Tableau de bord', key: 'dashboard', adminOnly: false },
  { label: 'Recommandation', key: 'recommendation', adminOnly: false },
  { label: 'Ventes produits', key: 'other-sales', adminOnly: false },
  { label: 'Produits', key: 'products', adminOnly: true },
  { label: 'Équipements', key: 'equipment', adminOnly: true },
  { label: 'Projets', key: 'projects', adminOnly: true },
];

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('bon-de-commande');
  const [reportProjectId, setReportProjectId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<{ orderNumber: string; paymentDate: string; customer: CustomerInfo; equipment: SelectedEquipment[] } | null>(null);
  const [showSaleReport, setShowSaleReport] = useState(false);
  const [saleReportData, setSaleReportData] = useState<{ sale: any; type: ReportType } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const store = useProjectStore();

  const API_BASE = `http://${window.location.hostname}:5000/api`;

  // La session est portée par un cookie HttpOnly : elle survit au refresh.
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then((response) => { if (response.ok) setIsAdmin(true); })
      .catch(() => undefined)
      .finally(() => setAdminLoading(false));
  }, [API_BASE]);

  const visibleTabs = tabConfigs.filter(t => isAdmin || !t.adminOnly);

  // Clamp activeTab if it exceeds visible tabs count
  useEffect(() => {
    if (activeTab >= visibleTabs.length) {
      setActiveTab(0);
    }
  }, [visibleTabs.length, activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAdminClick = async () => {
    if (isAdmin) {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined);
      setIsAdmin(false);
      setActiveTab(0);
    } else {
      setAdminDialogOpen(true);
      setAdminPassword('');
      setAdminError('');
    }
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim() || adminSubmitting) return;
    setAdminSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: adminPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Connexion refusée (${response.status})`);
      setIsAdmin(true);
      setAdminDialogOpen(false);
      setAdminPassword('');
      setAdminError('');
    } catch (error: any) {
      const message = error instanceof TypeError
        ? `Impossible de joindre le serveur backend à l’adresse ${API_BASE}. Vérifiez qu’il fonctionne sur le port 5000.`
        : error.message || 'Échec de la connexion administrateur.';
      setAdminError(message);
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleGenerateReportFromProject = async (projectId: number, type: ReportType = 'bon-de-commande') => {
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement du projet');
      const project = await response.json();
      store.loadProject({
        customer: project.customer,
        equipment: project.equipment || [],
        orderNumber: project.orderNumber || undefined,
        paymentDate: project.paymentDate || undefined,
        recommendation: project.recommendation || undefined,
      });
      setReportData({
        orderNumber: project.orderNumber || '',
        paymentDate: project.paymentDate || '',
        customer: project.customer,
        equipment: project.equipment || [],
      });
      setReportProjectId(projectId);
      setReportType(type);
      setShowReport(true);
    } catch (err) {
      console.error('Failed to load project for report:', err);
      alert('Erreur lors du chargement du projet pour générer le rapport.');
    }
  };

  const handleGenerateDevisFromProject = async (projectId: number) => {
    await handleGenerateReportFromProject(projectId, 'devis');
  };

  const handleViewSimulation = async (projectId: number) => {
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement du projet');
      const project = await response.json();
      if (project.energySimulation) {
        store.loadProject({
          customer: project.customer,
          equipment: project.equipment || [],
          orderNumber: project.orderNumber || undefined,
          paymentDate: project.paymentDate || undefined,
          recommendation: project.recommendation || undefined,
          energySimulation: project.energySimulation,
        });
      } else {
        // Load customer data but keep existing simulation
        store.loadProject({
          customer: project.customer,
          equipment: project.equipment || [],
          orderNumber: project.orderNumber || undefined,
          paymentDate: project.paymentDate || undefined,
          recommendation: project.recommendation || undefined,
        });
      }
      setActiveTab(2); // Go to Energy Simulation tab
    } catch (err) {
      console.error('Failed to load project for simulation:', err);
      alert('Erreur lors du chargement du projet pour la simulation.');
    }
  };

  const handleAdminDialogClose = () => {
    setAdminDialogOpen(false);
    setAdminPassword('');
    setAdminError('');
    setShowAdminPassword(false);
  };

  const renderTabPanel = (tab: typeof tabConfigs[0]) => {
    switch (tab.key) {
      case 'customer':
        return (
          <CustomerForm 
            customer={store.customer} 
            setCustomer={store.setCustomer} 
            onNext={() => setActiveTab(1)}
            isAdmin={isAdmin}
          />
        );
      case 'calculator':
        return (
          <EquipmentCalculator 
            equipment={store.equipment}
            addEquipment={store.addEquipment}
            removeEquipment={store.removeEquipment}
            updateEquipment={store.updateEquipment}
            onNext={() => setActiveTab(2)}
          />
        );
      case 'energy':
        return (
          <EnergySimulation 
            energySimulation={store.energySimulation}
            setEnergySimulation={store.setEnergySimulation}
            onNext={() => setActiveTab(3)}
            onBack={() => setActiveTab(1)}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            equipment={store.equipment}
            onNext={() => setActiveTab(4)}
          />
        );
      case 'recommendation':
        return (
          <RecommendationView 
            equipment={store.equipment}
            customer={store.customer}
            onNext={() => {
              setReportProjectId(null);
              setShowReport(true);
            }}
            onSaveSuccess={() => {
              store.resetProject();
              setActiveTab(0);
            }}
          />
        );
      case 'products':
        return <ProductsManager />;
      case 'equipment':
        return <EquipmentManager />;
      case 'other-sales':
        return (
          <OtherProductsSale
            onGenerateReport={(sale, type) => {
              setSaleReportData({ sale, type });
              setShowSaleReport(true);
            }}
          />
        );
      case 'projects':
        return (
          <SavedProjects 
            onGenerateReport={(id) => handleGenerateReportFromProject(id, 'bon-de-commande')}
            onGenerateDevis={handleGenerateDevisFromProject}
            onViewSimulation={handleViewSimulation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <SolarPowerIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Solar Sales Pro
            </Typography>
             <Button
              color="inherit" 
              startIcon={<AdminPanelSettingsIcon />}
              onClick={handleAdminClick}
              sx={{ mr: 1 }}
              disabled={adminLoading || adminSubmitting}
            >
              {isAdmin ? 'Désactiver Admin' : 'Admin'}
            </Button>
            <Button 
              color="inherit" 
              startIcon={<RestartAltIcon />}
              onClick={() => {
                if(confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ?")) {
                  store.resetProject();
                }
              }}
            >
              Réinitialiser
            </Button>
          </Toolbar>
        </AppBar>

          {showSaleReport && saleReportData ? (
            <SaleReportView
              sale={saleReportData.sale}
              reportType={saleReportData.type}
              onBack={() => {
                setShowSaleReport(false);
                setSaleReportData(null);
              }}
            />
          ) : showReport ? (
            <ReportView
              key={reportProjectId || Date.now()}
              customer={reportData?.customer || store.customer}
              equipment={reportData?.equipment || store.equipment}
              onBack={() => {
                setShowReport(false);
                setReportProjectId(null);
                setReportData(null);
              }}
              overrideOrderNumber={reportData?.orderNumber}
              overridePaymentDate={reportData?.paymentDate}
              reportType={reportType}
            />
          ) : (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  variant="scrollable"
                  scrollButtons="auto"
                  indicatorColor="primary"
                  textColor="primary"
                  aria-label="solar app tabs"
                >
                  {visibleTabs.map((tab) => (
                    <Tab key={tab.key} label={tab.label} />
                  ))}
                </Tabs>
              </Paper>

              {visibleTabs.map((tab, index) => (
                <TabPanel key={tab.key} value={activeTab} index={index}>
                  {renderTabPanel(tab)}
                </TabPanel>
              ))}
            </Container>
          )}
      </Box>

      {/* Admin Password Dialog */}
      <Dialog open={adminDialogOpen} onClose={adminSubmitting ? undefined : handleAdminDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Accès Administrateur</DialogTitle>
        <DialogContent>
          {adminError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {adminError}
            </Alert>
          )}
          <Box component="form" onSubmit={(event) => { event.preventDefault(); void handleAdminLogin(); }}>
          <TextField
            autoFocus
            fullWidth
            label="Mot de passe"
            type={showAdminPassword ? 'text' : 'password'}
            value={adminPassword}
            onChange={(e) => {
              setAdminPassword(e.target.value);
              setAdminError('');
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setShowAdminPassword((value) => !value)} aria-label="Afficher ou masquer le mot de passe">
                      {showAdminPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mt: 1 }}
          />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAdminDialogClose} disabled={adminSubmitting}>Annuler</Button>
          <Button variant="contained" onClick={() => void handleAdminLogin()} disabled={adminSubmitting || !adminPassword.trim()}>
            {adminSubmitting ? 'Connexion...' : 'Valider'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
