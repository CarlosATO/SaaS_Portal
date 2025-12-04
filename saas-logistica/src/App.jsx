import { AuthProvider, useAuth } from './context/AuthContext';
import InventoryDashboard from './pages/InventoryDashboard';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductList from './pages/ProductList'
import ThirdPartySettings from './pages/ThirdPartySettings';
import WarehouseSettings from './pages/WarehouseSettings';
import InventoryView from './pages/InventoryView';
import SupplierSettings from './pages/SupplierSettings';
import ProjectSettings from './pages/ProjectSettings';
import InboundReception from './pages/InboundReception';
import LocationSettings from './pages/LocationSettings';
import PutAway from './pages/PutAway';
import OutboundDispatch from './pages/OutboundDispatch';

import './index.css';

// Componente que protege la ruta: Si carga, muestra la app.
const MainLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-500 font-medium">Conectando con Bodega...</p>
        </div>
      </div>
    );
  }

  // Si el AuthContext hizo su trabajo, aquí ya tenemos usuario o fuimos redirigidos.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InventoryDashboard />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/settings/owners" element={<ThirdPartySettings />} />
        <Route path="/settings/warehouses" element={<WarehouseSettings />} />
        <Route path="/inventory" element={<InventoryView />} />
        <Route path="/settings/suppliers" element={<SupplierSettings />} />
        <Route path="/settings/projects" element={<ProjectSettings />} />
        <Route path="/inbound/create" element={<InboundReception />} />
        <Route path="/settings/locations" element={<LocationSettings />} />
        <Route path="/inventory/putaway" element={<PutAway />} />
        <Route path="/outbound/create" element={<OutboundDispatch />} />
        
        <Route path="*" element={<InventoryDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}

export default App;