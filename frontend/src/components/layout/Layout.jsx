import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar />
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        minHeight: '100vh',
        pt: isMobile ? '56px' : 0,  // offset for fixed mobile top bar
      }}>
        {children}
      </Box>
    </Box>
  );
}
