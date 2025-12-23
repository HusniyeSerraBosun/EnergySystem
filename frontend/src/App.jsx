import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrganizationOperations from './pages/OrganizationOperations';
import MarketData from './pages/MarketData';
import ConsumptionData from './pages/ConsumptionData';
import GenerationData from './pages/GenerationData';
import PlantOperations from './pages/PlantOperations';
import UserOperations from './pages/UserOperations'; 
import PlantEvents from './pages/PlantEvents';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* --- ASSET MANAGEMENT --- */}
        <Route path="/organization" element={<ProtectedRoute><OrganizationOperations /></ProtectedRoute>} />
        <Route path="/plant" element={<ProtectedRoute><PlantOperations /></ProtectedRoute>} />
        <Route path="/plant/list" element={<ProtectedRoute><PlantOperations /></ProtectedRoute>} />
        <Route path="/plant-events" element={<ProtectedRoute><PlantEvents /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserOperations /></ProtectedRoute>} /> 
        
        {/* --- GENERATION MANAGEMENT --- */}
        <Route path="/uretim" element={<ProtectedRoute><GenerationData /></ProtectedRoute>} />
        
        {/* --- TRANSPARENCY PLATFORM --- */}
        <Route path="/consumption" element={<ProtectedRoute><ConsumptionData /></ProtectedRoute>} />
        <Route path="/piyasa" element={<ProtectedRoute><MarketData /></ProtectedRoute>} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;