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
  Stack,
  Divider,
  Chip,
  Fade,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
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
  equipment: any[];
  recommendation: any;
  createdAt: string;
}

const STORAGE_KEY = 'solar_saved_projects';

const SavedProjects: React.FC = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadProjects = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProjects(JSON.parse(saved));
      } else {
        setProjects([]);
      }
    } catch {
      setProjects([]);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleToggleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
  };

  const handleDelete = (id: number) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <Fade in timeout={500}>
      <Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              <FolderOpenIcon sx={{ mr: 1, verticalAlign: 'middle', WebkitTextFillColor: theme.palette.primary.main }} />
              Projets enregistrés
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {projects.length} projet{projects.length > 1 ? 's' : ''} enregistré{projects.length > 1 ? 's' : ''} localement
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProjects}
            sx={{ borderRadius: 3, textTransform: 'none' }}
          >
            Actualiser
          </Button>
        </Box>

        {projects.length === 0 ? (
          <Paper 
            sx={{ 
              p: 8, 
              textAlign: 'center',
              borderRadius: 4,
              border: `2px dashed ${theme.palette.divider}`,
            }}
          >
            <FolderOpenIcon sx={{ fontSize: 72, color: theme.palette.action.disabled, mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
              Aucun projet enregistré
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Les projets que vous enregistrerez depuis l'onglet "Recommandation" apparaîtront ici.
            </Typography>
          </Paper>
        ) : (
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                  <TableCell width={50} />
                  <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Téléphone</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Ville</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell width={100} align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <React.Fragment key={project.id}>
                    <TableRow 
                      hover 
                      sx={{ 
                        '&:hover': { bgcolor: theme.palette.action.hover },
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleExpand(project.id)}
                          sx={{ 
                            '&:hover': { bgcolor: theme.palette.primary.light + '30' },
                          }}
                        >
                          {expandedId === project.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {project.customer.name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{project.customer.phone || '—'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={project.customer.city || '—'} 
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(project.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDelete(project.id)}
                          title="Supprimer"
                          sx={{ 
                            '&:hover': { bgcolor: theme.palette.error.light + '30' },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={expandedId === project.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, bgcolor: theme.palette.action.hover, borderRadius: 2 }}>
                            <Stack spacing={3}>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                Détails du projet
                              </Typography>
                              
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                                  Client
                                </Typography>
                                <Box sx={{ pl: 2 }}>
                                  <Typography variant="body2">
                                    <strong>Nom :</strong> {project.customer.name || '—'}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Téléphone :</strong> {project.customer.phone || '—'}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Ville :</strong> {project.customer.city || '—'}
                                  </Typography>
                                  {project.customer.notes && (
                                    <Typography variant="body2">
                                      <strong>Notes :</strong> {project.customer.notes}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>

                              <Divider />

                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                                  Équipements ({project.equipment?.length || 0})
                                </Typography>
                                <Box sx={{ pl: 2 }}>
                                  {project.equipment && project.equipment.length > 0 ? (
                                    <Stack spacing={0.5}>
                                      {project.equipment.map((eq: any, idx: number) => (
                                        <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                          <Chip 
                                            label={`${eq.quantity}x`} 
                                            size="small" 
                                            color="primary"
                                            variant="outlined"
                                            sx={{ minWidth: 40 }}
                                          />
                                          <Typography variant="body2">
                                            {eq.name} — {eq.power}W ({eq.hoursPerDay}h/jour)
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Stack>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">Aucun équipement</Typography>
                                  )}
                                </Box>
                              </Box>

                              {project.recommendation && Object.keys(project.recommendation).length > 0 && (
                                <>
                                  <Divider />
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                                      Recommandation
                                    </Typography>
                                    <Box sx={{ pl: 2, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                          Panneaux
                                        </Typography>
                                        <Typography variant="body2">
                                          {project.recommendation.panelCount}x {project.recommendation.panelModel}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {project.recommendation.panelPower} Wp
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                                          Batterie
                                        </Typography>
                                        <Typography variant="body2">
                                          {project.recommendation.batteryModel}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {project.recommendation.batteryCapacity} kWh
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#f57c00' }}>
                                          Onduleur
                                        </Typography>
                                        <Typography variant="body2">
                                          {project.recommendation.inverterModel}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {project.recommendation.inverterPower} W
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </>
                              )}
                            </Stack>
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
      </Box>
    </Fade>
  );
};

export default SavedProjects;