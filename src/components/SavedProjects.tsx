import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  createdAt: string;
}

interface FullProject extends SavedProject {
  equipment: any[];
  recommendation: any;
}

const API_URL = `http://${window.location.hostname}:5000/api/projects`;

const SavedProjects: React.FC = () => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedProject, setExpandedProject] = useState<FullProject | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) {
        throw new Error('Erreur lors de la suppression');
      }
      // Remove from local list regardless (404 means it's already gone)
      setProjects(projects.filter((p) => p.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedProject(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
    setDeleteConfirm(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateStr;
    }
  };

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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell>Client</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell>Ville</TableCell>
                <TableCell>Date</TableCell>
                <TableCell width={100}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
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
                    <TableCell>{formatDate(project.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => setDeleteConfirm(project.id)}
                        title="Supprimer"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button 
            color="error" 
            variant="contained" 
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedProjects;