import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Plus, Image as ImageIcon, Edit, Trash2, Settings, LayoutGrid, List as ListIcon, Download } from 'lucide-react';
import * as XLSX from 'xlsx'; // <--- Importar Excel

const ProductList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [thirdParties, setThirdParties] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // --- FILTROS Y VISTAS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwnerType, setFilterOwnerType] = useState('ALL'); // ALL, PROPIO, TERCERO
  const [filterOwnerId, setFilterOwnerId] = useState(''); // ID específico del dueño externo
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'

  // Estado Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
      name: '', sku: '', category: 'MATERIAL', unit: 'UN', 
      min_stock: 5, requires_devolution: false, 
      ownership_type: 'PROPIO', third_party_id: '', 
      photo_file: null, image_url: null, standard_cost: 0
  });

  // 1. CARGA DE DATOS
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (profile) {
          const orgId = profile.organization_id;

          // Cargar Dueños
          const { data: owners } = await supabase.from('logis_third_parties').select('*').eq('organization_id', orgId).order('name');
          setThirdParties(owners || []);

          // Cargar Productos
          const { data, error } = await supabase
            .from('logis_products')
            .select('*, owner:third_party_id(name)')
            .eq('organization_id', orgId)
            .order('name');

          if (error) throw error;
          setProducts(data || []);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  // 2. LÓGICA DE FILTRADO AVANZADO
  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          // Filtro Texto
          const matchText = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Filtro Tipo Propiedad
          let matchType = true;
          if (filterOwnerType !== 'ALL') {
              matchType = p.ownership_type === filterOwnerType;
          }

          // Filtro Dueño Específico (Solo si estamos viendo Terceros)
          let matchSpecificOwner = true;
          if (filterOwnerType === 'TERCERO' && filterOwnerId) {
              matchSpecificOwner = p.third_party_id === filterOwnerId;
          }

          return matchText && matchType && matchSpecificOwner;
      });
  }, [products, searchTerm, filterOwnerType, filterOwnerId]);

  // 3. EXPORTAR A EXCEL
  const handleExport = () => {
      if (filteredProducts.length === 0) return alert("No hay datos para exportar");

      const dataToExport = filteredProducts.map(p => ({
          SKU: p.sku,
          Nombre: p.name,
          Categoría: p.category,
          Unidad: p.unit,
          Propiedad: p.ownership_type,
          Dueño: p.owner?.name || (p.ownership_type === 'PROPIO' ? 'Interno' : '-'),
          Stock_Min: p.min_stock
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Maestra Productos");
      XLSX.writeFile(wb, `Catalogo_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // --- HANDLERS CRUD (Igual que antes) ---
  const handleOpenCreate = () => {
      setEditingProduct(null);
      setFormData({ name: '', sku: '', category: 'MATERIAL', unit: 'UN', min_stock: 5, ownership_type: 'PROPIO', third_party_id: '', photo_file: null, image_url: null, standard_cost: 0 });
      setShowModal(true);
  };

  const handleOpenEdit = (product) => {
      setEditingProduct(product);
      setFormData({
          name: product.name, sku: product.sku || '', category: product.category, unit: product.unit,
          min_stock: product.min_stock, ownership_type: product.ownership_type,
          third_party_id: product.third_party_id || '', photo_file: null, image_url: product.image_url,
          standard_cost: product.standard_cost || 0
      });
      setShowModal(true);
  };

  const handleSave = async (e) => {
      e.preventDefault();
      setUploading(true);
      try {
          if (formData.ownership_type === 'TERCERO' && !formData.third_party_id) throw new Error("Debe seleccionar la Empresa Dueña.");
          const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
          
          let finalImageUrl = formData.image_url;
          if (formData.photo_file) {
              const ext = formData.photo_file.name.split('.').pop();
              const pid = editingProduct ? editingProduct.id : Date.now(); 
              const fileName = `${profile.organization_id}/products/${pid}_${Date.now()}.${ext}`;
              await supabase.storage.from('logis-files').upload(fileName, formData.photo_file);
              finalImageUrl = supabase.storage.from('logis-files').getPublicUrl(fileName).data.publicUrl;
          }

          const payload = {
              organization_id: profile.organization_id,
              name: formData.name, sku: formData.sku, category: formData.category, unit: formData.unit, min_stock: formData.min_stock,
              requires_devolution: formData.category === 'HERRAMIENTA' || formData.category === 'MAQUINARIA',
              ownership_type: formData.ownership_type,
              third_party_id: formData.ownership_type === 'PROPIO' ? null : formData.third_party_id,
              image_url: finalImageUrl,
              standard_cost: parseFloat(formData.standard_cost) || 0
          };

          if (editingProduct) await supabase.from('logis_products').update(payload).eq('id', editingProduct.id);
          else await supabase.from('logis_products').insert(payload);

          alert("Guardado correctamente"); setShowModal(false); fetchData();
      } catch (error) { alert("Error: " + error.message); } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("¿Eliminar producto?")) return;
      try {
          const { error } = await supabase.from('logis_products').delete().eq('id', id);
          if (error) { if (error.code === '23503') throw new Error("No se puede eliminar: tiene movimientos asociados."); throw error; }
          fetchData();
      } catch (error) { alert("⛔ " + error.message); }
  };

  const modalImagePreview = formData.photo_file ? URL.createObjectURL(formData.photo_file) : formData.image_url;

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-stone-800 flex items-center gap-2"><Package className="text-orange-500" /> Catálogo Maestro</h2>
            <p className="text-stone-500 mt-1">Definición de materiales, herramientas y equipos.</p>
          </div>
          <div className="flex gap-2">
              <button onClick={() => navigate('/settings/owners')} className="px-3 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 font-bold text-sm flex items-center gap-2">
                  <Settings size={16} /> Dueños
              </button>
              <button onClick={() => navigate('/')} className="px-4 py-2 bg-white border rounded-lg text-stone-600 hover:bg-stone-100 font-medium">Volver</button>
              <button onClick={handleOpenCreate} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold shadow-sm flex items-center gap-2"><Plus size={18} /> Nuevo Producto</button>
          </div>
        </div>

        {/* TOOLBAR AVANZADO */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Grupo Izquierdo: Filtros */}
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                {/* Buscador */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-stone-400" size={18} />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg w-full focus:ring-2 focus:ring-orange-500 outline-none text-sm" />
                </div>
                
                {/* Filtro Tipo Propiedad */}
                <select 
                    value={filterOwnerType} 
                    onChange={e => { setFilterOwnerType(e.target.value); setFilterOwnerId(''); }} // Resetear ID al cambiar tipo
                    className="border border-stone-300 p-2 rounded-lg text-sm bg-stone-50 font-medium"
                >
                    <option value="ALL">Todos los Tipos</option>
                    <option value="PROPIO">Propio</option>
                    <option value="TERCERO">Externo</option>
                </select>

                {/* Filtro Cliente Específico (Solo aparece si eliges Tercero) */}
                {filterOwnerType === 'TERCERO' && (
                    <select 
                        value={filterOwnerId} 
                        onChange={e => setFilterOwnerId(e.target.value)} 
                        className="border border-purple-300 p-2 rounded-lg text-sm bg-purple-50 text-purple-700 font-medium animate-fade-in"
                    >
                        <option value="">-- Todos los Clientes --</option>
                        {thirdParties.map(tp => (
                            <option key={tp.id} value={tp.id}>{tp.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Grupo Derecho: Vistas y Acciones */}
            <div className="flex gap-2 items-center border-l pl-4 ml-auto">
                <button onClick={handleExport} title="Exportar Excel" className="p-2 text-stone-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                    <Download size={20} />
                </button>
                <div className="flex bg-stone-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow text-orange-600' : 'text-stone-400'}`}>
                        <LayoutGrid size={18} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-orange-600' : 'text-stone-400'}`}>
                        <ListIcon size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* --- CONTENIDO DINÁMICO --- */}
        {viewMode === 'grid' ? (
            // VISTA GRILLA
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                        <div className="h-40 bg-stone-100 relative flex items-center justify-center overflow-hidden">
                            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <ImageIcon className="text-stone-300 w-12 h-12" />}
                            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm ${p.ownership_type === 'PROPIO' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}`}>{p.ownership_type === 'PROPIO' ? 'Propio' : 'Externo'}</div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase tracking-wide">{p.category}</span><span className="text-xs text-stone-400 font-mono">{p.sku}</span></div>
                            <h3 className="font-bold text-stone-800 text-lg leading-tight mb-1">{p.name}</h3>
                            {p.ownership_type !== 'PROPIO' && <p className="text-xs text-purple-600 font-medium mb-2">Dueño: {p.owner?.name}</p>}
                            <div className="flex justify-end items-center mt-4 pt-3 border-t border-stone-100 gap-3">
                                <button onClick={() => handleOpenEdit(p)} className="text-stone-400 hover:text-blue-600 transition-colors p-1"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(p.id)} className="text-stone-400 hover:text-red-600 transition-colors p-1"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            // VISTA LISTA
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-stone-50 text-xs uppercase font-bold text-stone-500 border-b">
                        <tr>
                            <th className="p-4">Imagen</th>
                            <th className="p-4">SKU</th>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4">Propiedad</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                        {filteredProducts.map(p => (
                            <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                                <td className="p-4">
                                    <div className="w-10 h-10 bg-stone-100 rounded flex items-center justify-center overflow-hidden border border-stone-200">
                                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-stone-400" />}
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-stone-500">{p.sku || '-'}</td>
                                <td className="p-4 font-bold text-stone-800">{p.name}</td>
                                <td className="p-4"><span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold">{p.category}</span></td>
                                <td className="p-4">
                                    {p.ownership_type === 'PROPIO' 
                                        ? <span className="text-blue-600 font-bold text-xs">PROPIO</span>
                                        : <span className="text-purple-600 font-bold text-xs">EXTERNO: {p.owner?.name}</span>
                                    }
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2 items-center h-full">
                                    <button onClick={() => handleOpenEdit(p)} className="text-stone-400 hover:text-blue-600"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-stone-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        
        {/* MODAL (Sin cambios, se mantiene la lógica previa) */}
        {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                    <div className="p-5 border-b border-stone-100 bg-stone-50 flex justify-between items-center"><h3 className="font-bold text-lg text-stone-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3><button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-red-500 font-bold text-xl">×</button></div>
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <div className="flex justify-center mb-4"><label className="w-full h-32 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors overflow-hidden relative">{modalImagePreview ? <img src={modalImagePreview} className="w-full h-full object-cover opacity-80 hover:opacity-100" /> : <><ImageIcon className="text-stone-400 mb-2" /><span className="text-xs text-stone-500 font-medium">Clic para subir foto</span></>}<input type="file" accept="image/*" className="hidden" onChange={e => setFormData({...formData, photo_file: e.target.files[0]})} /></label></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="text-xs font-bold text-stone-500 uppercase">Nombre Producto</label><input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-stone-500 uppercase">SKU / Código</label><input className="w-full border p-2 rounded-lg" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-stone-500 uppercase">Categoría</label><select className="w-full border p-2 rounded-lg bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option value="MATERIAL">Material</option><option value="HERRAMIENTA">Herramienta</option><option value="EPP">EPP</option><option value="MAQUINARIA">Maquinaria</option></select></div>
                            <div><label className="block text-xs font-bold text-stone-500 uppercase">Costo Estándar</label><input type="number" className="w-full border p-2 rounded-lg" value={formData.standard_cost || ''} onChange={e => setFormData({...formData, standard_cost: e.target.value})} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-orange-50 p-3 rounded-lg border border-orange-100">
                            <div className="col-span-2"><label className="text-xs font-bold text-orange-700 uppercase block mb-1">Propiedad</label><div className="flex gap-4"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" checked={formData.ownership_type === 'PROPIO'} onChange={() => setFormData({...formData, ownership_type: 'PROPIO'})} /> Propio</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" checked={formData.ownership_type === 'TERCERO'} onChange={() => setFormData({...formData, ownership_type: 'TERCERO'})} /> De Cliente/Tercero</label></div></div>
                            {formData.ownership_type === 'TERCERO' && (
                                <div className="col-span-2 animate-fade-in">
                                    <label className="text-xs text-purple-700 font-bold mb-1 block">Seleccionar Dueño</label>
                                    <select required className="w-full border border-purple-300 p-2 rounded-lg bg-white" value={formData.third_party_id} onChange={e => setFormData({...formData, third_party_id: e.target.value})}>
                                        <option value="">-- Seleccione Empresa --</option>
                                        {thirdParties.map(owner => (<option key={owner.id} value={owner.id}>{owner.name}</option>))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button disabled={uploading} className="w-full bg-stone-900 text-white py-3 rounded-lg font-bold hover:bg-black shadow-lg transition-transform active:scale-95">{uploading ? 'Guardando...' : 'Guardar'}</button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;