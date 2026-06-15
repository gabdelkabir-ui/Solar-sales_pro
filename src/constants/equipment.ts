import { Equipment } from '../types';

export const CATEGORIES = [
  '1. Création de contenu & médias terrain',
  '2. Événementiel & commerce mobile',
  '3. Travail mobile & services professionnels',
  '4. BTP, maintenance & interventions techniques',
  '5. Agriculture & sites isolés',
  '6. Secours, humanitaire & sécurité',
  '7. Hospitality & hébergements off-grid',
] as const;

export const EQUIPMENT_CATALOG: Equipment[] = [
  // ─────────────────────────────────────────────────────────────
  // 1. Création de contenu & médias terrain
  // ─────────────────────────────────────────────────────────────
  // 1.1 Production audiovisuelle mobile (59.11B)
  { id: 'cam_cinema', name: 'Caméra cinéma / pro', defaultPower: 25, icon: 'Videocam', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
  { id: 'moniteur_terrain', name: 'Moniteur terrain', defaultPower: 30, icon: 'Monitor', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
  { id: 'enregistreur', name: 'Enregistreur / recorder', defaultPower: 15, icon: 'FiberManualRecord', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
  { id: 'station_montage_laptop', name: 'Station montage laptop', defaultPower: 90, icon: 'Laptop', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
  { id: 'ssd_stockage_externe', name: 'SSD / stockage externe', defaultPower: 10, icon: 'Storage', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
  { id: 'routeur_4g_1', name: 'Routeur 4G/5G', defaultPower: 10, icon: 'Router', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
  { id: 'eclairage_led_video', name: 'Éclairage LED vidéo', defaultPower: 150, icon: 'Light', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },
  { id: 'batteries_chargeurs_1', name: 'Batteries / chargeurs', defaultPower: 60, icon: 'BatteryChargingFull', category: CATEGORIES[0], subCategory: 'Production audiovisuelle mobile (59.11B)' },

  // 1.2 Photographes professionnels terrain (74.20Z)
  { id: 'appareil_photo_pro', name: 'Appareil photo pro', defaultPower: 10, icon: 'CameraAlt', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
  { id: 'objectifs_motorises', name: 'Objectifs motorisés / accessoires', defaultPower: 5, icon: 'Camera', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
  { id: 'laptop_retouche', name: 'Laptop retouche', defaultPower: 60, icon: 'Laptop', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
  { id: 'ssd_stockage_photo', name: 'SSD stockage', defaultPower: 10, icon: 'Storage', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
  { id: 'imprimante_photo', name: 'Imprimante photo portable', defaultPower: 120, icon: 'Print', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },
  { id: 'batterie_chargeurs_photo', name: 'Batterie / chargeurs', defaultPower: 40, icon: 'BatteryChargingFull', category: CATEGORIES[0], subCategory: 'Photographes professionnels terrain (74.20Z)' },

  // 1.3 Télépilotes drones professionnels (74.90B)
  { id: 'drone_charge', name: 'Drone (charge + prep)', defaultPower: 80, icon: 'Flight', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
  { id: 'stations_batteries_drones', name: 'Stations batteries multiples', defaultPower: 200, icon: 'BatteryChargingFull', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
  { id: 'controleur_ecran_drone', name: 'Contrôleur / écran terrain', defaultPower: 25, icon: 'Tablet', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
  { id: 'laptop_analyse_drone', name: 'Laptop analyse', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
  { id: 'tablette_controle_drone', name: 'Tablette contrôle', defaultPower: 15, icon: 'Tablet', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },
  { id: 'gps_instruments', name: 'GPS / instruments', defaultPower: 10, icon: 'Explore', category: CATEGORIES[0], subCategory: 'Télépilotes drones professionnels (74.90B)' },

  // 1.4 Sonorisation / régie mobile (90.02Z)
  { id: 'console_audio', name: 'Console audio', defaultPower: 80, icon: 'Tune', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
  { id: 'enceintes_actives', name: 'Enceintes actives', defaultPower: 1000, icon: 'VolumeUp', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
  { id: 'amplificateurs', name: 'Amplificateurs', defaultPower: 1500, icon: 'VolumeUp', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
  { id: 'micro_hf', name: 'Micro HF / systèmes RF', defaultPower: 20, icon: 'Mic', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
  { id: 'laptop_regie', name: 'Laptop régie', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },
  { id: 'eclairage_scene_led', name: 'Éclairage scène LED', defaultPower: 500, icon: 'Light', category: CATEGORIES[0], subCategory: 'Sonorisation / régie mobile (90.02Z)' },

  // 1.5 Studios créatifs mobiles (74.10Z)
  { id: 'station_montage_pro', name: 'Station de montage pro', defaultPower: 150, icon: 'DesktopWindows', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
  { id: 'ecran_calibre', name: 'Écran calibré', defaultPower: 40, icon: 'Monitor', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
  { id: 'nas_stockage', name: 'NAS / stockage', defaultPower: 60, icon: 'Storage', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
  { id: 'routeur_fibre_4g', name: 'Routeur fibre/4G', defaultPower: 15, icon: 'Router', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
  { id: 'eclairage_studio_led', name: 'Éclairage studio LED', defaultPower: 200, icon: 'Light', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
  { id: 'tablette_graphique_studio', name: 'Tablette graphique', defaultPower: 20, icon: 'Draw', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },
  { id: 'interface_audio_video', name: 'Interface audio/vidéo', defaultPower: 30, icon: 'LinearScale', category: CATEGORIES[0], subCategory: 'Studios créatifs mobiles (74.10Z)' },

  // ─────────────────────────────────────────────────────────────
  // 2. Événementiel & commerce mobile
  // ─────────────────────────────────────────────────────────────
  // 2.1 Organisation événementielle mobile (82.30Z)
  { id: 'sonorisation_mobile_pa', name: 'Sonorisation mobile (PA)', defaultPower: 800, icon: 'VolumeUp', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
  { id: 'console_mixage', name: 'Console de mixage', defaultPower: 80, icon: 'Tune', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
  { id: 'eclairage_evenementiel', name: 'Éclairage événementiel LED', defaultPower: 600, icon: 'Light', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
  { id: 'ecran_led_projection', name: 'Écran LED / projection', defaultPower: 300, icon: 'DisplaySettings', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
  { id: 'regie_laptop', name: 'Régie / laptop', defaultPower: 90, icon: 'Laptop', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
  { id: 'routeur_4g_2', name: 'Routeur 4G/5G', defaultPower: 10, icon: 'Router', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },
  { id: 'groupe_froid_mobile', name: 'Groupe froid mobile (option)', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[1], subCategory: 'Organisation événementielle mobile (82.30Z)' },

  // 2.2 Food trucks (56.10C)
  { id: 'refrigerateur_pro', name: 'Réfrigérateur professionnel', defaultPower: 200, icon: 'Kitchen', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
  { id: 'congelateur_coffre', name: 'Congélateur coffre', defaultPower: 250, icon: 'Kitchen', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
  { id: 'plaque_cuisson', name: 'Plaque cuisson / gaz électrique', defaultPower: 3500, icon: 'Cooktop', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
  { id: 'friteuse_electrique', name: 'Friteuse électrique', defaultPower: 3500, icon: 'Cooktop', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
  { id: 'hotte_aspirante', name: 'Hotte aspirante', defaultPower: 300, icon: 'Air', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
  { id: 'machine_cafe_option', name: 'Machine café (option)', defaultPower: 3000, icon: 'CoffeeMaker', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },
  { id: 'eclairage_led_food', name: 'Éclairage LED', defaultPower: 50, icon: 'Light', category: CATEGORIES[1], subCategory: 'Food trucks (56.10C)' },

  // 2.3 Coffee trucks (56.10C)
  { id: 'machine_espresso_pro', name: 'Machine espresso pro', defaultPower: 3000, icon: 'CoffeeMaker', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
  { id: 'moulin_cafe', name: 'Moulin à café', defaultPower: 350, icon: 'CoffeeMaker', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
  { id: 'refrigerateur_lait', name: 'Réfrigérateur lait', defaultPower: 150, icon: 'Kitchen', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
  { id: 'pompe_eau_coffee', name: 'Pompe eau / système', defaultPower: 200, icon: 'Waves', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
  { id: 'eclairage_led_coffee', name: 'Éclairage LED', defaultPower: 50, icon: 'Light', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },
  { id: 'pos_caisse_coffee', name: 'POS / caisse', defaultPower: 40, icon: 'PointOfSale', category: CATEGORIES[1], subCategory: 'Coffee trucks (56.10C)' },

  // 2.4 Pop-up retail (47.19B)
  { id: 'eclairage_vitrine_led', name: 'Éclairage vitrine LED', defaultPower: 200, icon: 'Light', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
  { id: 'ecrans_publicitaires', name: 'Écrans publicitaires', defaultPower: 150, icon: 'DisplaySettings', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
  { id: 'caisse_pos', name: 'Caisse / POS', defaultPower: 40, icon: 'PointOfSale', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
  { id: 'routeur_internet_popup', name: 'Routeur internet', defaultPower: 10, icon: 'Router', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
  { id: 'terminal_paiement', name: 'Terminal paiement', defaultPower: 10, icon: 'CreditCard', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },
  { id: 'climatisation_mobile_popup', name: 'Climatisation mobile', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[1], subCategory: 'Pop-up retail (47.19B)' },

  // 2.5 Stands commerciaux mobiles (73.11Z)
  { id: 'ecran_interactif', name: 'Écran interactif', defaultPower: 200, icon: 'TouchApp', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
  { id: 'pc_portable_stand', name: 'PC portable', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
  { id: 'imprimante_tickets', name: 'Imprimante tickets', defaultPower: 50, icon: 'Print', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
  { id: 'eclairage_led_stand', name: 'Éclairage LED', defaultPower: 100, icon: 'Light', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },
  { id: 'routeur_4g_stand', name: 'Routeur 4G', defaultPower: 10, icon: 'Router', category: CATEGORIES[1], subCategory: 'Stands commerciaux mobiles (73.11Z)' },

  // 2.6 Retail mobile premium (47.43Z)
  { id: 'eclairage_design_led', name: 'Éclairage design LED', defaultPower: 300, icon: 'Light', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
  { id: 'vitrine_refrigeree', name: 'Vitrine réfrigérée', defaultPower: 400, icon: 'Kitchen', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
  { id: 'systeme_audio_ambiance', name: 'Système audio ambiance', defaultPower: 150, icon: 'VolumeUp', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
  { id: 'pos_paiement', name: 'POS + paiement', defaultPower: 50, icon: 'PointOfSale', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
  { id: 'climatisation_mobile_premium', name: 'Climatisation mobile', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },
  { id: 'ecran_marketing', name: 'Écran marketing', defaultPower: 200, icon: 'DisplaySettings', category: CATEGORIES[1], subCategory: 'Retail mobile premium (47.43Z)' },

  // ─────────────────────────────────────────────────────────────
  // 3. Travail mobile & services professionnels
  // ─────────────────────────────────────────────────────────────
  // 3.1 Coworking mobile
  { id: 'ordinateurs_portables_x3', name: 'Ordinateurs portables (x3 moy.)', defaultPower: 180, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
  { id: 'ecrans_externes', name: 'Écrans externes', defaultPower: 90, icon: 'Monitor', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
  { id: 'routeur_4g_3', name: 'Routeur 4G/5G', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
  { id: 'imprimante_compacte', name: 'Imprimante compacte', defaultPower: 50, icon: 'Print', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
  { id: 'eclairage_led_coworking', name: 'Éclairage LED', defaultPower: 80, icon: 'Light', category: CATEGORIES[2], subCategory: 'Coworking mobile' },
  { id: 'chargeurs_divers', name: 'Chargeurs divers', defaultPower: 60, icon: 'ChargingStation', category: CATEGORIES[2], subCategory: 'Coworking mobile' },

  // 3.2 Télétravail entreprise mobile
  { id: 'laptop_pro', name: 'Laptop pro', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
  { id: 'ecran_externe_teletravail', name: 'Écran externe', defaultPower: 40, icon: 'Monitor', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
  { id: 'routeur_internet_teletravail', name: 'Routeur internet', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
  { id: 'smartphone_charge', name: 'Smartphone / charge', defaultPower: 10, icon: 'Smartphone', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },
  { id: 'eclairage_led_teletravail', name: 'Éclairage LED', defaultPower: 30, icon: 'Light', category: CATEGORIES[2], subCategory: 'Télétravail entreprise mobile' },

  // 3.3 Consultants terrain
  { id: 'laptop_leger', name: 'Laptop léger', defaultPower: 60, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
  { id: 'tablette_consultant', name: 'Tablette', defaultPower: 15, icon: 'Tablet', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
  { id: 'smartphone_consultant', name: 'Smartphone', defaultPower: 10, icon: 'Smartphone', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
  { id: 'routeur_mobile_consultant', name: 'Routeur mobile', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Consultants terrain' },
  { id: 'batterie_externe', name: 'Batterie externe / charge', defaultPower: 20, icon: 'BatteryChargingFull', category: CATEGORIES[2], subCategory: 'Consultants terrain' },

  // 3.4 Formateurs itinérants
  { id: 'pc_portable_formateur', name: 'PC portable', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
  { id: 'videoprojecteur', name: 'Vidéoprojecteur', defaultPower: 250, icon: 'Projector', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
  { id: 'ecran_portable_formateur', name: 'Écran portable', defaultPower: 60, icon: 'Monitor', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
  { id: 'sonorisation_portable', name: 'Sonorisation portable', defaultPower: 80, icon: 'VolumeUp', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
  { id: 'routeur_4g_formateur', name: 'Routeur 4G', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },
  { id: 'eclairage_salle', name: 'Éclairage salle', defaultPower: 100, icon: 'Light', category: CATEGORIES[2], subCategory: 'Formateurs itinérants' },

  // 3.5 Architectes terrain
  { id: 'station_cao', name: 'Station CAO (laptop puissant)', defaultPower: 120, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
  { id: 'ecran_haute_resolution', name: 'Écran haute résolution', defaultPower: 60, icon: 'Monitor', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
  { id: 'tablette_graphique_archi', name: 'Tablette graphique', defaultPower: 20, icon: 'Draw', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
  { id: 'stockage_ssd_nas', name: 'Stockage SSD/NAS', defaultPower: 40, icon: 'Storage', category: CATEGORIES[2], subCategory: 'Architectes terrain' },
  { id: 'routeur_internet_archi', name: 'Routeur internet', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Architectes terrain' },

  // 3.6 Bureaux d'études terrain
  { id: 'stations_calcul', name: 'Stations de calcul', defaultPower: 150, icon: 'DesktopWindows', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
  { id: 'ecrans_doubles', name: 'Écrans doubles', defaultPower: 80, icon: 'Monitor', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
  { id: 'instruments_mesure', name: 'Instruments de mesure', defaultPower: 30, icon: 'Straighten', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
  { id: 'serveur_portable', name: 'Serveur portable', defaultPower: 80, icon: 'Storage', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },
  { id: 'routeur_4g_etudes', name: 'Routeur 4G', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: "Bureaux d'études terrain" },

  // 3.7 Géomètres
  { id: 'station_gnss', name: 'Station GNSS', defaultPower: 20, icon: 'Explore', category: CATEGORIES[2], subCategory: 'Géomètres' },
  { id: 'ordinateur_portable_geo', name: 'Ordinateur portable', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[2], subCategory: 'Géomètres' },
  { id: 'scanner_3d_terrain', name: 'Scanner 3D terrain', defaultPower: 80, icon: 'ViewInAr', category: CATEGORIES[2], subCategory: 'Géomètres' },
  { id: 'tablette_terrain', name: 'Tablette terrain', defaultPower: 15, icon: 'Tablet', category: CATEGORIES[2], subCategory: 'Géomètres' },
  { id: 'routeur_mobile_geo', name: 'Routeur mobile', defaultPower: 10, icon: 'Router', category: CATEGORIES[2], subCategory: 'Géomètres' },

  // ─────────────────────────────────────────────────────────────
  // 4. BTP, maintenance & interventions techniques
  // ─────────────────────────────────────────────────────────────
  // 4.1 Maintenance industrielle mobile (33.12Z)
  { id: 'outillage_electroportatif', name: 'Outillage électroportatif (moyenne)', defaultPower: 800, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
  { id: 'compresseur_portable', name: 'Compresseur portable', defaultPower: 1500, icon: 'Compress', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
  { id: 'poste_souder_inverter', name: 'Poste à souder inverter', defaultPower: 4000, icon: 'Bolt', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
  { id: 'lampe_chantier_led', name: 'Lampe chantier LED', defaultPower: 100, icon: 'Light', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },
  { id: 'chargeurs_batteries_btp', name: 'Chargeurs batteries', defaultPower: 200, icon: 'BatteryChargingFull', category: CATEGORIES[3], subCategory: 'Maintenance industrielle mobile (33.12Z)' },

  // 4.2 Réparation équipements terrain (33.20A)
  { id: 'outillage_mixte', name: 'Outillage mixte (visseuse, meuleuse)', defaultPower: 600, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
  { id: 'station_diagnostic', name: 'Station diagnostic portable', defaultPower: 120, icon: 'Diagnostics', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
  { id: 'fer_souder_electronique', name: 'Fer à souder / électronique', defaultPower: 80, icon: 'Bolt', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
  { id: 'eclairage_atelier_mobile', name: 'Éclairage atelier mobile', defaultPower: 150, icon: 'Light', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },
  { id: 'pc_portable_diagnostic', name: 'PC portable diagnostic', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[3], subCategory: 'Réparation équipements terrain (33.20A)' },

  // 4.3 Installateurs électriques mobiles (43.21A)
  { id: 'perforateur_perceuse', name: 'Perforateur / perceuse', defaultPower: 1000, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
  { id: 'meuleuse', name: 'Meuleuse', defaultPower: 1200, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
  { id: 'testeurs_electriques', name: 'Testeurs électriques', defaultPower: 30, icon: 'ElectricalServices', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
  { id: 'aspirateur_chantier', name: 'Aspirateur chantier', defaultPower: 1200, icon: 'CleaningServices', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },
  { id: 'eclairage_chantier_led_el', name: 'Éclairage chantier LED', defaultPower: 150, icon: 'Light', category: CATEGORIES[3], subCategory: 'Installateurs électriques mobiles (43.21A)' },

  // 4.4 Installateurs solaires (43.22A)
  { id: 'outillage_electroportatif_solaire', name: 'Outillage électroportatif', defaultPower: 800, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
  { id: 'analyseur_reseau_solaire', name: 'Analyseur réseau solaire', defaultPower: 60, icon: 'SolarPower', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
  { id: 'pc_portable_terrain_solaire', name: 'PC portable terrain', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
  { id: 'charge_batteries_outils', name: 'Charge batteries outils', defaultPower: 300, icon: 'BatteryChargingFull', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },
  { id: 'eclairage_chantier_solaire', name: 'Éclairage chantier', defaultPower: 100, icon: 'Light', category: CATEGORIES[3], subCategory: 'Installateurs solaires (43.22A)' },

  // 4.5 Techniciens télécom terrain (61.20Z)
  { id: 'soudeuse_fibre_optique', name: 'Soudeuse fibre optique', defaultPower: 60, icon: 'Cable', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
  { id: 'otdr_analyse_reseau', name: 'OTDR / analyse réseau', defaultPower: 40, icon: 'NetworkCheck', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
  { id: 'pc_portable_diagnostic_telecom', name: 'PC portable diagnostic', defaultPower: 70, icon: 'Laptop', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
  { id: 'routeur_test_4g', name: 'Routeur test / 4G', defaultPower: 10, icon: 'Router', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },
  { id: 'eclairage_terrain_telecom', name: 'Éclairage terrain', defaultPower: 100, icon: 'Light', category: CATEGORIES[3], subCategory: 'Techniciens télécom terrain (61.20Z)' },

  // 4.6 Chantiers mobiles BTP (43.99C)
  { id: 'outillage_chantier_mixte', name: 'Outillage chantier mixte', defaultPower: 1500, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
  { id: 'compresseur_chantier', name: 'Compresseur', defaultPower: 2000, icon: 'Compress', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
  { id: 'betonniere_electrique', name: 'Bétonnière électrique', defaultPower: 1000, icon: 'Construction', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
  { id: 'eclairage_chantier_btp', name: 'Éclairage chantier', defaultPower: 300, icon: 'Light', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },
  { id: 'groupes_alimentation_mobile', name: "Groupes d'alimentation mobile", defaultPower: 2000, icon: 'Bolt', category: CATEGORIES[3], subCategory: 'Chantiers mobiles BTP (43.99C)' },

  // 4.7 Bases vie chantier (43.99C)
  { id: 'refrigerateur_base_vie', name: 'Réfrigérateur', defaultPower: 150, icon: 'Kitchen', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
  { id: 'eclairage_led_base_vie', name: 'Éclairage LED', defaultPower: 200, icon: 'Light', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
  { id: 'climatisation_mobile_base_vie', name: 'Climatisation mobile', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
  { id: 'chauffe_eau_base_vie', name: 'Chauffe-eau', defaultPower: 2200, icon: 'HotTub', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
  { id: 'pc_administratif', name: 'PC / administratif', defaultPower: 100, icon: 'DesktopWindows', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },
  { id: 'recharge_outils_base_vie', name: 'Recharge outils', defaultPower: 300, icon: 'BatteryChargingFull', category: CATEGORIES[3], subCategory: 'Bases vie chantier (43.99C)' },

  // ─────────────────────────────────────────────────────────────
  // 5. Agriculture & sites isolés
  // ─────────────────────────────────────────────────────────────
  // 5.1 Agriculture mobile (01.50Z)
  { id: 'pompe_arrosage_mobile', name: "Pompe d'arrosage mobile", defaultPower: 1000, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
  { id: 'groupe_pression_eau', name: 'Groupe de pression eau', defaultPower: 800, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
  { id: 'chambre_froide_mobile', name: 'Chambre froide mobile', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
  { id: 'eclairage_led_exploitation', name: 'Éclairage LED exploitation', defaultPower: 100, icon: 'Light', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
  { id: 'chargeurs_outils_agri', name: 'Chargeurs / outils', defaultPower: 200, icon: 'BatteryChargingFull', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },
  { id: 'petit_materiel_electrique', name: 'Petit matériel électrique', defaultPower: 300, icon: 'ElectricalServices', category: CATEGORIES[4], subCategory: 'Agriculture mobile (01.50Z)' },

  // 5.2 Irrigation autonome (01.61Z)
  { id: 'pompe_immergee', name: 'Pompe immergée', defaultPower: 1500, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
  { id: 'pompe_surface', name: 'Pompe de surface', defaultPower: 1000, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
  { id: 'systeme_automatise_irrigation', name: "Système automatisé irrigation", defaultPower: 50, icon: 'SmartToy', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
  { id: 'capteurs_sol_meteo', name: 'Capteurs sol / météo', defaultPower: 20, icon: 'Cloud', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
  { id: 'routeur_iot', name: 'Routeur IoT', defaultPower: 10, icon: 'Router', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },
  { id: 'batterie_controle', name: 'Batterie / contrôle', defaultPower: 100, icon: 'BatteryChargingFull', category: CATEGORIES[4], subCategory: 'Irrigation autonome (01.61Z)' },

  // 5.3 Exploitations isolées (01.50Z)
  { id: 'refrigerateur_solaire_agri', name: 'Réfrigérateur solaire', defaultPower: 120, icon: 'Kitchen', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
  { id: 'congelateur_agri', name: 'Congélateur', defaultPower: 150, icon: 'Kitchen', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
  { id: 'eclairage_led_habitation', name: 'Éclairage LED habitation', defaultPower: 80, icon: 'Light', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
  { id: 'tv_divertissement_agri', name: 'TV / divertissement', defaultPower: 100, icon: 'Tv', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
  { id: 'pompe_eau_domestique', name: 'Pompe eau domestique', defaultPower: 600, icon: 'Waves', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
  { id: 'routeur_internet_satellite', name: 'Routeur internet satellite', defaultPower: 50, icon: 'Router', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },
  { id: 'recharge_appareils_agri', name: 'Recharge appareils', defaultPower: 200, icon: 'ChargingStation', category: CATEGORIES[4], subCategory: 'Exploitations isolées (01.50Z)' },

  // ─────────────────────────────────────────────────────────────
  // 6. Secours, humanitaire & sécurité
  // ─────────────────────────────────────────────────────────────
  // 6.1 ONG terrain (88.99B)
  { id: 'ordinateurs_portables_ong', name: 'Ordinateurs portables', defaultPower: 120, icon: 'Laptop', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
  { id: 'routeur_satellite_4g_ong', name: 'Routeur satellite / 4G', defaultPower: 50, icon: 'Router', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
  { id: 'stations_recharge_ong', name: 'Stations de recharge', defaultPower: 200, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
  { id: 'eclairage_led_base_ong', name: 'Éclairage LED base', defaultPower: 150, icon: 'Light', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
  { id: 'refrigerateur_medical_ong', name: 'Réfrigérateur médical', defaultPower: 200, icon: 'Kitchen', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },
  { id: 'charge_dispositifs_mobiles', name: 'Charge dispositifs mobiles', defaultPower: 100, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'ONG terrain (88.99B)' },

  // 6.2 Missions humanitaires mobiles (88.99B)
  { id: 'communication_satellite', name: 'Communication satellite', defaultPower: 60, icon: 'Satellite', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
  { id: 'pc_terrain_humanitaire', name: 'PC terrain', defaultPower: 100, icon: 'Laptop', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
  { id: 'systemes_recharge_mobile', name: 'Systèmes recharge mobile', defaultPower: 300, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
  { id: 'eclairage_mobile_led', name: 'Éclairage mobile LED', defaultPower: 200, icon: 'Light', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
  { id: 'refrigeration_medicale', name: 'Réfrigération médicale', defaultPower: 200, icon: 'Kitchen', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },
  { id: 'pompe_eau_mobile_humanitaire', name: 'Pompe eau mobile', defaultPower: 600, icon: 'Waves', category: CATEGORIES[5], subCategory: 'Missions humanitaires mobiles (88.99B)' },

  // 6.3 Secours mobiles (86.90A)
  { id: 'eclairage_intervention', name: "Éclairage d'intervention", defaultPower: 300, icon: 'Light', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
  { id: 'radios_communication', name: 'Radios / communication', defaultPower: 30, icon: 'Radio', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
  { id: 'chargeurs_batteries_secours', name: 'Chargeurs batteries', defaultPower: 200, icon: 'BatteryChargingFull', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
  { id: 'defibrillateur_medical', name: 'Défibrillateur / médical', defaultPower: 50, icon: 'MedicalServices', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },
  { id: 'pc_coordination', name: 'PC coordination', defaultPower: 100, icon: 'DesktopWindows', category: CATEGORIES[5], subCategory: 'Secours mobiles (86.90A)' },

  // 6.4 Protection civile (84.25Z)
  { id: 'centre_commandement_mobile', name: 'Centre de commandement mobile', defaultPower: 300, icon: 'SettingsRemote', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
  { id: 'radios_multi_frequences', name: 'Radios multi-fréquences', defaultPower: 40, icon: 'Radio', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
  { id: 'eclairage_urgence', name: "Éclairage d'urgence", defaultPower: 500, icon: 'Light', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
  { id: 'surveillance_video_mobile', name: 'Surveillance vidéo mobile', defaultPower: 200, icon: 'Videocam', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
  { id: 'serveur_coordination', name: 'Serveur de coordination', defaultPower: 150, icon: 'Storage', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },
  { id: 'recharge_equipements_protection', name: 'Recharge équipements', defaultPower: 300, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'Protection civile (84.25Z)' },

  // 6.5 Bases médicales mobiles (86.10Z)
  { id: 'refrigerateur_vaccins', name: 'Réfrigérateur vaccins', defaultPower: 200, icon: 'Kitchen', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
  { id: 'concentrateur_oxygene', name: "Concentrateur d'oxygène", defaultPower: 350, icon: 'MedicalServices', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
  { id: 'eclairage_medical_led', name: 'Éclairage médical LED', defaultPower: 150, icon: 'Light', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
  { id: 'autoclave_portable', name: 'Autoclave portable', defaultPower: 2000, icon: 'MedicalServices', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
  { id: 'moniteurs_medicaux', name: 'Moniteurs médicaux', defaultPower: 100, icon: 'MonitorHeart', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },
  { id: 'pc_medical', name: 'PC médical', defaultPower: 100, icon: 'DesktopWindows', category: CATEGORIES[5], subCategory: 'Bases médicales mobiles (86.10Z)' },

  // 6.6 Sécurité événementielle mobile (80.10Z)
  { id: 'camera_surveillance', name: 'Caméras de surveillance', defaultPower: 10, icon: 'Videocam', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
  { id: 'centre_controle_mobile', name: 'Centre de contrôle mobile', defaultPower: 150, icon: 'SettingsRemote', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
  { id: 'eclairage_securite', name: 'Éclairage sécurité', defaultPower: 300, icon: 'Light', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
  { id: 'radios_securite', name: 'Radios sécurité', defaultPower: 30, icon: 'Radio', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
  { id: 'ecrans_monitoring', name: 'Écrans monitoring', defaultPower: 200, icon: 'Monitor', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },
  { id: 'recharge_equipements_securite', name: 'Recharge équipements', defaultPower: 200, icon: 'ChargingStation', category: CATEGORIES[5], subCategory: 'Sécurité événementielle mobile (80.10Z)' },

  // ─────────────────────────────────────────────────────────────
  // 7. Hospitality & hébergements off-grid
  // ─────────────────────────────────────────────────────────────
  // 7.1 Hospitality outdoor premium (55.10Z)
  { id: 'climatisation_chauffage', name: 'Climatisation / chauffage', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
  { id: 'eclairage_ambiance_led', name: 'Éclairage ambiance LED', defaultPower: 150, icon: 'Light', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
  { id: 'refrigeration_minibar', name: 'Réfrigération minibar', defaultPower: 120, icon: 'Kitchen', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
  { id: 'chauffe_eau_premium', name: 'Chauffe-eau', defaultPower: 2200, icon: 'HotTub', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
  { id: 'tv_divertissement_premium', name: 'TV / divertissement', defaultPower: 100, icon: 'Tv', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
  { id: 'routeur_internet_premium', name: 'Routeur internet', defaultPower: 10, icon: 'Router', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },
  { id: 'recharge_appareils_clients', name: 'Recharge appareils clients', defaultPower: 200, icon: 'ChargingStation', category: CATEGORIES[6], subCategory: 'Hospitality outdoor premium (55.10Z)' },

  // 7.2 Glamping professionnel (55.20Z)
  { id: 'chauffage_mobile_clim', name: 'Chauffage mobile / clim', defaultPower: 1200, icon: 'AcUnit', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
  { id: 'eclairage_led_tente', name: 'Éclairage LED tente', defaultPower: 100, icon: 'Light', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
  { id: 'refrigerateur_compact', name: 'Réfrigérateur compact', defaultPower: 100, icon: 'Kitchen', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
  { id: 'chauffe_eau_instantanee', name: 'Chauffe-eau instantané', defaultPower: 2000, icon: 'HotTub', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
  { id: 'prises_recharge_clients', name: 'Prises recharge clients', defaultPower: 150, icon: 'ChargingStation', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },
  { id: 'wifi_routeur_glamping', name: 'WiFi / routeur', defaultPower: 10, icon: 'Router', category: CATEGORIES[6], subCategory: 'Glamping professionnel (55.20Z)' },

  // 7.3 Hébergements off-grid (55.20Z)
  { id: 'refrigerateur_solaire_offgrid', name: 'Réfrigérateur solaire', defaultPower: 120, icon: 'Kitchen', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
  { id: 'systeme_solaire_onduleur', name: 'Système solaire + onduleur (pertes)', defaultPower: 200, icon: 'SolarPower', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
  { id: 'eclairage_led_logement', name: 'Éclairage LED logement', defaultPower: 80, icon: 'Light', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
  { id: 'chauffage_climatisation_offgrid', name: 'Chauffage / climatisation', defaultPower: 1500, icon: 'AcUnit', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
  { id: 'pompe_eau_autonome', name: 'Pompe eau autonome', defaultPower: 600, icon: 'Waves', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
  { id: 'routeur_satellite_4g_offgrid', name: 'Routeur satellite / 4G', defaultPower: 50, icon: 'Router', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
  { id: 'recharge_equipements_offgrid', name: 'Recharge équipements', defaultPower: 150, icon: 'ChargingStation', category: CATEGORIES[6], subCategory: 'Hébergements off-grid (55.20Z)' },
];