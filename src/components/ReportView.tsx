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
  CircularProgress,
  Fade,
  useTheme,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  const theme = useTheme();
  const reportRef = useRef<HTMLDivElement>(null);
  const [rec, setRec] = useState<ProductRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [printDate] = useState(new Date());
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
      useCORS: true,
      backgroundColor: '#ffffff',
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

  const formatDate = (date: Date) => {
    return format(date, 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <Fade in timeout={500}>
      <Box>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 4, 
          justifyContent: 'flex-end',
          '@media print': { display: 'none' },
        }}>
          <Button 
            variant="outlined" 
            startIcon={<PrintIcon />} 
            onClick={handlePrint}
            sx={{ borderRadius: 3, textTransform: 'none' }}
          >
            Imprimer le rapport
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PictureAsPdfIcon />} 
            onClick={handleExportPdf}
            sx={{ 
              borderRadius: 3, 
              textTransform: 'none',
              boxShadow: theme.shadows[2],
              '&:hover': { boxShadow: theme.shadows[6] },
            }}
          >
            Exporter en PDF
          </Button>
        </Box>

        <Paper 
          ref={reportRef} 
          elevation={0} 
          sx={{ 
            p: 5, 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 4,
            maxWidth: '900px',
            margin: '0 auto',
            backgroundColor: '#fff',
            '@media print': { 
              border: 'none', 
              borderRadius: 0,
              p: 4,
            },
          }}
        >
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            mb: 4,
            '@media print': { mb: 3 },
          }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                }}
              >
                SOLAR SALES PRO
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Proposition solaire personnalisée
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Date : {formatDate(printDate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Proposition n° : {String(Math.floor(100000 + Math.random() * 900000))}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Customer & Summary Info */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 4, 
            mb: 4,
            '@media print': { gap: 3 },
          }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                Informations client
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1">
                  <strong>Nom :</strong> {customer.name || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Téléphone :</strong> {customer.phone || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Ville :</strong> {customer.city || 'N/A'}
                </Typography>
                {customer.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Notes :</strong> {customer.notes}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                Résumé de consommation
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1">
                  <strong>Puissance de pointe :</strong> {totalPower} W
                </Typography>
                <Typography variant="body1">
                  <strong>Consommation journalière :</strong> {dailyKWh.toFixed(2)} kWh
                </Typography>
                <Typography variant="body1">
                  <strong>Consommation mensuelle :</strong> {monthlyKWh.toFixed(2)} kWh
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Equipment Table */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4, fontWeight: 600, color: theme.palette.primary.main }}>
            Détail des équipements
          </Typography>
          <TableContainer component={Box} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                  <TableCell sx={{ fontWeight: 700 }}>Équipement</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Qté</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Watts</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>h/jour</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>kWh/jour</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow key={item.instanceId}>
                    <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="center">{item.power}</TableCell>
                    <TableCell align="center">{item.hoursPerDay}</TableCell>
                    <TableCell align="right">{(item.quantity * item.power * item.hoursPerDay / 1000).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>Consommation totale journalière</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {dailyKWh.toFixed(2)} kWh
                  </TableCell>
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
            <Box sx={{ 
              p: 4, 
              bgcolor: '#fffde7', 
              border: `2px solid ${theme.palette.warning.light}`,
              borderRadius: 4,
              mb: 4,
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.dark }}>
                Système solaire proposé
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: 3, 
                mb: 3,
                '@media print': { gap: 2 },
              }}>
                <Box>
                  {rec.panel.imageUrl && (
                    <Box sx={{ mb: 1.5, textAlign: 'center' }}>
                      <img 
                        src={rec.panel.imageUrl} 
                        alt={rec.panel.name}
                        style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </Box>
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    Panneaux solaires
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {rec.panelCount} x {rec.panel.name}
                  </Typography>
                  <Typography variant="body2">Puissance : {rec.panelPower} Wp</Typography>
                  <Typography variant="body2">{rec.panel.brand}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mt: 0.5 }}>
                    {formatPrice(rec.panel.priceMad)} / unité
                  </Typography>
                </Box>
                <Box>
                  {rec.battery.imageUrl && (
                    <Box sx={{ mb: 1.5, textAlign: 'center' }}>
                      <img 
                        src={rec.battery.imageUrl} 
                        alt={rec.battery.name}
                        style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </Box>
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                    Batterie
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {rec.battery.name}
                  </Typography>
                  <Typography variant="body2">Capacité : {rec.batteryCapacity.toFixed(2)} kWh</Typography>
                  <Typography variant="body2">Autonomie : {rec.autonomyDays} jour{rec.autonomyDays > 1 ? 's' : ''}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.secondary.main, mt: 0.5 }}>
                    {formatPrice(rec.battery.priceMad)}
                  </Typography>
                </Box>
                {rec.inverter && (
                  <Box>
                    {rec.inverter.imageUrl && (
                      <Box sx={{ mb: 1.5, textAlign: 'center' }}>
                        <img 
                          src={rec.inverter.imageUrl} 
                          alt={rec.inverter.name}
                          style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#f57c00' }}>
                      Onduleur
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {rec.inverter.name}
                    </Typography>
                    <Typography variant="body2">Puissance : {rec.inverterPower} W</Typography>
                    <Typography variant="body2">{rec.inverter.brand}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#f57c00', mt: 0.5 }}>
                      {formatPrice(rec.inverter.priceMad)}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: rec.inverter ? '1fr 1fr 1fr' : '1fr 1fr', 
                gap: 3, 
                mb: 3,
                '@media print': { gap: 2 },
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Prix total estimé
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {formatPrice(rec.totalPriceMad)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ 
              p: 4, 
              bgcolor: theme.palette.action.hover, 
              borderRadius: 4, 
              mb: 4, 
              textAlign: 'center',
            }}>
              <Typography variant="body2" color="text.secondary">
                Aucun produit disponible pour générer une recommandation.
              </Typography>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ mt: 6, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}`, pt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Cette estimation est basée sur les informations fournies et les modèles de performance solaire standard.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Généré par Solar Sales Pro Calculator
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

export default ReportView;