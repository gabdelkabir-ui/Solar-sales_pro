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
  AccordionDetails
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { EQUIPMENT_CATALOG, CATEGORIES } from '../constants/equipment';
import { SelectedEquipment, Equipment } from '../types';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);

  // Group catalog by subcategory within the selected category
  const catalogBySubCategory = useMemo(() => {
    const filtered = EQUIPMENT_CATALOG.filter(item => 
      item.category === selectedCategory &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const grouped: Record<string, Equipment[]> = {};
    filtered.forEach(item => {
      if (!grouped[item.subCategory]) {
        grouped[item.subCategory] = [];
      }
      grouped[item.subCategory].push(item);
    });
    return grouped;
  }, [selectedCategory, searchTerm]);

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Catalog Section */}
        <Paper sx={{ p: 2, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom color="primary">
            Equipment Catalog
          </Typography>
          
          {/* Category Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Category
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={cat.replace(/^\d+\.\s*/, '').split('&')[0].trim()}
                  size="small"
                  variant={selectedCategory === cat ? 'filled' : 'outlined'}
                  color={selectedCategory === cat ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(cat)}
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Box>
          </Box>

          <TextField
            fullWidth
            size="small"
            placeholder="Search equipment..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }
            }}
          />
          
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {Object.entries(catalogBySubCategory).map(([subCategory, items]) => (
              <Accordion key={subCategory} defaultExpanded sx={{ '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, py: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                    {subCategory}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ py: 0, px: 1 }}>
                  <List dense disablePadding>
                    {items.map((item) => (
                      <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="text"
                          startIcon={<AddCircleIcon fontSize="small" />}
                          onClick={() => addEquipment(item)}
                          sx={{ justifyContent: 'flex-start', py: 0.5, px: 1, textTransform: 'none', fontSize: '0.85rem' }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', ml: 1 }}>
                            <span>{item.name}</span>
                            <span style={{ fontWeight: 'bold', marginLeft: 8 }}>{item.defaultPower}W</span>
                          </Box>
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
            {Object.keys(catalogBySubCategory).length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No equipment found.
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Selected Equipment Section */}
        <Paper sx={{ p: 2, minHeight: '60vh' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" color="primary">
              Selected Equipment ({equipment.length})
            </Typography>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={onNext}
              disabled={equipment.length === 0}
            >
              View Dashboard
            </Button>
          </Box>
          
          {equipment.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <Typography color="text.secondary">No equipment added yet.</Typography>
              <Typography variant="body2" color="text.secondary">Select from the catalog on the left.</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {equipment.map((item) => (
                <Card key={item.instanceId} sx={{ bgcolor: 'background.default' }}>
                  <CardContent sx={{ py: '12px !important' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr 1.5fr' }, gap: 2, alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.subCategory}
                        </Typography>
                      </Box>
                      
                      <TextField
                        label="Qty"
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => updateEquipment(item.instanceId, { quantity: parseInt(e.target.value) || 0 })}
                      />
                      
                      <TextField
                        label="Watts"
                        type="number"
                        size="small"
                        value={item.power}
                        onChange={(e) => updateEquipment(item.instanceId, { power: parseInt(e.target.value) || 0 })}
                      />
                      
                      <TextField
                        label="Hrs/Day"
                        type="number"
                        size="small"
                        value={item.hoursPerDay}
                        onChange={(e) => updateEquipment(item.instanceId, { hoursPerDay: parseFloat(e.target.value) || 0 })}
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Box sx={{ mr: 1, textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ display: 'block' }}>Daily</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {(item.quantity * item.power * item.hoursPerDay / 1000).toFixed(2)} kWh
                          </Typography>
                        </Box>
                        <IconButton color="error" onClick={() => removeEquipment(item.instanceId)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default EquipmentCalculator;
