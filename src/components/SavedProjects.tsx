import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Collapse,
  CircularProgress,
  Stack,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavedProject {
  id: number;
  customer: {
    name: string;
    phone: string;
    city: string;
    notes: string;
  };
  orderNumber: string | null;
  createdAt: string;
}

interface FullProject extends SavedProject {
  equipment: any[];
  recommendation: any;
}

const API_URL = `http://${window.location.hostname}:5000/api/projects`;

interface SavedProjectsProps {
  onGenerateReport?: (projectId: number) => void;
  onGenerateInvoice?: (projectId: number) => void;
  onViewSimulation?: (projectId: number) => void;
}

const SavedProjects: React.FC<SavedProjectsProps> = ({ onGenerateReport, onGenerateInvoice, onViewSimulation }) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedProject, setExpandedProject] = useState<FullProject | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Fetch projects failed:', err);
      setError('Impossible de charger les projets. Vérifiez que le serveur backend est en cours d\'exécution.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleToggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedProject(null);
      return;
    }
    setExpandedId(id);
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/${id}`);
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setExpandedProject(data);
    } catch (err) {
      console.error('Fetch project detail failed:', err);
      setExpandedProject(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase().trim();
    return projects.filter((project) => {
      const name = (project.customer.name || '').toLowerCase();
      const phone = (project.customer.phone || '').toLowerCase();
      const city = (project.customer.city || '').toLowerCase();
      const orderNum = (project.orderNumber || '').toLowerCase();
      const date = formatDateShort(project.createdAt).toLowerCase();
      return name.includes(query) || phone.includes(query) || city.includes(query) || orderNum.includes(query) || date.includes(query);
    });
  }, [projects, searchQuery]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary">Projets enregistrés</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchProjects}
          disabled={loading}
        >
          Actualiser
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fff3f3' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {!loading && !error && projects.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Aucun projet enregistré pour le moment.
          </Typography>
        </Paper>
      )}

      {!loading && !error && projects.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher par client, téléphone, ville, date ou numéro de commande..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            size="small"
          />
        </Box>
      )}

      {!loading && !error && projects.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell>Client</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Ville</TableCell>
                <TableCell>N° Commande</TableCell>
                <TableCell>Date</TableCell>
                <TableCell width={150}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Aucun projet trouvé pour "{searchQuery}"
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <React.Fragment key={project.id}>
                    <TableRow hover sx={{ '&:hover': { cursor: 'pointer' } }}>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleToggleExpand(project.id)}>
                          {expandedId === project.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'bold' }}>{project.customer.name || '—'}</Typography>
                      </TableCell>
                      <TableCell>{project.customer.phone || '—'}</TableCell>
                      <TableCell>{project.customer.city || '—'}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'medium', fontFamily: 'monospace' }}>
                          {project.orderNumber || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(project.createdAt)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {onGenerateReport && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => onGenerateReport(project.id)}
                              title="Générer le rapport"
                              sx={{ minWidth: 0, px: 1, fontSize: '0.75rem' }}
                            >
                              Rapport
                            </Button>
                          )}
                          {onGenerateInvoice && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => onGenerateInvoice(project.id)}
                              title="Générer la facture"
                              sx={{ minWidth: 0, px: 1, fontSize: '0.75rem' }}
                            >
                              Facture
                            </Button>
                          )}
                          {onViewSimulation && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => onViewSimulation(project.id)}
                              title="Voir la simulation énergétique"
                              sx={{ minWidth: 0, px: 1, fontSize: '0.75rem' }}
                            >
                              Simulation
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedId === project.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3 }}>
                            {loadingDetail && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={24} />
                              </Box>
                            )}
                            {!loadingDetail && expandedProject && expandedProject.id === project.id && (
                              <Stack spacing={2}>
                                <Typography variant="h6" gutterBottom>Détails du projet</Typography>
                                
                                <Box>
                                  <Typography variant="subtitle2" color="primary">Client</Typography>
                                  <Box sx={{ pl: 2 }}>
                                    <Typography variant="body2"><strong>Nom:</strong> {expandedProject.customer.name || '—'}</Typography>
                                    <Typography variant="body2"><strong>Téléphone:</strong> {expandedProject.customer.phone || '—'}</Typography>
                                    <Typography variant="body2"><strong>Ville:</strong> {expandedProject.customer.city || '—'}</Typography>
                                    {expandedProject.customer.notes && (
                                      <Typography variant="body2"><strong>Notes:</strong> {expandedProject.customer.notes}</Typography>
                                    )}
                                  </Box>
                                </Box>

                                <Divider />

                                <Box>
                                  <Typography variant="subtitle2" color="primary">Équipements</Typography>
                                  <Box sx={{ pl: 2 }}>
                                    {expandedProject.equipment && expandedProject.equipment.length > 0 ? (
                                      expandedProject.equipment.map((eq: any, idx: number) => (
                                        <Box key={idx} sx={{ mb: 0.5 }}>
                                          <Typography variant="body2">
                                            {eq.name} — {eq.quantity}x {eq.power}W ({eq.hoursPerDay}h/jour)
                                          </Typography>
                                        </Box>
                                      ))
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">Aucun équipement</Typography>
                                    )}
                                  </Box>
                                </Box>

                                {expandedProject.recommendation && Object.keys(expandedProject.recommendation).length > 0 && (
                                  <>
                                    <Divider />
                                    <Box>
                                      <Typography variant="subtitle2" color="primary">Recommandation</Typography>
                                      <Box sx={{ pl: 2 }}>
                                        <Typography variant="body2">
                                          <strong>Panneaux:</strong> {expandedProject.recommendation.panelCount}x {expandedProject.recommendation.panelModel} ({expandedProject.recommendation.panelPower} Wp)
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Batterie:</strong> {expandedProject.recommendation.batteryModel} ({expandedProject.recommendation.batteryCapacity} kWh)
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Onduleur:</strong> {expandedProject.recommendation.inverterModel} ({expandedProject.recommendation.inverterPower} W)
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </>
                                )}
                              </Stack>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && !error && projects.length > 0 && filteredProjects.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} affiché{filteredProjects.length > 1 ? 's' : ''}
            {searchQuery && ` (sur ${projects.length} total)`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SavedProjects;