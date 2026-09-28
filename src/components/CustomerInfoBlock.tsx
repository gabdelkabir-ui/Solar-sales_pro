import React from 'react';
import { Box, Typography } from '@mui/material';
import { CustomerInfo } from '../types';

interface CustomerInfoBlockProps {
  customer: CustomerInfo | null | undefined;
}

const empty = '?';

const clean = (value: unknown): string => {
  if (value === undefined || value === null) return empty;
  const text = String(value).trim();
  return text || empty;
};

const buildAddress = (customer: CustomerInfo | null | undefined): string => {
  if (!customer) return empty;
  const parts = [customer.address, customer.postalCode, customer.city]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return parts.length ? parts.join(' - ') : empty;
};

const getContact = (customer: CustomerInfo | null | undefined): string => {
  if (!customer) return empty;
  const fullName = [customer.firstName, customer.contact, customer.dirigeants]
    .map((value) => String(value || '').trim())
    .find(Boolean);
  return fullName || empty;
};

/**
 * Affiche le bloc client du devis / bon de commande selon le modèle Word fourni.
 * Seules les cinq informations demandées sont visibles dans les documents.
 */
const CustomerInfoBlock: React.FC<CustomerInfoBlockProps> = ({ customer }) => (
  <Box sx={{ border: '1px solid #000', p: 2, mb: 3, mt: 1 }}>
    <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.9rem' }}>
      CLIENT :
    </Typography>
    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Contact : {getContact(customer)}</Typography>
    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Raison sociale : {clean(customer?.name)}</Typography>
    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Adresse : {buildAddress(customer)}</Typography>
    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Numéro de téléphone : {clean(customer?.phone)}</Typography>
    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Adresse mail : {clean(customer?.email)}</Typography>
  </Box>
);

export default CustomerInfoBlock;
