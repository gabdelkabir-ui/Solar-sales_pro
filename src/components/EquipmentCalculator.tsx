import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fade,
  Zoom,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import { CATEGORIES, EQUIPMENT_CATALOG } from '../constants/equipment';
import { SelectedEquipment, Equipment } from '../types';
import { getEquipmentIcon } from '../utils/equipmentIcons';

interface EquipmentCalculatorProps {
  equipment: SelectedEquipment[];
  addEquipment: (item: Equipment) => void;
  removeEquipment: (instanceId: string) => void;
  updateEquipment: (instanceId: string, updates: Partial<SelectedEquipment>) => void;
  onNext: () => void;
}

const EquipmentCalculator: React.FC<EquipmentCalculatorProps> = ({ 
  equipment, 
  addEquipment, 
  removeEquipment, 
  updateEquipment,
  onNext 
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);

  const catalog = EQUIPMENT_CATALOG;

  const catalogBySubCategory = useMemo(() => {
    const subCategories = [...new Set(
      catalog
        .filter(item => item.category === selectedCategory)
        .map(item => item.subCategory)
    )];
    
    const filtered = catalog.filter(item => 
      item.category === selectedCategory &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const activeSubCategories = searchTerm 
      ? [...new Set(filtered.map(item => item.subCategory))]
      : subCategories;
    
    const grouped: Record<string, Equipment[]> = {};
    activeSubCategories.forEach(sub => {
      const items = filtered.filter(item => item.subCategory === sub);
      if (!searchTerm) {
        const autreId = 'autre_' + sub.replace(/[^a-zA-Z0-9]/g, '_');
        items.push({
          id: autreId,
          name: 'Autre (spécifier)',
          defaultPower: 0,
          icon: 'AddCircleOutline',
          category: selectedCategory as any,
          subCategory: sub,
        });
      }
      grouped[sub] = items;
    });
    return grouped;
  }, [selectedCategory, searchTerm, catalog]);

  const getCategoryShort = (cat: string) => {
    return cat.replace(/^\d+\.\s*/, '').split('&')[0].trim();
  };

  return (
    <Fade in timeout={500}>
      <Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
          {/* Catalog Section */}
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              height: 'fit-content',
              position: 'sticky',
              top: 20,
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: theme.palette.primary.main,
              }}
            >
              Catalogue d'équipements
            </Typography>
            
            {/* Category Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                Catégorie
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    label={getCategoryShort(cat)}
                    size="small"
                    variant={selectedCategory === cat ? 'filled' : 'outlined'}
                    color={selectedCategory === cat ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory(cat)}
                    sx={{ 
                      mb: 0.5,
                      borderRadius: 2,
                      fontWeight: selectedCategory === cat ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher un équipement..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 },
                },
              }}
            />
            
            <Box sx={{ maxHeight: '55vh', overflow: 'auto', pr: 1 }}>
              {Object.entries(catalogBySubCategory).map(([subCategory, items]) => (
                <Accordion 
                  key={subCategory} 
                  defaultExpanded 
                  sx={{ 
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />} 
                    sx={{ 
                      minHeight: 40, 
                      py: 0,
                      bgcolor: theme.palette.action.hover,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {subCategory}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ py: 1, px: 0.5 }}>
                    <List dense disablePadding>
                      {items.map((item) => (
                        <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                          <Button
                            fullWidth
                            size="small"
                            variant="text"
                            startIcon={<AddCircleIcon fontSize="small" color="primary" />}
                            onClick={() => addEquipment(item)}
                            sx={{ 
                              justifyContent: 'flex-start', 
                              py: 0.75, 
                              px: 1.5, 
                              textTransform: 'none', 
                              fontSize: '0.85rem',
                              borderRadius: 2,
                              '&:hover': {
                                bgcolor: theme.palette.action.selected,
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                              {getEquipmentIcon(item.icon, 18)}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.name}
                                </Typography>
                                <Chip 
                                  label={`${item.defaultPower}W`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              </Box>
                            </Box>
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
              {Object.keys(catalogBySubCategory).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
                  Aucun équipement trouvé.
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Selected Equipment Section */}
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              minHeight: '60vh',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              flexWrap: 'wrap',
              gap: 1,
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  Équipements sélectionnés
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {equipment.length} équipement{equipment.length > 1 ? 's' : ''}
                </Typography>
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={onNext}
                disabled={equipment.length === 0}
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1,
                  textTransform: 'none',
                  boxShadow: theme.shadows[2],
                  '&:hover': { boxShadow: theme.shadows[6] },
                }}
              >
                Voir le tableau de bord
              </Button>
            </Box>
            
            {equipment.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 10,
              }}>
                <AddCircleIcon sx={{ fontSize: 64, color: theme.palette.action.disabled, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Aucun équipement ajouté
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sélectionnez depuis le catalogue à gauche
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {equipment.map((item, index) => (
                  <Zoom in timeout={200 + index * 50} key={item.instanceId}>
                    <Card 
                      sx={{ 
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: theme.shadows[4],
                          borderColor: theme.palette.primary.light,
                        },
                      }}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr 1.5fr' }, 
                          gap: 2, 
                          alignItems: 'center',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {getEquipmentIcon(item.icon, 24)}
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.subCategory}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <TextField
                            label="Qté"
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => updateEquipment(item.instanceId, { quantity: parseInt(e.target.value) || 0 })}
                            slotProps={{
                              input: { 
                                sx: { borderRadius: 2 },
                                inputProps: { min: 0 }
                              },
                            }}
                          />
                          
                          <TextField
                            label="Watts"
                            type="number"
                            size="small"
                            value={item.power}
                            onChange={(e) => updateEquipment(item.instanceId, { power: parseInt(e.target.value) || 0 })}
                            slotProps={{
                              input: { 
                                sx: { borderRadius: 2 },
                                inputProps: { min: 0 }
                              },
                            }}
                          />
                          
                          <TextField
                            label="h/jour"
                            type="number"
                            size="small"
                            value={item.hoursPerDay}
                            onChange={(e) => updateEquipment(item.instanceId, { hoursPerDay: parseFloat(e.target.value) || 0 })}
                            slotProps={{
                              input: { 
                                sx: { borderRadius: 2 },
                                inputProps: { min: 0, step: 0.5 }
                              },
                            }}
                          />
                          
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                          }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Par jour
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                {(item.quantity * item.power * item.hoursPerDay / 1000).toFixed(2)} kWh
                              </Typography>
                            </Box>
                            <IconButton 
                              color="error" 
                              onClick={() => removeEquipment(item.instanceId)}
                              sx={{ 
                                '&:hover': { 
                                  bgcolor: theme.palette.error.light + '20',
                                },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Zoom>
                ))}
              </Stack>
            )}
          </Paper>
        </Box>
      </Box>
    </Fade>
  );
};

export default EquipmentCalculator;