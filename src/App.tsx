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
  Alert
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import theme from './theme';
import CustomerForm from './components/CustomerForm';
import EquipmentCalculator from './components/EquipmentCalculator';
import Dashboard from './components/Dashboard';
import RecommendationView from './components/RecommendationView';
import ReportView from './components/ReportView';
import SavedProjects from './components/SavedProjects';
import ProductsManager from './components/ProductsManager';
import EquipmentManager from './components/EquipmentManager';
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
  { label: 'Tableau de bord', key: 'dashboard', adminOnly: false },
  { label: 'Recommandation', key: 'recommendation', adminOnly: false },
  { label: 'Produits', key: 'products', adminOnly: true },
  { label: 'Équipements', key: 'equipment', adminOnly: true },
  { label: 'Projets', key: 'projects', adminOnly: true },
  { label: 'Rapport', key: 'report', adminOnly: false },
];

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState(false);
  const store = useProjectStore();

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

  const handleAdminClick = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setActiveTab(0);
    } else {
      setAdminDialogOpen(true);
      setAdminPassword('');
      setAdminError(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'telco') {
      setIsAdmin(true);
      setAdminDialogOpen(false);
      setAdminPassword('');
      setAdminError(false);
    } else {
      setAdminError(true);
      setAdminPassword('');
    }
  };

  const handleAdminDialogClose = () => {
    setAdminDialogOpen(false);
    setAdminPassword('');
    setAdminError(false);
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
      case 'dashboard':
        return (
          <Dashboard 
            equipment={store.equipment}
            onNext={() => setActiveTab(3)}
          />
        );
      case 'recommendation':
        return (
          <RecommendationView 
            equipment={store.equipment}
            customer={store.customer}
            onNext={() => setActiveTab(7)}
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
      case 'projects':
        return <SavedProjects />;
      case 'report':
        return (
          <ReportView 
            customer={store.customer}
            equipment={store.equipment}
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
      </Box>

      {/* Admin Password Dialog */}
      <Dialog open={adminDialogOpen} onClose={handleAdminDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Accès Administrateur</DialogTitle>
        <DialogContent>
          {adminError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Mot de passe incorrect. Veuillez réessayer.
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Mot de passe"
            type="password"
            value={adminPassword}
            onChange={(e) => {
              setAdminPassword(e.target.value);
              setAdminError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdminLogin();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAdminDialogClose}>Annuler</Button>
          <Button variant="contained" onClick={handleAdminLogin}>
            Valider
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;