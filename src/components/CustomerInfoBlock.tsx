import React from 'react';
import { Box, Typography } from '@mui/material';
import { CustomerInfo } from '../types';
import { CUSTOMER_FIELDS, displayFieldValue, getCustomCustomerFields } from '../utils/customer';

interface CustomerInfoBlockProps {
  customer: CustomerInfo | null | undefined;
}

/**
 * Affiche les informations du client dans un zone encadrée.
 * Utilise le registre CUSTOMER_FIELDS et remplace les valeurs absentes par
 * un placeholder (ex: « ? ») : aucune ligne n'est laissée vide de façon incohérente.
 */
const CustomerInfoBlock: React.FC<CustomerInfoBlockProps> = ({ customer }) => (
  <Box sx={{ border: '1px solid #000', p: 2, mb: 3, mt: 1 }}>
    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.9rem' }}>
      CLIENT :
    </Typography>
    {CUSTOMER_FIELDS.map((field) => {
      const value = customer?.[field.key];
      // Les champs obligatoires restent visibles ; les champs facultatifs vides
      // ne créent plus d'espaces artificiels dans le document.
      if (!field.required && (value === undefined || value === null || String(value).trim() === '')) return null;
      return (
        <Typography key={field.key} variant="body2" sx={{ fontSize: '0.85rem' }}>
          {(customer?._fieldLabels?.[field.key] || field.printLabel)} : {displayFieldValue(customer, field.key)}
        </Typography>
      );
    })}
    {getCustomCustomerFields(customer).map((field) => (
      <Typography key={field.key} variant="body2" sx={{ fontSize: '0.85rem' }}>
        {field.label} : {displayFieldValue(customer, field.key)}
      </Typography>
    ))}
  </Box>
);

export default CustomerInfoBlock;
