import { Box } from '@mui/material';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar />
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}
