import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Button,
  useTheme
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip
} from 'recharts';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightningIcon from '@mui/icons-material/FlashOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import { SelectedEquipment } from '../types';
import { calculateConsumption } from '../utils/solarCalculations';

interface DashboardProps {
  equipment: SelectedEquipment[];
  onNext: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ equipment, onNext }) => {
  const theme = useTheme();
  const { totalPower, dailyKWh, monthlyKWh } = calculateConsumption(equipment);

  const chartData = equipment.map(item => ({
    name: item.name,
    value: item.quantity * item.power * item.hoursPerDay / 1000
  })).sort((a, b) => b.value - a.value);

  const topConsumers = chartData.slice(0, 5);

  const COLORS = [
    theme.palette.primary.main, 
    theme.palette.secondary.main, 
    '#0088FE', 
    '#00C49F', 
    '#FFBB28', 
    '#FF8042'
  ];

  const statCards = [
    { label: 'Total Power', value: `${totalPower} W`, icon: <SettingsIcon />, color: '#1976d2' },
    { label: 'Daily Consumption', value: `${dailyKWh.toFixed(2)} kWh`, icon: <LightningIcon />, color: '#f57c00' },
    { label: 'Monthly Consumption', value: `${monthlyKWh.toFixed(2)} kWh`, icon: <CalendarMonthIcon />, color: '#2e7d32' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary">Energy Dashboard</Typography>
        <Button 
          variant="contained" 
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
        >
          See Solar Recommendation
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        {statCards.map((stat, index) => (
          <Card key={index} sx={{ borderLeft: `6px solid ${stat.color}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ color: stat.color, mr: 1, display: 'flex' }}>
                  {stat.icon}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Consumption Breakdown (kWh)</Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Top Energy Consumers (Daily kWh)</Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topConsumers} layout="vertical" margin={{ left: 20, right: 30 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill={theme.palette.secondary.main} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
