import React, { useState } from 'react';
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
  Button
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import theme from './theme';
import CustomerForm from './components/CustomerForm';
import EquipmentCalculator from './components/EquipmentCalculator';
import Dashboard from './components/Dashboard';
import RecommendationView from './components/RecommendationView';
import ReportView from './components/ReportView';
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

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const store = useProjectStore();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
              startIcon={<RestartAltIcon />}
              onClick={() => {
                if(confirm("Are you sure you want to reset all data?")) {
                  store.resetProject();
                }
              }}
            >
              Reset
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
              <Tab label="Customer" />
              <Tab label="Calculator" />
              <Tab label="Dashboard" />
              <Tab label="Recommendation" />
              <Tab label="Report" />
            </Tabs>
          </Paper>

          <TabPanel value={activeTab} index={0}>
            <CustomerForm 
              customer={store.customer} 
              setCustomer={store.setCustomer} 
              onNext={() => setActiveTab(1)}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <EquipmentCalculator 
              equipment={store.equipment}
              addEquipment={store.addEquipment}
              removeEquipment={store.removeEquipment}
              updateEquipment={store.updateEquipment}
              onNext={() => setActiveTab(2)}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <Dashboard 
              equipment={store.equipment}
              onNext={() => setActiveTab(3)}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <RecommendationView 
              equipment={store.equipment}
              onNext={() => setActiveTab(4)}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            <ReportView 
              customer={store.customer}
              equipment={store.equipment}
            />
          </TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
