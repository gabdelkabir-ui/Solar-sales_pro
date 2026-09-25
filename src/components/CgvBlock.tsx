import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
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
  <Paper ref={paperRef} elevation={0} sx={sx}>
    <Divider sx={{ my: 2 }} />
    <Typography variant="body1" align="center" sx={{ fontWeight: 'bold', fontSize: '0.9rem', mb: 1 }}>
      {CGV_TITLE}
    </Typography>
    {clauses.length === 0 ? (
      <Typography variant="body2" sx={{ fontSize: '0.7rem', textAlign: 'justify' }}>
        Aucune condition générale de vente configurée.
      </Typography>
    ) : (
      clauses.map((clause, ci) => (
        <Box key={ci} sx={{ mb: 1 }}>
          {clause.title && (
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
              {clause.title}
            </Typography>
          )}
          <Typography variant="body2" sx={{ fontSize: '0.7rem', textAlign: 'justify', lineHeight: 1.4 }}>
            {clause.paragraphs.join(' ')}
          </Typography>
        </Box>
      ))
    )}
  </Paper>
);

export default CgvBlock;