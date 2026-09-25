import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  useTheme,
  Fade,
  Zoom,
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
  Tooltip,
  Legend,
} from 'recharts';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightningIcon from '@mui/icons-material/FlashOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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
    value: Math.round((item.quantity * item.power * item.hoursPerDay / 1000) * 100) / 100
  })).sort((a, b) => b.value - a.value);

  const topConsumers = chartData.slice(0, 5);

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#FF6B6B',
    '#845EC2',
  ];

  const statCards = [
    {
      label: 'Puissance totale',
      value: `${totalPower} W`,
      icon: <SettingsIcon />,
      gradient: 'linear-gradient(135deg, #1976d2, #42a5f5)',
      subtitle: 'Pics de consommation',
    },
    {
      label: 'Consommation journalière',
      value: `${dailyKWh.toFixed(2)} kWh`,
      icon: <LightningIcon />,
      gradient: 'linear-gradient(135deg, #f57c00, #ffb74d)',
      subtitle: 'Besoins quotidiens',
    },
    {
      label: 'Consommation mensuelle',
      value: `${monthlyKWh.toFixed(2)} kWh`,
      icon: <CalendarMonthIcon />,
      gradient: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
      subtitle: 'Besoins mensuels',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, borderRadius: 2, boxShadow: theme.shadows[4] }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
          <Typography variant="body2" color="primary">
            {payload[0].value} kWh/jour
          </Typography>
        </Paper>
      );
    }
    return null;
  };

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
              Tableau de bord énergétique
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analyse détaillée de votre consommation électrique
            </Typography>
          </Box>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={onNext}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              boxShadow: theme.shadows[4],
              '&:hover': { boxShadow: theme.shadows[8] },
            }}
          >
            Voir la recommandation
          </Button>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          gap: 3,
          mb: 4
        }}>
          {statCards.map((stat, index) => (
            <Zoom in timeout={300 + index * 100} key={index}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: stat.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}>
                        {stat.icon}
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stat.subtitle}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      background: stat.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          ))}
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3
        }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: theme.shadows[4] },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Répartition de la consommation
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${(name || '').length > 15 ? (name || '').substring(0, 12) + '...' : name || ''} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    paddingAngle={2}
                  >
                    {chartData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke={theme.palette.background.paper}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: theme.shadows[4] },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Principaux consommateurs
              </Typography>
              <TrendingUpIcon color="action" />
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topConsumers}
                  layout="vertical"
                  margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `${value} kWh`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: theme.shadows[4],
                    }}
                    formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(2) : (Number(value) || 0).toFixed(2)} kWh`, 'Consommation']}
                  />
                  <Bar
                    dataKey="value"
                    fill={theme.palette.secondary.main}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={30}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Fade>
  );
};

export default Dashboard;