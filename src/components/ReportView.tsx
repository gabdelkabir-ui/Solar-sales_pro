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
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../constants/logo.png';
import { CustomerInfo, SelectedEquipment, ProductRecommendation } from '../types';
import { calculateConsumption } from '../utils/solarCalculations';
import { getRecommendationFromProducts } from '../utils/productsApi';

interface ReportViewProps {
  customer: CustomerInfo;
  equipment: SelectedEquipment[];
}

const ORDER_NUMBER = `BC-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
const TVA_RATE = 0.20; // 20%

const ReportView: React.FC<ReportViewProps> = ({ customer, equipment }) => {
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const [rec, setRec] = useState<ProductRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const { totalPower, dailyKWh } = calculateConsumption(equipment);

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
    
    // Capture Page 1
    const canvas1 = await captureToCanvas(page1Ref.current);
    const imgData1 = canvas1.toDataURL('image/png');
    const imgWidth1 = usableWidth;
    const imgHeight1 = (canvas1.height * imgWidth1) / canvas1.width;
    
    // Add Page 1 to PDF (first page)
    pdf.addImage(imgData1, 'PNG', margin, margin, imgWidth1, imgHeight1, '', 'FAST');
    
    // Capture Page 2 (CGV) if it exists
    if (page2Ref.current) {
      const canvas2 = await captureToCanvas(page2Ref.current);
      const imgData2 = canvas2.toDataURL('image/png');
      
      // Add Page 2 as a new page
      pdf.addPage();
      const imgWidth2 = usableWidth;
      const imgHeight2 = (canvas2.height * imgWidth2) / canvas2.width;
      pdf.addImage(imgData2, 'PNG', margin, margin, imgWidth2, imgHeight2, '', 'FAST');
    }
    
    pdf.save(`Bon_de_commande_${customer.name.replace(/\s+/g, '_')}.pdf`);
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price) + ' €';
  };

  // Build line items from the recommendation
  const getLineItems = () => {
    if (!rec) return [];
    const items: Array<{ reference: string; designation: string; quantity: number; unitPrice: number; totalHT: number }> = [];
    
    // Panel line
    items.push({
      reference: rec.panel.slug || rec.panel.id.toString(),
      designation: `Panneau solaire ${rec.panel.name} - ${rec.panel.brand} (${rec.panel.outputPowerW}W)`,
      quantity: rec.panelCount,
      unitPrice: rec.panel.priceMad ?? 0,
      totalHT: (rec.panel.priceMad ?? 0) * rec.panelCount,
    });
    
    // Battery line
    items.push({
      reference: rec.battery.slug || rec.battery.id.toString(),
      designation: `Batterie ${rec.battery.name} - ${rec.battery.brand} (${(rec.battery.capacityWh ?? 0) / 1000} kWh)`,
      quantity: 1,
      unitPrice: rec.battery.priceMad ?? 0,
      totalHT: rec.battery.priceMad ?? 0,
    });
    
    // Inverter line if present
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

  const lineItems = getLineItems();
  const totalHT = lineItems.reduce((sum, item) => sum + item.totalHT, 0);
  const tva = totalHT * TVA_RATE;
  const totalTTC = totalHT + tva;

  // Generate a random order date (today) and payment date
  const today = new Date();
  const paymentDate = new Date(today);
  paymentDate.setDate(paymentDate.getDate() + 30);

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
      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end', '@media print': { display: 'none' } }}>
        <Button 
          variant="outlined" 
          startIcon={<PrintIcon />} 
          onClick={handlePrint}
        >
          Imprimer le bon de commande
        </Button>
        <Button 
          variant="contained" 
          startIcon={<PictureAsPdfIcon />} 
          onClick={handleExportPdf}
        >
          Exporter en PDF
        </Button>
      </Box>

      {/* ===== PAGE 1: Main order content ===== */}
      <Paper ref={page1Ref} elevation={0} sx={paperStyle}>

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
          BON DE COMMANDE
        </Typography>

        {/* COMPANY INFO + DATE / ORDER NUMBER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'flex-start' }}>
          <Box sx={{ fontSize: '0.85rem' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Société : EASY POWER</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Forme juridique : SAS</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Siège social : 31 Rue des Martres de Madargue, 63200 RIOM, France</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>RCS : Clermont-Ferrand</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>SIRET : 93183542500014</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Email : s.zekraoui@easypower.ma</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Téléphone : +33 178766819</Typography>
          </Box>
          <Box sx={{ textAlign: 'right', fontSize: '0.85rem' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Date : {format(today, 'dd/MM/yyyy', { locale: fr })}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Numéro de commande : {ORDER_NUMBER}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Code Agence : TCD</Typography>
          </Box>
        </Box>

        {/* CLIENT SECTION */}
        <Box sx={{ border: '1px solid #000', p: 2, mb: 3, mt: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '0.9rem' }}>CLIENT :</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Nom : {customer.name || '____________________'}</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Prénom : ____________________</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Adresse : {customer.city || '____________________'}</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Numéro de téléphone : {customer.phone || '____________________'}</Typography>
        </Box>

        {/* LOADING STATE / CONTENT */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : rec ? (
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
                  <Typography sx={{ fontSize: '0.85rem' }}>{formatPrice(totalHT)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, borderBottom: '1px solid #000' }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>TVA ({(TVA_RATE * 100).toFixed(0)}%)</Typography>
                  <Typography sx={{ fontSize: '0.85rem' }}>{formatPrice(tva)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Total TTC</Typography>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{formatPrice(totalTTC)}</Typography>
                </Box>
              </Box>
            </Box>

            {/* CONDITIONS */}
            <Box sx={{ mb: 2, fontSize: '0.8rem' }}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                <strong>Conditions de paiement :</strong> Paiement à {format(paymentDate, 'dd/MM/yyyy', { locale: fr })} (30 jours net)
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                <strong>Pénalités de retard :</strong> conformément à l'article L441-10 du Code de commerce.
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                <strong>Clause de réserve de propriété :</strong> les marchandises restent la propriété de EASY POWER jusqu'au paiement intégral.
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                <strong>Litiges :</strong> tribunal compétent Clermont-Ferrand.
              </Typography>
            </Box>

            {/* SIGNATURES */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, mt: 4 }}>
              <Box sx={{ width: '45%' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 4 }}>
                  Signature client (Bon pour accord) : ____________________
                </Typography>
                <Box sx={{ border: '1px solid #000', p: 2, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#999' }}>
                    Cachet / Signature client
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ width: '45%', textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 1 }}>Signature EASY POWER :</Typography>
                <Box sx={{ border: '1px solid #000', p: 2, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>EASY POWER SASU</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>RCS Clermont-Ferrand</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>931 835425</Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>31 Rue des Martres de Madargue</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>63200, RIOM, FRANCE</Typography>
                </Box>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 2, mb: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucun produit disponible pour générer un bon de commande.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ===== PAGE 2: CONDITIONS GENERALES DE VENTE (separate) ===== */}
      {!loading && rec && (
        <Paper ref={page2Ref} elevation={0} sx={{ ...paperStyle, mt: 4, '@media print': { pageBreakBefore: 'always', mt: 0 } }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" align="center" sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1 }}>
            CONDITIONS GENERALES DE VENTE
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.7rem', textAlign: 'justify', lineHeight: 1.4 }}>
            Toutes les ventes effectuées par la société EASY POWER sont soumises aux présentes CGV sans aucune réserve ou restriction d'aucune nature. 
            Ces Conditions générales de vente sont réputées acceptées dans leur totalité par l'acheteur du seul fait de sa commande. 
            Nos Conditions générales de vente sont prioritairement appliquées à toutes Conditions générales d'achat établies par l'acheteur sauf dérogation formelle, écrite et expresse de notre part. 
            EASY POWER se réserve le droit d'accepter ou non toute commande après avoir effectué des vérifications sur la situation du compte de l'acheteur ainsi que sur ses capacités financières ; 
            toutes informations ou précisions verbales émanant des services de la société EASY POWER doivent être confirmées par écrit pour acquérir valeur contractuelle. 
            Tout acompte reçu à la commande est réputé définitivement acquis. 
            Lors de la consultation de la société EASY POWER les prix sont donnés à titre indicatif sauf spécification d'un délai d'option ou d'un prix ferme. 
            Les prix indiqués s'entendent nets, hors taxe sur la base des tarifs communiqués à l'acheteur. Toute diminution de la quantité commandée ferme entraîne d'office une modification des prix unitaires des marchandises. 
            Une facture est établie pour chaque livraison et délivrée au moment de celle-ci, à moins qu'ait été délivré un bon de livraison, auquel cas une facture récapitulative, se référant à tous les bons de livraison émis, sera établie. 
            Nos produits sont fournis au prix en vigueur au moment de la livraison. Ils s'entendent nets, hors taxes sur la base des tarifs communiqués à l'acheteur. 
            La société EASY POWER s'accorde le droit de modifier ses tarifs sans préavis et à tout moment. 
            Lors de la consultation du vendeur, les prix sont donnés à titre indicatif, sauf spécification d'un délai d'option et d'un prix ferme. 
            Aucun escompte ne sera consenti en cas de paiement anticipé. Le Vendeur se réserve le droit de fixer à l'acheteur un plafond d'encours et de subordonner la fourniture des produits à la présentation d'une garantie, 
            Compte tenu du délai de paiement éventuellement accordé. Les règlements seront effectués conformément aux Modalités définies par le bon de livraison et rappelées sur la facture ; 
            et en absence d'accord préalable sur les délais de paiement, le délai de paiement ne peut dépasser 60 jours à compter de la date de facturation conformément aux lois en vigueur. 
            EASY POWER se réserve le droit de toute vérification et applications que lui procure la loi sur les délais de paiement en vigueur. 
            En cas de paiement différé ou à terme, constitue un paiement au sens du présent article, non pas la simple remise d'un effet de commerce ou d'un chèque impliquant une obligation de payer, mais leur règlement à l'échéance convenue. 
            Les clients bénéficiant d'un relevé mensuel, doivent s'acquitter de la totalité du règlement du total des factures à la date indiquée ; Tout mois entamé est dû. 
            En cas de retard de paiement, EASY POWER exigera de l'acheteur le versement d'une indemnité de retard calculée par application aux montants exigibles (TTC), 
            d'un taux calculé comme suit : taux directeur de Banque de France majoré de 10%, à partir du jour suivant l'échéance convenue comme indiqué ci-dessus, et ce ; sans formalité préalable. 
            Toute somme non payée à son échéance pourra, sur simple mise en demeure, entraîner l'exigibilité immédiate de toutes les sommes, même non échues, qui seraient dues au Vendeur. 
            Pour toute somme non payée à son échéance l'acheteur doit verser à la société EASY POWER une pénalité de retard égale au taux Directeur de Banque de France majoré de 10%. 
            En outre, des frais de dossier de 50 Euros hors taxes seront facturés à l'acheteur dès la 3ème relance. 
            La livraison est effectuée soit, par la mise à disposition en nos magasins de la marchandise à l'acheteur soit au lieu indiqué par l'acheteur. 
            Le délai de livraison indiqué lors de l'enregistrement de la commande n'est donné qu'à titre indicatif et n'est aucunement garanti. 
            Par voie de conséquence, tout retard raisonnable dans la livraison des produits ne pourra pas donner lieu au profit de l'acheteur à L'allocation de dommages et intérêts et ou l'annulation de la commande. 
            La société EASY POWER est dégagée de plein droit de tout engagement relatif aux délais de livraison dans les cas où : 
            1) les conditions de paiement n'auraient pas été observées par l'acheteur. 
            2) les renseignements techniques ou commerciaux à fournir par l'acheteur et nécessaires à l'exécution de la commande ne seraient pas arrivés en temps voulu. 
            3) En cas de force majeure. 
            Si la livraison est effectuée par le vendeur, un bon de livraison ou un procès-verbal sera dressé par le vendeur à la livraison. 
            Le Bon de livraison devra porter la signature et le cachet de l'acheteur, cependant la personne réceptionnant la marchandise livrée par la société EASY POWER, 
            engage pleinement l'acheteur du fait de sa seule signature et du cachet apposés sur le bon de livraison présenté à cette fin par la société EASY POWER ou son représentant. 
            La signature et le cachet qui sont apposés par toute personne représentant l'acheteur et réceptionnant la marchandise en son nom et place, 
            et à tout endroit ou site dûment indiqué par lui, entrainent, dès leur apposition, l'acceptation par l'acheteur de la livraison sans aucune réserve de quelque nature que ce soit 
            concernant la quantité, la qualité, ainsi que la conformité de la marchandise livrée et dûment réceptionnée ; 
            le seul cachet et la signature du réceptionnaire présent sur site faisant foi. 
            La société EASY POWER s'engage à remédier à tout défaut de fonctionnement des produits provenant d'un vice dans la conception, les matières ou la fabrication des produits vendus. 
            Cette obligation ne s'applique pas en cas : 
            D'un usage non conforme aux prescriptions de la société EASY POWER, de ses fournisseurs ou aux normes et règles de l'art ; 
            De conditions de stockages inadaptées ; 
            De non-respect des notices d'installation et de mise en service ; 
            De modification ou adjonctions effectuées sur les produits par l'acheteur Sans l'accord préalable et express de la société EASY POWER. 
            Toute garantie est également exclue : 
            Pour les réparations qui résulteraient de l'usure normale du produit ; 
            Pour des détériorations ou des accidents provenant d'un défaut de mise en place des produits ou d'une utilisation non conforme à leur destination ; 
            Pour tout incident dont la responsabilité n'incombe pas à EASY POWER. 
            La responsabilité de la société EASY POWER ne pourra pas être mise en œuvre si la non-exécution ou le retard dans l'exécution de l'une de ses obligations 
            décrites dans les présentes conditions générales de vente découle d'un cas de force majeur. 
            A ce titre, la force majeure s'entend de tout événement extérieur, imprévisible et irrésistible au sens de la loi. 
            La société EASY POWER conserve la propriété des biens vendus jusqu'au paiement intégral du prix, en principal et en accessoires. 
            A ce titre si l'acheteur fait l'objet d'un redressement ou d'une liquidation judiciaire, 
            la société EASY POWER se réserve le droit de revendiquer, dans le cadre de la procédure collective, les marchandises vendues et restées impayées. 
            En cas de non-respect des conditions contractuelles de paiement, par l'acheteur, toutes les ventes conclues et non payées se trouvent résolues de plein droit si, 
            la mise en demeure de payer par le vendeur, exprimée par lettre-recommandée avec accusé de réception, n'est pas suivie d'un règlement comptant dans les huit jours. 
            Tout litige relatif à toute vente effectuée par la société EASY POWER, et qui ne pourrait être réglé à l'amiable ni par voie de médiation sera de la compétence exclusive des tribunaux de Clermont-Ferrand France.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ReportView;