import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { CgvClause, CGV_TITLE } from '../constants/cgv';

type PaperRef = { current: HTMLDivElement | null };
type SxType = Record<string, any>;

interface CgvBlockProps {
  clauses: CgvClause[];
  /** Référence vers le Paper (utilisée par la capture PDF / page 2) */
  paperRef?: PaperRef;
  sx?: SxType;
}

/**
 * Affiche les Conditions Générales de Vente sur une page dédiée.
 * Le contenu est fourni en clauses structurées (générées dynamiquement).
 * La pagination imprimée/PDF est gérée par le style pageBreakBefore.
 */
const CgvBlock: React.FC<CgvBlockProps> = ({ clauses, paperRef, sx }) => (
  <Paper
    ref={paperRef}
    elevation={0}
    sx={{
      ...sx,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '1120px',
      px: { xs: 4, sm: 6 },
      py: 4,
    }}
  >
    <Box sx={{ flex: 1 }}>
      <Typography variant="body1" align="center" sx={{ fontWeight: 'bold', fontSize: '1.05rem', mb: 2.5, letterSpacing: 0.2 }}>
        {CGV_TITLE}
      </Typography>
      {clauses.length === 0 ? (
        <Typography variant="body2" sx={{ fontSize: '0.75rem', textAlign: 'justify' }}>
          Aucune condition générale de vente configurée.
        </Typography>
      ) : (
        clauses.map((clause, ci) => (
          <Box key={ci} sx={{ mb: 0.6 }}>
            {clause.title && (
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.72rem' }}>
                {clause.title}
              </Typography>
            )}
            {clause.paragraphs.map((paragraph, pi) => (
              <Typography key={pi} variant="body2" sx={{ fontSize: '0.66rem', textAlign: 'justify', lineHeight: 1.18, mb: 0.45 }}>
                {paragraph}
              </Typography>
            ))}
          </Box>
        ))
      )}
    </Box>
    <Typography variant="caption" align="center" display="block" sx={{ fontSize: '0.64rem', mt: 2 }}>
      EASY POWER SASU RCS Clermont-Ferrand 831835425 - 31 Rue des Martres de Madargue 63200. RIOM. France
    </Typography>
  </Paper>
);

export default CgvBlock;
