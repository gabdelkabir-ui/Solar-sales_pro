import React, { useRef, useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
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
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../constants/logo.png';
import signature from '../constants/sign.png';
import { CustomerInfo, SelectedEquipment, ProductRecommendation, ReportType } from '../types';
import { useProjectStore } from '../hooks/useProjectStore';
import { calculateConsumption } from '../utils/solarCalculations';
import { getRecommendationFromProducts } from '../utils/productsApi';
import { REPORT_TYPES } from '../constants/reportTypes';
import { COMPANY, TVA_RATE } from '../constants/config';
import { computeTotals, formatPrice } from '../utils/pricing';
import { buildCgv } from '../utils/cgv';
import CustomerInfoBlock from './CustomerInfoBlock';
import CgvBlock from './CgvBlock';

interface ReportViewProps {
  customer: CustomerInfo;
  equipment: SelectedEquipment[];
  onBack?: () => void;
  projectId?: number | null;
  overrideOrderNumber?: string;
  overridePaymentDate?: string;
  reportType?: ReportType;
}

const generateOrderNumber = () => {
  return `BC-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
};

const ReportView: React.FC<ReportViewProps> = ({ customer, equipment, onBack, overrideOrderNumber, overridePaymentDate, reportType = 'bon-de-commande' }) => {
  const { orderNumber: storeOrderNumber, paymentDate: storePaymentDate, savedRecData } = useProjectStore();
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const [rec, setRec] = useState<ProductRecommendation | null>(null);
  const hasSavedData = savedRecData && Object.keys(savedRecData).length > 0;
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const { totalPower, dailyKWh } = calculateConsumption(equipment);

  useEffect(() => {
    if (hasSavedData) {
      setLoading(false);
    } else {
      getRecommendationFromProducts(dailyKWh, totalPower).then(result => {
        if (result) setRec(result);
        setLoading(false);
      });
    }
  }, [dailyKWh, totalPower, hasSavedData]);

  const handlePrint = () => {
    window.print();
  };

  const captureToCanvas = async (element: HTMLDivElement): Promise<HTMLCanvasElement> => {
    return html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      windowHeight: element.scrollHeight,
    });
  };

  const handleExportPdf = async () => {
    if (!page1Ref.current) return;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const usableWidth = pdfWidth - 2 * margin;
    
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const usableHeight = pdfHeight - 2 * margin;
    const addCanvasToPage = (canvas: HTMLCanvasElement, addPage = false) => {
      if (addPage) pdf.addPage();
      const ratio = Math.min(usableWidth / canvas.width, usableHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin + (usableWidth - width) / 2, margin, width, height, '', 'FAST');
    };

    // Capture Page 1 et l'ajuster strictement à la page A4.
    const canvas1 = await captureToCanvas(page1Ref.current);
    addCanvasToPage(canvas1);
    
    // Capture Page 2 (CGV) if it exists
    if (page2Ref.current) {
      const canvas2 = await captureToCanvas(page2Ref.current);
      addCanvasToPage(canvas2, true);
    }
    
    const pdfFilename = `${REPORT_TYPES[reportType].fileNamePrefix}${customer.name.replace(/\s+/g, '_')}.pdf`;
    pdf.save(pdfFilename);
  };

  const getLineItems = () => {
    if (hasSavedData) {
      return buildLineItemsFromSavedData();
    }
    if (!rec) return [];
    const items: Array<{ reference: string; designation: string; quantity: number; unitPrice: number; totalHT: number }> = [];
    
    items.push({
      reference: rec.panel.slug || rec.panel.id.toString(),
      designation: `Panneau solaire ${rec.panel.name} - ${rec.panel.brand} (${rec.panel.outputPowerW}W)`,
      quantity: rec.panelCount,
      unitPrice: rec.panel.priceMad ?? 0,
      totalHT: (rec.panel.priceMad ?? 0) * rec.panelCount,
    });
    
    items.push({
      reference: rec.battery.slug || rec.battery.id.toString(),
      designation: `Batterie ${rec.battery.name} - ${rec.battery.brand} (${(rec.battery.capacityWh ?? 0) / 1000} kWh)`,
      quantity: 1,
      unitPrice: rec.battery.priceMad ?? 0,
      totalHT: rec.battery.priceMad ?? 0,
    });
    
    if (rec.inverter) {
      items.push({
        reference: rec.inverter.slug || rec.inverter.id.toString(),
        designation: `Onduleur ${rec.inverter.name} - ${rec.inverter.brand} (${rec.inverter.outputPowerW}W)`,
        quantity: 1,
        unitPrice: rec.inverter.priceMad ?? 0,
        totalHT: rec.inverter.priceMad ?? 0,
      });
    }
    
    return items;
  };

  const buildLineItemsFromSavedData = () => {
    const items: Array<{ reference: string; designation: string; quantity: number; unitPrice: number; totalHT: number }> = [];
    if (!savedRecData) return items;

    items.push({
      reference: savedRecData.panelModel || 'PANEL',
      designation: savedRecData.panelModel || 'Panneau solaire',
      quantity: savedRecData.panelCount || 1,
      unitPrice: savedRecData.panelUnitPrice ?? 0,
      totalHT: (savedRecData.panelUnitPrice ?? 0) * (savedRecData.panelCount || 1),
    });

    items.push({
      reference: savedRecData.batteryModel || 'BATTERY',
      designation: savedRecData.batteryModel || 'Batterie',
      quantity: 1,
      unitPrice: savedRecData.batteryPrice ?? 0,
      totalHT: savedRecData.batteryPrice ?? 0,
    });

    if (savedRecData.inverterModel) {
      items.push({
        reference: savedRecData.inverterModel || 'INVERTER',
        designation: savedRecData.inverterModel || 'Onduleur',
        quantity: 1,
        unitPrice: savedRecData.inverterPrice ?? 0,
        totalHT: savedRecData.inverterPrice ?? 0,
      });
    }

    return items;
  };

  const lineItems = getLineItems();
  const totals = computeTotals(lineItems);

  // Nom affiché du client pour les CGV (Prénom + Nom)
  const customerLabel =
    [customer.firstName, customer.name].map((v) => v?.toString().trim()).filter(Boolean).join(' ') ||
    customer.name ||
    'Client';

  // Catégories de produits présentes (pour les clauses garantie/délai des CGV)
  const productCategories: string[] = [];
  if (hasSavedData && savedRecData) {
    ['panel', 'battery', 'inverter'].forEach((k) => {
      if (savedRecData[`${k}Model`]) productCategories.push(k);
    });
  } else if (rec) {
    productCategories.push('panel', 'battery');
    if (rec.inverter) productCategories.push('inverter');
  }
  const productCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);

  // Format date safely
  const formatDateSafe = (date: Date | null | undefined, formatStr: string) => {
    try {
      if (!date || isNaN(date.getTime())) return '________';
      return format(date, formatStr, { locale: fr });
    } catch {
      return '________';
    }
  };

  // Use payment date from store, or default to today + 30 days
  const getPaymentDate = (): Date => {
    const paymentDateSource = overridePaymentDate || storePaymentDate;
    try {
      if (paymentDateSource) {
        const dateStr = paymentDateSource.includes('T') 
          ? paymentDateSource 
          : paymentDateSource + 'T00:00:00';
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
      }
    } catch {}
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  };
  const paymentDate = getPaymentDate();
  const today = new Date();

  const orderNumber = overrideOrderNumber || storeOrderNumber || generateOrderNumber();
  const showContent = !loading && (rec || hasSavedData);
  const showEmpty = !loading && !rec && !hasSavedData;

  const cgvClauses = buildCgv({
    customerLabel,
    orderNumber,
    paymentDateLabel: formatDateSafe(paymentDate, 'dd/MM/yyyy'),
    totals,
    productCategories,
    productCount,
  });

  const paperStyle = {
    p: 4, 
    border: '1px solid #e0e0e0',
    maxWidth: '850px',
    margin: '0 auto',
    backgroundColor: '#fff',
    fontFamily: 'Times New Roman, serif',
    pageBreakInside: 'avoid' as const,
  };

  return (
    <Box>
      <Box sx={{ maxWidth: '850px', mx: 'auto', mt: 4, px: { xs: 2, sm: 0 }, display: 'flex', gap: 2, mb: 4, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', '@media print': { display: 'none' } }}>
        <Button 
          variant="outlined" 
          onClick={onBack}
        >
          ← Retour
        </Button>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Button
          variant={editMode ? 'contained' : 'outlined'}
          startIcon={<EditIcon />}
          onClick={() => setEditMode((value) => !value)}
        >
          {editMode ? 'Terminer la modification' : 'Modifier le document'}
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />} 
          onClick={handlePrint}
        >
          {REPORT_TYPES[reportType].printLabel}
        </Button>
        <Button 
          variant="contained" 
          startIcon={<PictureAsPdfIcon />} 
          onClick={handleExportPdf}
        >
          Exporter en PDF
        </Button>
        </Box>
      </Box>

      {/* ===== PAGE 1: Main order content ===== */}
       <Paper
         ref={page1Ref}
         elevation={0}
         sx={{ ...paperStyle, ...(editMode ? { outline: '2px dashed #ff7900', outlineOffset: 4, cursor: 'text' } : {}) }}
         contentEditable={editMode}
         suppressContentEditableWarning
         onInput={() => {
           if (page1Ref.current) localStorage.setItem(`solar-report-edit-${orderNumber}`, page1Ref.current.innerHTML);
         }}
       >

        {/* LOGO (top left) */}
        <Box sx={{ mb: 1 }}>
          <Box 
            component="img"
            src={logo}
            alt="EASY POWER Logo"
            sx={{ width: 160, height: 'auto' }}
          />
        </Box>

        {/* TITLE */}
        <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', mb: 3, textTransform: 'uppercase' }}>
          {REPORT_TYPES[reportType].title}
        </Typography>

        {/* COMPANY INFO + DATE / ORDER NUMBER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'flex-start' }}>
          <Box sx={{ fontSize: '0.85rem' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Société : {COMPANY.name}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Forme juridique : {COMPANY.legalForm}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Siège social : {COMPANY.address}, {COMPANY.postalCity}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>RCS : {COMPANY.rcs}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>SIRET : {COMPANY.siret}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Email : {COMPANY.email}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Service Technique : {COMPANY.technicalPhone}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Service Commercial : {COMPANY.commercialPhone}</Typography>

          </Box>
          <Box sx={{ textAlign: 'right', fontSize: '0.85rem' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Date : {format(today, 'dd/MM/yyyy', { locale: fr })}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Numéro de commande : {orderNumber}</Typography>
          </Box>
        </Box>

        {/* CLIENT SECTION */}
        <CustomerInfoBlock customer={customer} />

        {/* LOADING STATE / CONTENT */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        )}

        {showContent && (
          <>
            {/* PRODUCT TABLE */}
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.9rem' }}>
              Désignation des produits :
            </Typography>
            <TableContainer component={Box} sx={{ mb: 2 }}>
              <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5', borderBottom: '2px solid #000' }}>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>Référence</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>Désignation</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>Quantité</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>Prix Unitaire HT</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>Total HT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index} sx={{ borderBottom: '1px solid #ccc' }}>
                      <TableCell sx={{ fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>{item.reference}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>{item.designation}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem', border: '1px solid #000', p: 1 }}>{formatPrice(item.totalHT)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* TOTALS */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Box sx={{ width: '40%', border: '1px solid #000' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #000' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Total HT</Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>{formatPrice(totals.totalHT)}</Typography>
                </Box>
                {totals.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #000' }}>
                    <Typography sx={{ fontSize: '0.85rem' }}>Remise</Typography>
                    <Typography sx={{ fontSize: '0.85rem' }}>- {formatPrice(totals.discount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #000' }}>
                  <Typography sx={{ fontSize: '0.85rem' }}>Total HT après remise</Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>{formatPrice(totals.afterDiscountHT)}</Typography>
                </Box>
                {totals.shipping > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #000' }}>
                    <Typography sx={{ fontSize: '0.85rem' }}>Frais de livraison</Typography>
                    <Typography sx={{ fontSize: '0.85rem' }}>{formatPrice(totals.shipping)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #000' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>TVA ({(TVA_RATE * 100).toFixed(0)}%)</Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>{formatPrice(totals.tva)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Total TTC</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{formatPrice(totals.totalTTC)}</Typography>
                </Box>
              </Box>
            </Box>

            {REPORT_TYPES[reportType].hasPaymentConditions && (
              <Box sx={{ mb: 2, fontSize: '0.8rem' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  <strong>Conditions de paiement :</strong> Paiement à {formatDateSafe(paymentDate, 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  <strong>Pénalités de retard :</strong> conformément à l'article L441-10 du Code de commerce.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  <strong>Clause de réserve de propriété :</strong> les marchandises restent la propriété de {COMPANY.name} jusqu'au paiement intégral.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                  <strong>Litiges :</strong> tribunal compétent {COMPANY.courts}.
                </Typography>
              </Box>
            )}

            {/* SIGNATURES */}
            <Box sx={{ mb: 2, mt: 4, textAlign: 'left' }}>
              {REPORT_TYPES[reportType].hasClientSignature && (
                <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', mb: 2, textDecoration: 'underline' }}>
                  Signature client (Bon pour accord) : ____________________
                </Typography>
              )}
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', mb: 3, textDecoration: 'underline' }}>
                Signature {COMPANY.name} :
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{COMPANY.address}</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{COMPANY.postalCity}</Typography>
                </Box>
                <Box 
                  component="img"
                  src={signature}
                  alt="Signature"
                  sx={{ width: 200, height: 'auto', maxHeight: 180 }}
                />
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{COMPANY.legalFormShort}</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>RCS {COMPANY.rcs} 931</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.65rem' }}>{COMPANY.siret.slice(-6)}</Typography>

                </Box>
              </Box>
            </Box>
          </>
        )}

        {showEmpty && (
          <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 2, mb: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucun produit disponible pour générer un bon de commande.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ===== PAGE 2: CONDITIONS GENERALES DE VENTE (dynamiques) ===== */}
      {showContent && (
        <CgvBlock
          clauses={cgvClauses}
          paperRef={page2Ref}
          sx={{ ...paperStyle, mt: 4, '@media print': { pageBreakBefore: 'always', mt: 0 } }}
        />
      )}
    </Box>
  );
};

export default ReportView;
