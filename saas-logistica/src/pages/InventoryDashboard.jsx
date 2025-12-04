import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Truck, HardHat } from 'lucide-react';

// URL del Portal Central (Variable de Entorno)
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL;

const InventoryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBackToPortal = () => {
    // Redirigir al Portal Central
    window.location.href = PORTAL_URL;
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800">
      
      {/* TOPBAR (Estandarizado con RRHH pero en Naranja/Stone) */}
      <div className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            
            {/* Lado Izquierdo: Logo y Título */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                    📦
                </div>
                <div>
                    <h1 className="text-xl font-bold text-stone-900">Logística y Bodega</h1>
                    <p className="text-xs text-stone-500 font-medium">Gestión de Inventario</p>
                </div>
            </div>
            
            {/* Lado Derecho: Usuario y Navegación */}
            <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                    <p className="text-xs text-stone-400 uppercase font-bold">Usuario</p>
                    <p className="text-sm font-medium text-stone-700">{user?.email}</p>
                </div>
                
                <div className="h-8 w-[1px] bg-stone-200 mx-2 hidden md:block"></div>

                <button 
                    onClick={handleBackToPortal} 
                    className="px-4 py-2 bg-stone-100 text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-200 hover:text-stone-800 font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-sm"
                >
                    <span>⬅</span>
                    Volver al Portal
                </button>
            </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-stone-900 mb-2">Tus Módulos</h2>
            <p className="text-stone-600">Selecciona un módulo para comenzar</p>
        </div>

        {/* Grid Unificado - Todos los Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card: Bodegas */}
            <div 
                onClick={() => navigate('/settings/warehouses')}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-stone-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl">🏭</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Bodegas</h3>
                <p className="text-stone-500 text-sm leading-relaxed">Gestión de ubicaciones</p>
            </div>

            {/* Card: Catálogo */}
            <div 
                onClick={() => navigate('/products')} 
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-stone-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl">🛠️</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Catálogo</h3>
                <p className="text-stone-500 text-sm leading-relaxed">Productos y Herramientas</p>
            </div>

            {/* Card: Movimientos */}
            <div 
                onClick={() => navigate('/inventory')}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-stone-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl">🚚</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Movimientos</h3>
                <p className="text-stone-500 text-sm leading-relaxed">Entradas y Salidas</p>
            </div>

            {/* Card: Proveedores */}
            <div 
                onClick={() => navigate('/settings/suppliers')}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-stone-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Truck size={28} className="text-white"/>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Proveedores</h3>
                <p className="text-stone-500 text-sm leading-relaxed">Gestión de proveedores</p>
            </div>

            {/* Card: Proyectos */}
            <div 
                onClick={() => navigate('/settings/projects')}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-stone-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <HardHat size={28} className="text-white"/>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Proyectos</h3>
                <p className="text-stone-500 text-sm leading-relaxed">Centros de costo</p>
            </div>

            {/* Card: Ordenar Bodega */}
            <div 
                onClick={() => navigate('/inventory/putaway')}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-stone-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
                <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl">📋</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Ordenar Bodega</h3>
                <p className="text-stone-500 text-sm leading-relaxed">Ubicar productos</p>
            </div>

            {/* Card: Registro Ingresos */}
            <div 
                onClick={() => navigate('/inbound/create')}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-stone-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl">📥</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Registro Ingresos</h3>
                <p className="text-stone-500 text-sm leading-relaxed">Entrada de materiales</p>
            </div>

            {/* Card: Registrar Salida */}
            <div 
                onClick={() => navigate('/outbound/create')}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border border-stone-200 p-6 cursor-pointer transition-all duration-300 hover:scale-105 group"
            >
                <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <span className="text-3xl">📤</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Registrar Salida</h3>
                <p className="text-stone-500 text-sm leading-relaxed">Despacho de materiales</p>
            </div>

        </div>
      </main>
    </div>
  );
};

export default InventoryDashboard;