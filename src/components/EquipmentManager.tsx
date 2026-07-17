import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Fade,
  useTheme,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import { EQUIPMENT_CATALOG } from '../constants/equipment';
import { getEquipmentIcon } from '../utils/equipmentIcons';

const EquipmentManager: React.FC = () => {
  const theme = useTheme();
  const items = EQUIPMENT_CATALOG;

  const getShortCategory = (cat: string) => {
    return cat.replace(/^\d+\.\s*/, '').split('&')[0].trim();
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
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle', WebkitTextFillColor: theme.palette.primary.main }} />
              Catalogue d'équipements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {items.length} équipement{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>

        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                <TableCell width={50}><strong>Icône</strong></TableCell>
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell align="center"><strong>Puissance (W)</strong></TableCell>
                <TableCell><strong>Catégorie</strong></TableCell>
                <TableCell><strong>Sous-catégorie</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow 
                  key={item.id} 
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: theme.palette.action.hover },
                    transition: 'background 0.2s ease',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getEquipmentIcon(item.icon, 24)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${item.defaultPower} W`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {getShortCategory(item.category)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {item.subCategory}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Fade>
  );
};


export default EquipmentManager;