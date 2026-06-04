import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { 
  Search, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  FileText, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  Hash, 
  AudioLines,
  Clock,
  X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Transcription {
  id: number;
  filename: string;
  agent_id: string;
  call_date: string;
  call_time_utc: string;
  call_time_argentina: string;
  call_index: string;
  transcription: string;
  created_at: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}



export default function Transcriptions() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
    per_page: 15
  });

  // Filters state
  const [filterAgentId, setFilterAgentId] = useState('');
  const [filterCallIndex, setFilterCallIndex] = useState('');
  const [filterCallDate, setFilterCallDate] = useState('');
  const [appliedPage, setAppliedPage] = useState(1);

  // Upload state

  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // View modal state
  const [activeTranscription, setActiveTranscription] = useState<Transcription | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTranscriptions();
  }, [appliedPage]);

  // Silent fetch for table polling
  const fetchTranscriptionsSilent = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(appliedPage));
      if (filterAgentId) queryParams.append('agent_id', filterAgentId);
      if (filterCallIndex) queryParams.append('call_index', filterCallIndex);
      if (filterCallDate) queryParams.append('call_date', filterCallDate);

      const response = await fetch(`${API_URL}/admin/transcriptions?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setTranscriptions(resData.data.data);
          setPagination({
            current_page: resData.data.current_page,
            last_page: resData.data.last_page,
            total: resData.data.total,
            from: resData.data.from || 0,
            to: resData.data.to || 0,
            per_page: resData.data.per_page
          });
        }
      }
    } catch (e) {
      console.error('Error silent fetching transcriptions:', e);
    }
  };

  // Auto-polling for active table items
  useEffect(() => {
    const hasActiveTranscriptions = transcriptions.some(
      t => t.status === 'pending' || t.status === 'processing'
    );

    if (!hasActiveTranscriptions) return;

    const interval = setInterval(() => {
      fetchTranscriptionsSilent();
    }, 5000);

    return () => clearInterval(interval);
  }, [transcriptions, appliedPage, filterAgentId, filterCallIndex, filterCallDate]);

  // Handle filter changes (debounced search would be nice, but simple search button or immediate trigger works)
  const handleApplyFilters = () => {
    setAppliedPage(1);
    fetchTranscriptions(1);
  };

  const handleClearFilters = () => {
    setFilterAgentId('');
    setFilterCallIndex('');
    setFilterCallDate('');
    setAppliedPage(1);
    fetchTranscriptions(1, '', '', '');
  };

  const fetchTranscriptions = async (
    page = appliedPage,
    agentId = filterAgentId,
    callIndex = filterCallIndex,
    callDate = filterCallDate
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(page));
      if (agentId) queryParams.append('agent_id', agentId);
      if (callIndex) queryParams.append('call_index', callIndex);
      if (callDate) queryParams.append('call_date', callDate);

      const response = await fetch(`${API_URL}/admin/transcriptions?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setTranscriptions(resData.data.data);
          setPagination({
            current_page: resData.data.current_page,
            last_page: resData.data.last_page,
            total: resData.data.total,
            from: resData.data.from || 0,
            to: resData.data.to || 0,
            per_page: resData.data.per_page
          });
        }
      }
    } catch (e) {
      console.error('Error fetching transcriptions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: 'Esta acción borrará la transcripción de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch(`${API_URL}/admin/transcriptions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La transcripción ha sido eliminada.',
              timer: 1500,
              showConfirmButton: false
            });
            fetchTranscriptions();
          } else {
            const data = await response.json();
            Swal.fire('Error', data.message || 'No se pudo eliminar el registro.', 'error');
          }
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        }
      }
    });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleFilesSelected = (fileList: FileList) => {
    const validFiles: File[] = [];
    const MAX_SIZE_BYTES = 50000 * 1024; // 50,000 KB to match backend limit

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      // Basic check for audio formats
      if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext || '')) {
        if (file.size > MAX_SIZE_BYTES) {
          Swal.fire({
            icon: 'warning',
            title: 'Archivo demasiado grande',
            text: `El archivo '${file.name}' supera el límite de 50MB permitido.`,
            confirmButtonColor: '#00AEEF'
          });
          continue;
        }
        validFiles.push(file);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Archivo Inválido',
          text: `El archivo '${file.name}' no parece ser un formato de audio soportado (mp3, wav, ogg, m4a, aac, flac).`,
          confirmButtonColor: '#00AEEF'
        });
      }
    }

    if (validFiles.length > 0) {
      processUploadQueue(validFiles);
    }
  };

  const processUploadQueue = async (files: File[]) => {
    setIsUploading(true);
    const token = localStorage.getItem('auth_token');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/admin/transcriptions/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          fetchTranscriptions(1);
        } else {
          Swal.fire('Error', data.message || 'Error al procesar el archivo.', 'error');
        }
      } catch (e) {
        console.error(e);
        Swal.fire('Error', 'Fallo de red o servidor.', 'error');
      }
    }

    setIsUploading(false);
  };

  return (
    <div className="pt-24 px-4 md:px-8 pb-12 animate-in fade-in duration-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#003865] flex items-center gap-2">
          <AudioLines className="text-[#00AEEF]" size={28} />
          Módulo de Transcripciones
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Carga archivos de audio en formato <span className="font-semibold text-slate-600">IDAgente#Fecha#Hora#Indice.mp3</span> para transcribirlos de forma automatizada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upload Panel */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
          <h3 className="text-md font-bold text-[#003865] mb-4 flex items-center gap-2">
            <Upload size={18} className="text-[#00AEEF]" />
            Cargar Grabaciones
          </h3>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex-grow border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none min-h-[180px] ${
              dragActive 
                ? 'border-[#00AEEF] bg-[#00AEEF]/5' 
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
            onClick={() => document.getElementById('audio-upload-input')?.click()}
          >
            <input
              type="file"
              id="audio-upload-input"
              multiple
              accept=".mp3,.wav,.ogg,.m4a,.aac,.flac"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#00AEEF] flex items-center justify-center mb-3">
              <AudioLines size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700">Arrastra tus archivos de audio aquí</p>
            <p className="text-xs text-slate-400 mt-1">o haz clic para explorar en tu equipo</p>
            <p className="text-[10px] text-slate-400 mt-3 font-semibold">Formatos: MP3, WAV, OGG, M4A (Máx. 50MB)</p>
          </div>
        </div>

        {/* Filters and List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Filters card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-md font-bold text-[#003865] mb-4 flex items-center gap-2">
              <Search size={18} className="text-[#00AEEF]" />
              Filtros de Búsqueda
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ID Agente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={filterAgentId}
                    onChange={(e) => setFilterAgentId(e.target.value)}
                    placeholder="Ej. 1061"
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Índice Llamada</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={filterCallIndex}
                    onChange={(e) => setFilterCallIndex(e.target.value)}
                    placeholder="Ej. 12624946"
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Llamada</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="date"
                    value={filterCallDate}
                    onChange={(e) => setFilterCallDate(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] w-full text-slate-700"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 border-t border-slate-100 pt-4">
              <button
                onClick={handleClearFilters}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-1.5 text-xs font-semibold bg-[#00AEEF] text-white rounded-lg hover:bg-[#003865] transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 transition-all duration-300">
            <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-lg border border-slate-100">
              <svg className="animate-spin h-8 w-8 text-[#00AEEF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-semibold text-[#003865]">Cargando transcripciones...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Agente</th>
                <th className="px-6 py-4">Fecha (ARG)</th>
                <th className="px-6 py-4">Horario (ARG / UTC)</th>
                <th className="px-6 py-4">Índice de Llamada</th>
                <th className="px-6 py-4">Nombre Archivo</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transcriptions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00AEEF]/5 text-[#003865] text-xs font-bold border border-[#00AEEF]/10">
                      <User size={12} className="text-[#00AEEF]" />
                      {t.agent_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                    {t.call_date.split('-').reverse().join('/')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Clock size={11} className="text-[#00AEEF]" />
                        {t.call_time_argentina.substring(0, 5)} ARG
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {t.call_time_utc.substring(0, 5)} UTC
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{t.call_index}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[200px]" title={t.filename}>
                    {t.filename}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${
                      t.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      t.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      t.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {t.status === 'processing' && (
                        <svg className="animate-spin h-3 w-3 text-blue-600 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {t.status === 'completed' && 'Completado'}
                      {t.status === 'failed' && 'Fallido'}
                      {t.status === 'processing' && 'Procesando...'}
                      {t.status === 'pending' && 'Pendiente'}
                      {!t.status && 'Completado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveTranscription(t)}
                        disabled={t.status === 'pending' || t.status === 'processing'}
                        className={`p-2 rounded transition-colors ${
                          t.status === 'pending' || t.status === 'processing'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-[#00AEEF]/10 text-[#003865] hover:bg-[#00AEEF]/20'
                        }`}
                        title={
                          t.status === 'pending' || t.status === 'processing'
                            ? "Procesando transcripción..."
                            : "Ver Transcripción"
                        }
                      >
                        {t.status === 'pending' || t.status === 'processing' ? (
                          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <FileText size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transcriptions.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 font-medium">
                    No se encontraron registros de transcripciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-500">
            Mostrando <span className="font-semibold text-slate-700">{pagination.from}</span> a <span className="font-semibold text-slate-700">{pagination.to}</span> de <span className="font-semibold text-slate-700">{pagination.total}</span> transcripciones
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAppliedPage(p => Math.max(1, p - 1))}
              disabled={pagination.current_page === 1}
              className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-600">Página {pagination.current_page} de {pagination.last_page}</span>
            <button
              onClick={() => setAppliedPage(p => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page === pagination.last_page}
              className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* View Transcription Modal */}
      {activeTranscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setActiveTranscription(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-md font-bold text-[#003865] flex items-center gap-1.5">
                  <AudioLines className="text-[#00AEEF]" size={20} />
                  Detalle de Grabación Transcrita
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold truncate max-w-[400px]">
                  Archivo: {activeTranscription.filename}
                </p>
              </div>
              <button
                onClick={() => setActiveTranscription(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Audio Metadata Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">
                <span className="font-semibold block text-slate-400 uppercase tracking-wide text-[9px] mb-0.5">Agente</span>
                <span className="font-bold text-slate-700">ID {activeTranscription.agent_id}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-semibold block text-slate-400 uppercase tracking-wide text-[9px] mb-0.5">Fecha</span>
                <span className="font-bold text-slate-700">{activeTranscription.call_date.split('-').reverse().join('/')}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-semibold block text-slate-400 uppercase tracking-wide text-[9px] mb-0.5">Horario (ARG)</span>
                <span className="font-bold text-slate-700">{activeTranscription.call_time_argentina.substring(0, 5)} hs</span>
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-semibold block text-slate-400 uppercase tracking-wide text-[9px] mb-0.5">Índice Llamada</span>
                <span className="font-bold text-slate-700">{activeTranscription.call_index}</span>
              </div>
            </div>

            {/* Transcript Text */}
            <div className="flex-grow overflow-y-auto custom-scrollbar bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 select-text text-sm leading-relaxed text-slate-700 max-h-[45vh]">
              {activeTranscription.transcription ? (
                activeTranscription.transcription
              ) : (
                <span className="italic text-slate-400">Sin contenido de transcripción.</span>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleCopyText(activeTranscription.transcription)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? '¡Copiado!' : 'Copiar Texto'}
              </button>
              <button
                onClick={() => setActiveTranscription(null)}
                className="px-5 py-2 text-xs font-semibold bg-[#00AEEF] text-white rounded-lg hover:bg-[#003865] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
