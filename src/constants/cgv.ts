import { Totals } from '../utils/pricing';

/**
 * Contexte passé au constructeur des CGV.
 * Permet d'injecter les données du client, des produits et des totaux dans le texte.
 */
export interface CgvContext {
  /** Nom affiché du client (Nom + Prénom si présent) */
  customerLabel: string;
  orderNumber: string;
  /** Date de paiement formatée (dd/MM/yyyy) */
  paymentDateLabel: string;
  totals: Totals;
  /** Catégories de produits présentes dans la commande (dédupliquées) */
  productCategories: string[];
  productCount: number;
}

export interface CgvClause {
  /** Titre facultatif de la clause */
  title?: string;
  /** Paragraphes de la clause */
  paragraphs: string[];
}

/** Politique garantie / délai par catégorie de produit (extensible) */
export interface ProductCategoryPolicy {
  warranty: string;
  delivery: string;
}

export const CATEGORY_POLICIES: Record<string, ProductCategoryPolicy> = {
  panel: { warranty: '10 ans matériel (garantie fabricant)', delivery: '5 à 8 jours ouvrés' },
  battery: { warranty: '5 ans (garantie fabricant)', delivery: '5 à 8 jours ouvrés' },
  inverter: { warranty: '5 ans (garantie fabricant)', delivery: '3 à 5 jours ouvrés' },
  other: { warranty: 'selon la fiche produit', delivery: '2 à 4 jours ouvrés' },
};

export const DEFAULT_CATEGORY_POLICY: ProductCategoryPolicy = {
  warranty: 'selon la fiche produit fournie',
  delivery: '2 à 8 jours ouvrés',
};

export const CGV_TITLE = 'CONDITIONS GENERALES DE VENTE';

export const CGV_WORD_PARAGRAPHS = [
  "Toutes les ventes effectuées par la société EASY POWER sont soumises aux présentes CGV sans aucune réserve ou restriction d'aucune nature. Ces Conditions générales de vente sont réputées acceptées dans leur totalité par l'acheteur du seul fait de sa commande. Nos Conditions générales de vente sont prioritairement appliquées à toutes Conditions générales d'achat établies par l'acheteur sauf dérogation formelle, écrite et expresse de notre part. EASY POWER se réserve le droit d'accepter ou non toute commande après avoir effectué des vérifications sur la situation du compte de l'acheteur ainsi que sur ses capacités financières ; toutes informations ou précisions verbales émanant des services de la société EASY POWER doivent être confirmées par écrit pour acquérir valeur contractuelle.",
  "Tout acompte reçu à la commande est réputé définitivement acquis. Lors de la consultation de la société EASY POWER les prix sont donnés à titre indicatif sauf spécification d'un délai d'option ou d'un prix ferme. Les prix indiqués s'entendent nets, hors taxe sur la base des tarifs communiqués à l'acheteur. Toute diminution de la quantité commandée ferme entraîne d'office une modification des prix unitaires des marchandises. Une facture est établie pour chaque livraison et délivrée au moment de celle-ci, à moins qu'ait été délivré un bon de livraison, auquel cas une facture récapitulative, se référant à tous les bons de livraison émis, sera établie.",
  "Nos produits sont fournis au prix en vigueur au moment de la livraison. Ils s'entendent nets, hors taxes sur la base des tarifs communiqués à l'acheteur. La société EASY POWER s'accorde le droit de modifier ses tarifs sans préavis et à tout moment. Lors de la consultation du vendeur, les prix sont donnés à titre indicatif, sauf spécification d'un délai d'option et d'un prix ferme. Aucun escompte ne sera consenti en cas de paiement anticipé. Le Vendeur se réserve le droit de fixer à l'acheteur un plafond d'encours et de subordonner la fourniture des produits à la présentation d'une garantie, compte tenu du délai de paiement éventuellement accordé.",
  "Les règlements seront effectués conformément aux modalités définies par le bon de livraison et rappelées sur la facture ; et en absence d'accord préalable sur les délais de paiement, le délai de paiement ne peut dépasser 60 jours à compter de la date de facturation conformément aux lois en vigueur. EASY POWER se réserve le droit de toute vérification et applications que lui procure la loi sur les délais de paiement en vigueur. En cas de paiement différé ou à terme, constitue un paiement au sens du présent article, non pas la simple remise d'un effet de commerce ou d'un chèque impliquant une obligation de payer, mais leur règlement à l'échéance convenue.",
  "Les clients bénéficiant d'un relevé mensuel, doivent s'acquitter de la totalité du règlement du total des factures à la date indiquée ; tout mois entamé est dû. En cas de retard de paiement, EASY POWER exigera de l'acheteur le versement d'une indemnité de retard calculée par application aux montants exigibles (TTC), d'un taux calculé comme suit : taux directeur de Banque de France majoré de 10%, à partir du jour suivant l'échéance convenue comme indiqué ci-dessus, et ce, sans formalité préalable. Toute somme non payée à son échéance pourra, sur simple mise en demeure, entraîner l'exigibilité immédiate de toutes les sommes, même non échues, qui seraient dues au Vendeur. Pour toute somme non payée à son échéance l'acheteur doit verser à la société EASY POWER une pénalité de retard égale au taux Directeur de Banque de France majoré de 10%. En outre, des frais de dossier de 50 Euros hors taxes seront facturés à l'acheteur dès la 3ème relance.",
  "La livraison est effectuée soit par la mise à disposition en nos magasins de la marchandise à l'acheteur soit au lieu indiqué par l'acheteur. Le délai de livraison indiqué lors de l'enregistrement de la commande n'est donné qu'à titre indicatif et n'est aucunement garanti. Par voie de conséquence, tout retard raisonnable dans la livraison des produits ne pourra pas donner lieu au profit de l'acheteur à l'allocation de dommages et intérêts et/ou l'annulation de la commande. La société EASY POWER est dégagée de plein droit de tout engagement relatif aux délais de livraison dans les cas où : 1) les conditions de paiement n'auraient pas été observées par l'acheteur ; 2) les renseignements techniques ou commerciaux à fournir par l'acheteur et nécessaires à l'exécution de la commande ne seraient pas arrivés en temps voulu ; 3) en cas de force majeure.",
  "Si la livraison est effectuée par le vendeur, un bon de livraison ou un procès-verbal sera dressé par le vendeur à la livraison. Le bon de livraison devra porter la signature et le cachet de l'acheteur, cependant la personne réceptionnant la marchandise livrée par la société EASY POWER engage pleinement l'acheteur du fait de sa seule signature et du cachet apposés sur le bon de livraison présenté à cette fin par la société EASY POWER ou son représentant. La signature et le cachet qui sont apposés par toute personne représentant l'acheteur et réceptionnant la marchandise en son nom et place, et à tout endroit ou site dûment indiqué par lui, entraînent, dès leur apposition, l'acceptation par l'acheteur de la livraison sans aucune réserve de quelque nature que ce soit concernant la quantité, la qualité, ainsi que la conformité de la marchandise livrée et dûment réceptionnée ; le seul cachet et la signature du réceptionnaire présent sur site faisant foi.",
  "La société EASY POWER s'engage à remédier à tout défaut de fonctionnement des produits provenant d'un vice dans la conception, les matières ou la fabrication des produits vendus. Cette obligation ne s'applique pas en cas : d'un usage non conforme aux prescriptions de la société EASY POWER, de ses fournisseurs ou aux normes et règles de l'art ; de conditions de stockages inadaptées ; de non-respect des notices d'installation et de mise en service ; de modification ou adjonctions effectuées sur les produits par l'acheteur sans l'accord préalable et express de la société EASY POWER. Toute garantie est également exclue pour les réparations qui résulteraient de l'usure normale du produit ; pour des détériorations ou des accidents provenant d'un défaut de mise en place des produits ou d'une utilisation non conforme à leur destination ; pour tout incident dont la responsabilité n'incombe pas à EASY POWER.",
  "La responsabilité de la société EASY POWER ne pourra pas être mise en œuvre si la non-exécution ou le retard dans l'exécution de l'une de ses obligations décrites dans les présentes conditions générales de vente découle d'un cas de force majeure. A ce titre, la force majeure s'entend de tout événement extérieur, imprévisible et irrésistible au sens de la loi. La société EASY POWER conserve la propriété des biens vendus jusqu'au paiement intégral du prix, en principal et en accessoires. A ce titre si l'acheteur fait l'objet d'un redressement ou d'une liquidation judiciaire, la société EASY POWER se réserve le droit de revendiquer, dans le cadre de la procédure collective, les marchandises vendues et restées impayées.",
  "En cas de non-respect des conditions contractuelles de paiement par l'acheteur, toutes les ventes conclues et non payées se trouvent résolues de plein droit si la mise en demeure de payer par le vendeur, exprimée par lettre recommandée avec accusé de réception, n'est pas suivie d'un règlement comptant dans les huit jours. Tout litige relatif à toute vente effectuée par la société EASY POWER, et qui ne pourrait être réglé à l'amiable ni par voie de médiation sera de la compétence exclusive des tribunaux de Clermont-Ferrand France.",
];
