import { BrowserRouter } from 'react-router-dom';
import { FitupAdminProvider } from './components/FitupAdminContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <FitupAdminProvider>
        <AppRoutes />
      </FitupAdminProvider>
    </BrowserRouter>
  );
}
