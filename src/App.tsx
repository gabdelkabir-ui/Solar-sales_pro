import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Fade,
  Badge,
  Tooltip,
  IconButton,
  Avatar,
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import CalculateIcon from '@mui/icons-material/Calculate';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RecommendIcon from '@mui/icons-material/Recommend';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import CloseIcon from '@mui/icons-material/Close';
import theme from './theme';
import CustomerForm from './components/CustomerForm';
import EquipmentCalculator from './components/EquipmentCalculator';
import EnergySimulation from './components/EnergySimulation';
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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in timeout={400}>
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
}

const tabConfigs = [
  { 
    label: 'Client', 
    key: 'customer', 
    adminOnly: false,
    icon: <PersonIcon />,
    description: 'Informations du client'
  },
  { 
    label: 'Calculatrice', 
    key: 'calculator', 
    adminOnly: false,
    icon: <CalculateIcon />,
    description: 'Ajoutez vos équipements'
  },
  { 
    label: 'Simulation Énergétique', 
    key: 'energy', 
    adminOnly: false,
    icon: <ElectricBoltIcon />,
    description: 'Analyse tarifaire'
  },
  { 
    label: 'Tableau de bord', 
    key: 'dashboard', 
    adminOnly: false,
    icon: <DashboardIcon />,
    description: 'Analyse de consommation'
  },
  { 
    label: 'Recommandation', 
    key: 'recommendation', 
    adminOnly: false,
    icon: <RecommendIcon />,
    description: 'Solution solaire proposée'
  },
  { 
    label: 'Produits', 
    key: 'products', 
    adminOnly: true,
    icon: <InventoryIcon />,
    description: 'Gestion du catalogue'
  },
  { 
    label: 'Équipements', 
    key: 'equipment', 
    adminOnly: true,
    icon: <BuildIcon />,
    description: 'Gestion des équipements'
  },
  { 
    label: 'Projets', 
    key: 'projects', 
    adminOnly: true,
    icon: <FolderIcon />,
    description: 'Projets enregistrés'
  },
  { 
    label: 'Rapport', 
    key: 'report', 
    adminOnly: false,
    icon: <DescriptionIcon />,
    description: 'Rapport final'
  },
];

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState(false);
  const adminPasswordRef = useRef(adminPassword);
  // Keep the ref in sync with state
  adminPasswordRef.current = adminPassword;
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<'bon-de-commande' | 'facture'>('bon-de-commande');
  const [reportProjectId, setReportProjectId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<{ orderNumber: string; paymentDate: string; customer: any; equipment: any[] } | null>(null);
  const store = useProjectStore();

  const visibleTabs = tabConfigs.filter(t => isAdmin || !t.adminOnly);

  // Clamp activeTab if it exceeds visible tabs count
  useEffect(() => {
    if (activeTab >= visibleTabs.length) {
      setActiveTab(0);
    }
  }, [visibleTabs.length, activeTab]);

  // Update tab when admin mode changes to show the first non-admin tab
  useEffect(() => {
    if (!isAdmin && activeTab >= visibleTabs.length) {
      setActiveTab(0);
    }
  }, [isAdmin, visibleTabs.length, activeTab]);

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

  const handleAdminLogin = useCallback(() => {
    if (adminPasswordRef.current === 'telco') {
      setIsAdmin(true);
      setAdminDialogOpen(false);
      setAdminPassword('');
      setAdminError(false);
    } else {
      setAdminError(true);
      setAdminPassword('');
    }
  }, []);

  const handleAdminDialogClose = () => {
    setAdminDialogOpen(false);
    setAdminPassword('');
    setAdminError(false);
  };

  const handleReset = () => {
    setResetDialogOpen(true);
  };

  const confirmReset = () => {
    store.resetProject();
    setResetDialogOpen(false);
    setActiveTab(0);
  };

  const handleGenerateReportFromProject = (projectId: number, type: 'bon-de-commande' | 'facture' = 'bon-de-commande') => {
    try {
      const saved = localStorage.getItem('solar_saved_projects');
      if (saved) {
        const projects = JSON.parse(saved);
        const project = projects.find((p: any) => p.id === projectId);
        if (project) {
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
        }
      }
    } catch (err) {
      console.error('Failed to load project for report:', err);
    }
  };

  const handleGenerateInvoiceFromProject = (projectId: number) => {
    handleGenerateReportFromProject(projectId, 'facture');
  };

  const handleViewSimulation = (projectId: number) => {
    try {
      const saved = localStorage.getItem('solar_saved_projects');
      if (saved) {
        const projects = JSON.parse(saved);
        const project = projects.find((p: any) => p.id === projectId);
        if (project) {
          store.loadProject({
            customer: project.customer,
            equipment: project.equipment || [],
            orderNumber: project.orderNumber || undefined,
            paymentDate: project.paymentDate || undefined,
            recommendation: project.recommendation || undefined,
          });
          setActiveTab(2); // Go to Energy Simulation tab
        }
      }
    } catch (err) {
      console.error('Failed to load project for simulation:', err);
    }
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
      case 'projects':
        return (
          <SavedProjects 
            onGenerateReport={(id) => handleGenerateReportFromProject(id, 'bon-de-commande')}
            onGenerateInvoice={handleGenerateInvoiceFromProject}
            onViewSimulation={handleViewSimulation}
          />
        );
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

  // Count equipment and check if customer info is filled
  const equipmentCount = store.equipment.length;
  const hasCustomer = !!(store.customer.name && store.customer.phone);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        flexGrow: 1, 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* App Bar */}
        <AppBar 
          position="sticky" 
          color="primary" 
          elevation={0}
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(20px)',
            backgroundColor: theme.palette.primary.main + 'f0',
          }}
        >
          <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Avatar 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  width: 40, 
                  height: 40,
                  mr: 1.5,
                }}
              >
                <SolarPowerIcon sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Solar Sales Pro
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.8,
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  Calculateur solaire professionnel
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {/* Quick stats - show on larger screens */}
              <Box sx={{ 
                display: { xs: 'none', md: 'flex' }, 
                alignItems: 'center', 
                gap: 2,
                mr: 1,
                px: 2,
                py: 0.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
              }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {hasCustomer ? '✓ Client' : '✗ Client'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {equipmentCount > 0 ? `${equipmentCount} équipement${equipmentCount > 1 ? 's' : ''}` : '0 équipements'}
                </Typography>
              </Box>

              <Tooltip title={isAdmin ? 'Désactiver le mode Admin' : 'Activer le mode Admin'}>
                <Button 
                  color="inherit" 
                  startIcon={<AdminPanelSettingsIcon />}
                  onClick={handleAdminClick}
                  sx={{ 
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: isAdmin ? 600 : 400,
                    bgcolor: isAdmin ? 'rgba(255,215,0,0.2)' : 'transparent',
                    '&:hover': {
                      bgcolor: isAdmin ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {isAdmin ? 'Admin' : 'Admin'}
                  {isAdmin && (
                    <Badge 
                      color="warning" 
                      variant="dot" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Button>
              </Tooltip>

              <Tooltip title="Réinitialiser toutes les données">
                <IconButton 
                  color="inherit" 
                  onClick={handleReset}
                  sx={{ 
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
          {showReport ? (
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
            <>
              {/* Tabs */}
              <Paper 
                sx={{ 
                  width: '100%', 
                  mb: 3,
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[1],
                }}
              >
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  variant="scrollable"
                  scrollButtons="auto"
                  indicatorColor="primary"
                  textColor="primary"
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 56,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                      },
                      '&.Mui-selected': {
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                      },
                    },
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderTopLeftRadius: 3,
                      borderTopRightRadius: 3,
                    },
                  }}
                >
                  {visibleTabs.map((tab, index) => (
                    <Tab 
                      key={tab.key} 
                      label={tab.label} 
                      icon={
                        <Box 
                          component="span" 
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 0.5,
                          }}
                        >
                          {tab.icon}
                        </Box>
                      }
                      iconPosition="start"
                      id={`tab-${index}`}
                      aria-controls={`tabpanel-${index}`}
                      sx={{
                        '& .MuiTab-iconWrapper': {
                          fontSize: '1.1rem',
                        },
                      }}
                    />
                  ))}
                </Tabs>
              </Paper>

              {/* Tab Panels */}
              {visibleTabs.map((tab, index) => (
                <TabPanel key={tab.key} value={activeTab} index={index}>
                  {renderTabPanel(tab)}
                </TabPanel>
              ))}
            </>
          )}
        </Container>

        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 2, 
            textAlign: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Solar Sales Pro — Version 2.0
          </Typography>
        </Box>
      </Box>

      {/* Admin Password Dialog */}
      <Dialog 
        open={adminDialogOpen} 
        onClose={handleAdminDialogClose} 
        maxWidth="xs" 
        fullWidth
        slotProps={{
          paper: {
            sx: { 
              borderRadius: 4, 
              p: 1,
              boxShadow: theme.shadows[8],
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettingsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Accès Administrateur
            </Typography>
          </Box>
          <IconButton onClick={handleAdminDialogClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {adminError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                '& .MuiAlert-icon': { alignItems: 'center' },
              }}
            >
              Mot de passe incorrect. Veuillez réessayer.
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Entrez le mot de passe administrateur pour accéder aux fonctionnalités de gestion.
          </Typography>
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
            sx={{ 
              mt: 0.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleAdminDialogClose}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAdminLogin}
            type="button"
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              px: 4,
            }}
          >
            Valider
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog 
        open={resetDialogOpen} 
        onClose={() => setResetDialogOpen(false)}
        slotProps={{
          paper: {
            sx: { 
              borderRadius: 4, 
              p: 1,
              boxShadow: theme.shadows[8],
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          <RestartAltIcon sx={{ mr: 1, verticalAlign: 'middle', color: theme.palette.warning.main }} />
          Réinitialiser toutes les données
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir réinitialiser toutes les données du projet ?
            Cette action est irréversible.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.warning.light + '20', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              ⚠️ Cela supprimera : les informations client, les équipements sélectionnés,
              et toutes les données du projet en cours.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setResetDialogOpen(false)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={confirmReset}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none',
              px: 4,
            }}
          >
            Réinitialiser
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;