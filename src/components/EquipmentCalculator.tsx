import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import { EQUIPMENT_CATALOG } from '../constants/equipment';
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

  const filteredCatalog = EQUIPMENT_CATALOG.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
      {/* Catalog Section */}
      <Paper sx={{ p: 2, height: 'fit-content' }}>
        <Typography variant="h6" gutterBottom color="primary">
          Equipment Catalog
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search appliances..."
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
        <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          {filteredCatalog.map((item) => (
            <ListItem 
              key={item.id}
              disablePadding
              sx={{ mb: 1 }}
            >
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddCircleIcon />}
                onClick={() => addEquipment(item)}
                sx={{ justifyContent: 'flex-start', py: 1 }}
              >
                {item.name} ({item.defaultPower}W)
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Selected Equipment Section */}
      <Paper sx={{ p: 2, minHeight: '60vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {item.name}
                    </Typography>
                    
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
  );
};

export default EquipmentCalculator;
