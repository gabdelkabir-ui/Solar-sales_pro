import React, { useRef } from 'react';
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
  TableRow
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CustomerInfo, SelectedEquipment } from '../types';
import { calculateConsumption, getSolarRecommendation } from '../utils/solarCalculations';

interface ReportViewProps {
  customer: CustomerInfo;
  equipment: SelectedEquipment[];
}

const ReportView: React.FC<ReportViewProps> = ({ customer, equipment }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const { totalPower, dailyKWh, monthlyKWh } = calculateConsumption(equipment);
  const rec = getSolarRecommendation(dailyKWh, totalPower);

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
    pdf.save(`Solar_Proposal_${customer.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end', '@media print': { display: 'none' } }}>
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />} 
          onClick={handlePrint}
        >
          Print Report
        </Button>
        <Button 
          variant="contained" 
          startIcon={<PictureAsPdfIcon />} 
          onClick={handleExportPdf}
        >
          Export as PDF
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
            <Typography variant="subtitle1" color="text.secondary">Custom Solar Energy Proposal</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2">Date: {format(new Date(), 'MMMM dd, yyyy')}</Typography>
            <Typography variant="body2">Proposal #: {Math.floor(Math.random() * 100000)}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Customer & Summary Info */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
          <Box>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
            <Typography variant="body1"><strong>Name:</strong> {customer.name || 'N/A'}</Typography>
            <Typography variant="body1"><strong>Phone:</strong> {customer.phone || 'N/A'}</Typography>
            <Typography variant="body1"><strong>City:</strong> {customer.city || 'N/A'}</Typography>
            {customer.notes && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary"><strong>Notes:</strong> {customer.notes}</Typography>
              </Box>
            )}
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>Consumption Summary</Typography>
            <Typography variant="body1"><strong>Peak Power:</strong> {totalPower} W</Typography>
            <Typography variant="body1"><strong>Daily Usage:</strong> {dailyKWh.toFixed(2)} kWh</Typography>
            <Typography variant="body1"><strong>Monthly Usage:</strong> {monthlyKWh.toFixed(2)} kWh</Typography>
          </Box>
        </Box>

        {/* Equipment Table */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Equipment Detail</Typography>
        <TableContainer component={Box} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Equipment</strong></TableCell>
                <TableCell align="center"><strong>Qty</strong></TableCell>
                <TableCell align="center"><strong>Watts</strong></TableCell>
                <TableCell align="center"><strong>Hrs/Day</strong></TableCell>
                <TableCell align="right"><strong>Daily kWh</strong></TableCell>
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
                <TableCell colSpan={4} sx={{ fontWeight: 'bold' }}>Total Daily Consumption</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{dailyKWh.toFixed(2)} kWh</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Recommendation */}
        <Box sx={{ p: 3, bgcolor: '#fffde7', border: '1px solid #fff59d', borderRadius: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="primary.dark">Proposed Solar System</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2"><strong>Solar Panels:</strong> {rec.panelCount} x {rec.panelModel}</Typography>
              <Typography variant="body2"><strong>Total PV Power:</strong> {rec.panelPower} Wp</Typography>
            </Box>
            <Box>
              <Typography variant="body2"><strong>Inverter:</strong> {rec.inverterModel}</Typography>
              <Typography variant="body2"><strong>Battery:</strong> {rec.batteryModel}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            This estimate is based on the information provided and standard solar performance models.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated by Solar Sales Pro Calculator
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReportView;
