import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CustomerInfo, SelectedEquipment, ProductRecommendation } from '../types';
import { calculateConsumption } from '../utils/solarCalculations';
import { getRecommendationFromProducts } from '../utils/productsApi';

interface ReportViewProps {
  customer: CustomerInfo;
  equipment: SelectedEquipment[];
}

const ReportView: React.FC<ReportViewProps> = ({ customer, equipment }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [rec, setRec] = useState<ProductRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const { totalPower, dailyKWh, monthlyKWh } = calculateConsumption(equipment);

  const loadRecommendation = useCallback(async () => {
    setLoading(true);
    const result = await getRecommendationFromProducts(dailyKWh, totalPower);
    if (result) setRec(result);
    setLoading(false);
  }, [dailyKWh, totalPower]);

  useEffect(() => {
    loadRecommendation();
  }, [loadRecommendation]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Proposition_Solaire_${customer.name.replace(/\s+/g, '_')}.pdf`);
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end', '@media print': { display: 'none' } }}>
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />} 
          onClick={handlePrint}
        >
          Imprimer le rapport
        </Button>
        <Button 
          variant="contained" 
          startIcon={<PictureAsPdfIcon />} 
          onClick={handleExportPdf}
        >
          Exporter en PDF
        </Button>
      </Box>

      <Paper 
        ref={reportRef} 
        elevation={0} 
        sx={{ 
          p: 6, 
          border: '1px solid #e0e0e0',
          maxWidth: '850px',
          margin: '0 auto',
          backgroundColor: '#fff'
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>SOLAR SALES PRO</Typography>
            <Typography variant="subtitle1" color="text.secondary">Proposition solaire personnalisée</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2">Date : {format(new Date(), 'dd MMMM yyyy')}</Typography>
            <Typography variant="body2">Proposition n° : {Math.floor(Math.random() * 100000)}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Customer & Summary Info */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
          <Box>
            <Typography variant="h6" gutterBottom>Informations client</Typography>
            <Typography variant="body1"><strong>Nom :</strong> {customer.name || 'N/A'}</Typography>
            <Typography variant="body1"><strong>Téléphone :</strong> {customer.phone || 'N/A'}</Typography>
            <Typography variant="body1"><strong>Ville :</strong> {customer.city || 'N/A'}</Typography>
            {customer.notes && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary"><strong>Notes :</strong> {customer.notes}</Typography>
              </Box>
            )}
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>Résumé de consommation</Typography>
            <Typography variant="body1"><strong>Puissance de pointe :</strong> {totalPower} W</Typography>
            <Typography variant="body1"><strong>Consommation journalière :</strong> {dailyKWh.toFixed(2)} kWh</Typography>
            <Typography variant="body1"><strong>Consommation mensuelle :</strong> {monthlyKWh.toFixed(2)} kWh</Typography>
          </Box>
        </Box>

        {/* Equipment Table */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Détail des équipements</Typography>
        <TableContainer component={Box} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Équipement</strong></TableCell>
                <TableCell align="center"><strong>Qté</strong></TableCell>
                <TableCell align="center"><strong>Watts</strong></TableCell>
                <TableCell align="center"><strong>h/jour</strong></TableCell>
                <TableCell align="right"><strong>kWh/jour</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipment.map((item) => (
                <TableRow key={item.instanceId}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="center">{item.power}</TableCell>
                  <TableCell align="center">{item.hoursPerDay}</TableCell>
                  <TableCell align="right">{(item.quantity * item.power * item.hoursPerDay / 1000).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell colSpan={4} sx={{ fontWeight: 'bold' }}>Consommation totale journalière</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{dailyKWh.toFixed(2)} kWh</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Recommendation */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : rec ? (
          <Box sx={{ p: 3, bgcolor: '#fffde7', border: '1px solid #fff59d', borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom color="primary.dark">Système solaire proposé</Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="body2"><strong>Panneaux solaires</strong></Typography>
                <Typography variant="body2">{rec.panelCount} x {rec.panel.name}</Typography>
                <Typography variant="body2">Puissance : {rec.panelPower} Wp</Typography>
                <Typography variant="body2">{rec.panel.brand}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                  {formatPrice(rec.panel.priceMad)} / unité
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2"><strong>Batterie</strong></Typography>
                <Typography variant="body2">{rec.battery.name}</Typography>
                <Typography variant="body2">Capacité : {rec.batteryCapacity.toFixed(2)} kWh</Typography>
                <Typography variant="body2">Autonomie : {rec.autonomyDays} jour(s)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                  {formatPrice(rec.battery.priceMad)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2"><strong>Onduleur</strong></Typography>
                <Typography variant="body2">{rec.inverter.name}</Typography>
                <Typography variant="body2">Puissance : {rec.inverterPower} W</Typography>
                <Typography variant="body2">{rec.inverter.brand}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                  {formatPrice(rec.inverter.priceMad)}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1"><strong>Prix total estimé :</strong></Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {formatPrice(rec.totalPriceMad)}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 2, mb: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucun produit disponible pour générer une recommandation.
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Cette estimation est basée sur les informations fournies et les modèles de performance solaire standard.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Généré par Solar Sales Pro Calculator
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReportView;