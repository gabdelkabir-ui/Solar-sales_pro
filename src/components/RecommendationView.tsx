import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Button,
  Divider,
  Stack
} from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BoltIcon from '@mui/icons-material/Bolt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { SelectedEquipment } from '../types';
import { calculateConsumption, getSolarRecommendation } from '../utils/solarCalculations';

interface RecommendationViewProps {
  equipment: SelectedEquipment[];
  onNext: () => void;
}

const RecommendationView: React.FC<RecommendationViewProps> = ({ equipment, onNext }) => {
  const { dailyKWh, totalPower } = calculateConsumption(equipment);
  const rec = getSolarRecommendation(dailyKWh, totalPower);

  const recommendationCards = [
    {
      title: 'Solar Panel Array',
      icon: <SolarPowerIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      specs: [
        { label: 'Total Power', value: `${rec.panelPower} Wp` },
        { label: 'Quantity', value: `${rec.panelCount} units` },
        { label: 'Panel Model', value: rec.panelModel },
      ],
      color: 'primary.main'
    },
    {
      title: 'Lithium Battery Storage',
      icon: <BatteryChargingFullIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      specs: [
        { label: 'Capacity', value: `${rec.batteryCapacity} kWh` },
        { label: 'Battery Model', value: rec.batteryModel },
        { label: 'Est. Autonomy', value: `${rec.autonomyDays} Day(s)` },
      ],
      color: 'secondary.main'
    },
    {
      title: 'Hybrid Inverter',
      icon: <BoltIcon sx={{ fontSize: 40, color: '#fbc02d' }} />,
      specs: [
        { label: 'Inverter Power', value: `${rec.inverterPower} W` },
        { label: 'Type', value: rec.inverterModel },
        { label: 'Safety Margin', value: '25% included' },
      ],
      color: '#fbc02d'
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary">Recommended Solar Solution</Typography>
        <Button 
          variant="contained" 
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
        >
          Generate Report
        </Button>
      </Box>

      <Stack spacing={3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
          {recommendationCards.map((card, index) => (
            <Card key={index} sx={{ height: '100%', position: 'relative' }}>
              <Box sx={{ bgcolor: card.color, height: 4, width: '100%' }} />
              <CardContent sx={{ p: 3 }}>
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
            </Card>
          ))}
        </Box>

        <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" gutterBottom>Expert Sizing Analysis</Typography>
          <Typography variant="body1">
            Based on the calculated daily consumption of <strong>{dailyKWh.toFixed(2)} kWh</strong> and a peak demand of <strong>{totalPower} Watts</strong>, 
            this system is designed to provide 100% of your energy needs with at least 1 day of autonomy. 
            The hybrid inverter allows for both solar and grid support if needed.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default RecommendationView;
