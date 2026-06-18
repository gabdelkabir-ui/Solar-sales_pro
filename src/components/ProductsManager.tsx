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
import { PRODUCT_CATALOG } from '../constants/products';

const CATEGORY_LABELS: Record<string, string> = {
  panel: 'Panneau solaire',
  battery: 'Batterie',
  inverter: 'Onduleur',
};

const CATEGORY_COLORS: Record<string, string> = {
  panel: '#1976d2',
  battery: '#2e7d32',
  inverter: '#f57c00',
};

const ProductsManager: React.FC = () => {
  const theme = useTheme();
  const products = PRODUCT_CATALOG;

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
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
              Catalogue produits
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
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
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell><strong>Catégorie</strong></TableCell>
                <TableCell><strong>Marque</strong></TableCell>
                <TableCell align="center"><strong>Puissance (W)</strong></TableCell>
                <TableCell align="center"><strong>Capacité (Wh)</strong></TableCell>
                <TableCell align="center"><strong>Extensible</strong></TableCell>
                <TableCell align="right"><strong>Prix (MAD)</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product.id} 
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: theme.palette.action.hover },
                    transition: 'background 0.2s ease',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={CATEGORY_LABELS[product.category] || product.category}
                      size="small"
                      sx={{
                        bgcolor: CATEGORY_COLORS[product.category] || '#999',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: 2,
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell align="center">
                    {product.outputPowerW ? (
                      <Chip 
                        label={`${product.outputPowerW} W`} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {product.capacityWh ? (
                      <Chip 
                        label={`${(product.capacityWh / 1000).toFixed(2)} kWh`} 
                        size="small" 
                        variant="outlined"
                        color="secondary"
                        sx={{ fontWeight: 500 }}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {product.expandable ? (
                      <Chip label="Oui" size="small" color="success" variant="filled" />
                    ) : (
                      <Chip label="Non" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                    {formatPrice(product.priceMad)}
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

export default ProductsManager;