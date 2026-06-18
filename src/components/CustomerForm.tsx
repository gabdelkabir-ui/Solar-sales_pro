import React from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Grid, 
  Paper, 
  Button,
  Fade,
  useTheme,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotesIcon from '@mui/icons-material/Notes';
import { CustomerInfo } from '../types';

interface CustomerFormProps {
  customer: CustomerInfo;
  setCustomer: (customer: CustomerInfo) => void;
  onNext: () => void;
  isAdmin?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, setCustomer, onNext }) => {
  const theme = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  // Form fields configuration
  const formFields = [
    { name: 'name' as const, label: 'Nom du client', icon: <PersonAddIcon />, required: true, xs: 12, sm: 6 },
    { name: 'phone' as const, label: 'Numéro de téléphone', icon: <PhoneIcon />, required: true, xs: 12, sm: 6 },
    { name: 'city' as const, label: 'Ville / Localisation', icon: <LocationOnIcon />, required: true, xs: 12 },
    { name: 'notes' as const, label: 'Notes', icon: <NotesIcon />, required: false, xs: 12, multiline: true, rows: 4 },
  ];

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 4, 
        borderRadius: 4,
        background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        mb: 4, 
        flexWrap: 'wrap', 
        gap: 2 
      }}>
        <Box>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Informations Client
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: -0.5 }}>
            Saisissez les coordonnées du client
          </Typography>
        </Box>
      </Box>

      <Box component="form" noValidate sx={{ mt: 1 }}>
        <Grid container spacing={3}>
          {formFields.map((field) => (
            <Grid size={{ xs: field.xs, sm: field.sm || 12 }} key={field.name}>
              <TextField
                required={field.required}
                fullWidth
                label={field.label}
                name={field.name}
                value={customer[field.name] || ''}
                onChange={handleChange}
                variant="outlined"
                multiline={field.multiline || false}
                rows={field.rows || 1}
                slotProps={{
                  input: {
                    sx: { borderRadius: 2 },
                  },
                }}
              />
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ 
          mt: 4, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Typography variant="caption" color="text.secondary">
            {customer.name && customer.phone ? '✓ Tous les champs requis sont remplis' : 'Remplissez les champs obligatoires pour continuer'}
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={onNext}
            disabled={!customer.name || !customer.phone}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              boxShadow: theme.shadows[4],
              '&:hover': { boxShadow: theme.shadows[8] },
            }}
          >
            Continuer vers la Calculatrice
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CustomerForm;