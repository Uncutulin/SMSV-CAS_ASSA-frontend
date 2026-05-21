import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText, Calendar, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function CoberturasAceptadas() {
  const [coberturas, setCoberturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCoberturas();
  }, []);

  const fetchCoberturas = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/coberturas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCoberturas(data.data || []);
      } else {
        console.error('Error fetching coberturas');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoberturas = useMemo(() => {
    return coberturas.filter(cobertura => {
      const searchStr = searchTerm.toLowerCase();
      const nombre = (cobertura.nombre || '').toLowerCase();
      const nameField = (cobertura.name || '').toLowerCase();
      const email = (cobertura.email || '').toLowerCase();
      const dni = (cobertura.dni || '').toLowerCase();
      const poliza = (cobertura.numero_poliza || '').toLowerCase();
      const vigencia = (cobertura.fecha_vigencia || '').toLowerCase();
      const template = (cobertura.templateid || '').toLowerCase();

      return (
        nombre.includes(searchStr) ||
        nameField.includes(searchStr) ||
        email.includes(searchStr) ||
        dni.includes(searchStr) ||
        poliza.includes(searchStr) ||
        vigencia.includes(searchStr) ||
        template.includes(searchStr)
      );
    });
  }, [coberturas, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredCoberturas.length / itemsPerPage) || 1;
  const paginatedCoberturas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCoberturas.slice(start, start + itemsPerPage);
  }, [filteredCoberturas, currentPage, itemsPerPage]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getAttachmentFilename = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-[#00AEEF] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-500 font-medium">Cargando coberturas aceptadas...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 px-8 pb-12 animate-in fade-in duration-700">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003865]">Coberturas Aceptadas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Registro histórico de las conformidades firmadas por los asegurados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por póliza, asegurado, DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] w-full sm:w-80 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Asegurado / Email</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Nº Póliza</th>
                <th className="px-6 py-4">Vigencia</th>
                <th className="px-6 py-4">Adjunto 1</th>
                <th className="px-6 py-4">Template ID</th>
                <th className="px-6 py-4">Fecha Aceptación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCoberturas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No se encontraron registros de coberturas aceptadas.
                  </td>
                </tr>
              ) : (
                paginatedCoberturas.map((cobertura) => (
                  <tr key={cobertura.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-[#00AEEF] shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800 text-[13px]">
                            {cobertura.nombre || cobertura.name || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-slate-500">{cobertura.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-700 font-medium">
                      {cobertura.dni || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 text-xs font-bold bg-[#00AEEF]/15 text-[#003865] rounded">
                        {cobertura.numero_poliza || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[12px] text-slate-600 font-medium">
                      {cobertura.fecha_vigencia ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{cobertura.fecha_vigencia}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {cobertura.attach1 ? (
                        <div className="flex items-center gap-1.5 text-slate-600 max-w-[150px] truncate" title={getAttachmentFilename(cobertura.attach1)}>
                          <FileText size={14} className="text-[#00AEEF]" />
                          <span className="text-[12px]">{getAttachmentFilename(cobertura.attach1)}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-slate-500 max-w-[120px] truncate" title={cobertura.templateid}>
                      {cobertura.templateid || '-'}
                    </td>
                    <td className="px-6 py-4 text-[12px] text-slate-600">
                      {formatDate(cobertura.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {filteredCoberturas.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <div>
              Mostrando <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * itemsPerPage, filteredCoberturas.length)}
              </span>{' '}
              de <span className="font-semibold text-slate-700">{filteredCoberturas.length}</span> registros
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
