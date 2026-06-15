import React from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Grid, 
  Paper, 
  Button 
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { CustomerInfo } from '../types';

interface CustomerFormProps {
  customer: CustomerInfo;
  setCustomer: (customer: CustomerInfo) => void;
  onNext: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, setCustomer, onNext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom color="primary">
        Customer Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Enter the customer's details to start the consultation.
      </Typography>

      <Box component="form" noValidate sx={{ mt: 1 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Customer Name"
              name="name"
              value={customer.name}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Phone Number"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              required
              fullWidth
              label="City / Location"
              name="city"
              value={customer.city}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              multiline
              rows={4}
              value={customer.notes}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={onNext}
            disabled={!customer.name || !customer.phone}
          >
            Continue to Calculator
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default CustomerForm;
