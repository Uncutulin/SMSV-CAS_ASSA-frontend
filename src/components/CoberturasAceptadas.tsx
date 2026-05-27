import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText, Calendar, CheckCircle2, Upload, Download } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const parseDateString = (str: string): Date => {
  if (!str) return new Date(0);
  const t = str.split(/[- :T.]/);
  if (t.length >= 3) {
    const y = parseInt(t[0], 10);
    const m = parseInt(t[1], 10) - 1; // months are 0-indexed
    const d = parseInt(t[2], 10);
    const hr = t[3] ? parseInt(t[3], 10) : 0;
    const min = t[4] ? parseInt(t[4], 10) : 0;
    const sec = t[5] ? parseInt(t[5], 10) : 0;
    const date = new Date(y, m, d, hr, min, sec);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? new Date(0) : fallback;
};

export default function CoberturasAceptadas() {
  const [coberturas, setCoberturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 10;

  const folderInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBatch, setUploadingBatch] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    active: false,
    percentage: 0,
    currentFileName: ''
  });

  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Group coberturas by batch_id / src_file
  const groupedBatches = useMemo(() => {
    const groups: { [key: string]: { key: string; src_file: string; created_at: string; total: number; confirmed: number } } = {};

    coberturas.forEach(item => {
      const key = item.batch_id ? String(item.batch_id) : (item.src_file || 'Sin archivo');

      if (!groups[key]) {
        groups[key] = {
          key,
          src_file: item.src_file || 'Sin archivo',
          created_at: item.created_at || '',
          total: 0,
          confirmed: 0
        };
      }

      if (item.created_at && (!groups[key].created_at || parseDateString(item.created_at) > parseDateString(groups[key].created_at))) {
        groups[key].created_at = item.created_at;
      }

      groups[key].total += 1;

      // Calculate confirmed policies count based on poliza_confirmada field
      const isConfirmed = item.poliza_confirmada === true ||
        item.poliza_confirmada === 1 ||
        item.poliza_confirmada === '1' ||
        item.poliza_confirmada === 'true';
      if (isConfirmed) {
        groups[key].confirmed += 1;
      }
    });

    // Return sorted by created_at desc
    return Object.values(groups).sort((a, b) => {
      const dateA = a.created_at ? parseDateString(a.created_at).getTime() : 0;
      const dateB = b.created_at ? parseDateString(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [coberturas]);

  // Records inside the selected batch
  const selectedBatchRecords = useMemo(() => {
    if (selectedBatchId === null) return [];
    return coberturas.filter(item => {
      const key = item.batch_id ? String(item.batch_id) : (item.src_file || 'Sin archivo');
      return key === selectedBatchId;
    });
  }, [coberturas, selectedBatchId]);

  const fetchExistingFiles = async () => {
    setLoadingExisting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/r2/existing-files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExistingFiles(data.files || []);
      }
    } catch (e) {
      console.error('Error fetching existing files in R2:', e);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Fetch all existing files on mount
  useEffect(() => {
    fetchExistingFiles();
  }, []);

  const handleDownloadFile = async (fileName: string, customBatchName?: string) => {
    const batchName = customBatchName || (() => {
      if (!selectedBatchId) return '';
      const batch = groupedBatches.find(b => b.key === selectedBatchId);
      return batch ? batch.src_file : selectedBatchId;
    })();

    if (!batchName) return;
    const fileKey = `${batchName}/${fileName}`;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/r2/download-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: fileKey })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al obtener la URL de descarga.');
      }

      const data = await response.json();
      if (data.success && data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No se recibió una URL de descarga válida.');
      }
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error de descarga',
        text: e.message || 'No se pudo generar la URL de descarga para este archivo.',
        confirmButtonColor: '#003865',
      });
    }
  };

  const handleFolderUploadClick = (batch: any) => {
    setUploadingBatch(batch);
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
      folderInputRef.current.click();
    }
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadingBatch) return;

    const batchName = uploadingBatch.src_file || 'lote_sin_nombre';
    
    try {
      const fileArray = Array.from(files);
      const totalFiles = fileArray.length;
      
      const filesPayload = fileArray.map(file => {
        let r2Path;
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          parts[0] = batchName;
          r2Path = parts.join('/');
        } else {
          r2Path = `${batchName}/${file.name}`;
        }
        return { 
          path: r2Path,
          type: file.type || 'application/octet-stream'
        };
      });

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/r2/presigned-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ files: filesPayload })
      });

      if (!response.ok) {
        throw new Error('Error al generar las URLs de carga pre-firmadas.');
      }

      const resData = await response.json();
      if (!resData.success || !resData.urls) {
        throw new Error(resData.message || 'Error en las URLs pre-firmadas.');
      }

      const presignedUrls = resData.urls;

      setUploadProgress({
        total: totalFiles,
        completed: 0,
        failed: 0,
        active: true,
        percentage: 0,
        currentFileName: ''
      });

      const CONCURRENCY_LIMIT = 5;
      let nextIndex = 0;
      let completedCount = 0;
      let failedCount = 0;

      const uploadNext = async (): Promise<void> => {
        if (nextIndex >= totalFiles) return;

        const currentIndex = nextIndex++;
        const file = fileArray[currentIndex];
        const presignedInfo = presignedUrls[currentIndex];

        try {
          setUploadProgress(prev => ({
            ...prev,
            currentFileName: file.name
          }));

          const putResponse = await fetch(presignedInfo.url, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type || 'application/octet-stream'
            },
            body: file
          });

          if (!putResponse.ok) {
            throw new Error(`Estado HTTP ${putResponse.status}`);
          }

          completedCount++;
        } catch (err) {
          console.error(`Error al subir ${file.name}:`, err);
          failedCount++;
        } finally {
          const percentage = Math.round(((completedCount + failedCount) / totalFiles) * 100);
          setUploadProgress(prev => ({
            ...prev,
            completed: completedCount,
            failed: failedCount,
            percentage
          }));

          await uploadNext();
        }
      };

      const initialPool = [];
      for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, totalFiles); i++) {
        initialPool.push(uploadNext());
      }

      await Promise.all(initialPool);

      // Close progress modal
      setUploadProgress(prev => ({ ...prev, active: false }));

      // Refresh existing files list
      fetchExistingFiles();

      // Show SweetAlert2 success dialog
      Swal.fire({
        icon: failedCount === 0 ? 'success' : (completedCount > 0 ? 'warning' : 'error'),
        title: failedCount === 0 ? '¡Subida Exitosa!' : 'Subida con Observaciones',
        html: `
          <div class="text-left text-sm space-y-2 mt-2">
            <p>Se procesaron los adjuntos del lote <strong>${batchName}</strong>.</p>
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1 mt-3 text-slate-600">
              <div><strong>Archivos procesados:</strong> ${totalFiles}</div>
              <div><strong>Subidos con éxito:</strong> <span class="text-emerald-600 font-bold">${completedCount}</span></div>
              <div><strong>Fallidos:</strong> <span class="text-red-500 font-bold">${failedCount}</span></div>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#003865',
      });

    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error de Carga',
        text: err.message || 'Ocurrió un error inesperado al subir la carpeta.',
        confirmButtonColor: '#003865',
      });
      setUploadProgress(prev => ({ ...prev, active: false }));
    }
  };

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if CSV
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      Swal.fire({
        icon: 'error',
        title: 'Archivo Inválido',
        text: 'Por favor, selecciona un archivo con formato CSV.',
        confirmButtonColor: '#003865',
      });
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/admin/coberturas/upload-csv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Importación Exitosa!',
          html: `
            <div class="text-left text-sm space-y-2 mt-2">
              <p>El archivo <strong>${file.name}</strong> ha sido cargado con éxito.</p>
              <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1 mt-3 text-slate-600">
                <div><strong>Lote ID:</strong> ${data.batch_id}</div>
                <div><strong>Registros cargados:</strong> ${data.rows_affected}</div>
              </div>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#003865',
        });

        // Refresh list and reset view to master
        fetchCoberturas();
        fetchExistingFiles();
        setSelectedBatchId(null);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error de Importación',
          text: data.message || 'Ocurrió un error inesperado al procesar el archivo.',
          confirmButtonColor: '#003865',
        });
      }
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error de Red',
        text: 'No se pudo conectar con el servidor para realizar la carga.',
        confirmButtonColor: '#003865',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const exportToCSV = (confirmedOnly: boolean) => {
    // 1. Get the list of records to export
    // If selectedBatchId is set, we export records from that batch.
    // If not, we export all records from the current list.
    let recordsToExport = selectedBatchId === null
      ? coberturas
      : selectedBatchRecords;

    // Apply the current filters (search term and dates)
    recordsToExport = recordsToExport.filter(item => {
      // Apply date filter
      const isConfirmed = item.poliza_confirmada === true ||
        item.poliza_confirmada === 1 ||
        item.poliza_confirmada === '1' ||
        item.poliza_confirmada === 'true';

      const dateToUse = (selectedBatchId !== null && isConfirmed)
        ? item.confirmado_at
        : item.created_at;

      if (dateToUse) {
        const itemTime = parseDateString(dateToUse).getTime();
        if (startDate) {
          const startMs = parseDateString(startDate + 'T00:00:00').getTime();
          if (itemTime < startMs) return false;
        }
        if (endDate) {
          const endMs = parseDateString(endDate + 'T23:59:59').getTime();
          if (itemTime > endMs) return false;
        }
      } else {
        if (startDate || endDate) return false;
      }

      // Apply search filter (if search term exists)
      if (searchTerm) {
        const searchStr = searchTerm.toLowerCase();
        // If in master view, search matches src_file
        if (selectedBatchId === null) {
          return (item.src_file || '').toLowerCase().includes(searchStr);
        } else {
          // If in detail view, search matches policy details
          const nombre = (item.nombre || '').toLowerCase();
          const nameField = (item.name || '').toLowerCase();
          const email = (item.email || '').toLowerCase();
          const dni = (item.dni || '').toLowerCase();
          const poliza = (item.numero_poliza || '').toLowerCase();
          const vigencia = (item.fecha_vigencia || '').toLowerCase();
          const template = (item.templateid || '').toLowerCase();
          return (
            nombre.includes(searchStr) ||
            nameField.includes(searchStr) ||
            email.includes(searchStr) ||
            dni.includes(searchStr) ||
            poliza.includes(searchStr) ||
            vigencia.includes(searchStr) ||
            template.includes(searchStr)
          );
        }
      }
      return true;
    });

    // 2. Filter by confirmation status
    recordsToExport = recordsToExport.filter(item => {
      const isConfirmed = item.poliza_confirmada === true ||
        item.poliza_confirmada === 1 ||
        item.poliza_confirmada === '1' ||
        item.poliza_confirmada === 'true';
      return confirmedOnly ? isConfirmed : !isConfirmed;
    });

    if (recordsToExport.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin datos',
        text: `No hay pólizas ${confirmedOnly ? 'aceptadas' : 'sin aceptar'} que coincidan con los filtros actuales.`,
        confirmButtonColor: '#003865',
      });
      return;
    }

    // 3. Define headers and rows
    const headers = [
      'Email',
      'Name',
      'Template ID',
      'Attach 1',
      'Asegurado (Nombre)',
      'DNI',
      'Numero Poliza',
      'Vigencia',
      'Archivo Origen',
      'Fecha Creacion',
      'Confirmada',
      'Fecha Confirmada'
    ];

    const csvRows = [headers.join(';')];

    recordsToExport.forEach(item => {
      const isConfirmed = item.poliza_confirmada === true ||
        item.poliza_confirmada === 1 ||
        item.poliza_confirmada === '1' ||
        item.poliza_confirmada === 'true';
      const values = [
        item.email || '',
        item.name || '',
        item.templateid || '',
        item.attach1 || '',
        item.nombre || '',
        item.dni || '',
        item.numero_poliza || '',
        item.fecha_vigencia || '',
        item.src_file || '',
        item.created_at || '',
        isConfirmed ? 'SI' : 'NO',
        item.confirmado_at || ''
      ];

      // Escape semicolons and double quotes to construct valid CSV rows
      const escapedValues = values.map(val => {
        const cleanVal = String(val).replace(/"/g, '""');
        return `"${cleanVal}"`;
      });

      csvRows.push(escapedValues.join(';'));
    });

    // 4. Download file
    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Construct filename
    const prefix = confirmedOnly ? 'polizas_aceptadas' : 'polizas_sin_aceptar';
    const batchSuffix = selectedBatchId ? `_lote_${selectedBatchId}` : '_todas';
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `${prefix}${batchSuffix}_${dateStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter batches by file name and upload date range (Master View search)
  const filteredBatches = useMemo(() => {
    if (selectedBatchId !== null) return [];
    return groupedBatches.filter(batch => {
      // 1. Search term filter
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = batch.src_file.toLowerCase().includes(searchStr);
      if (!matchesSearch) return false;

      // 2. Date range filter (by ingestion/created_at date)
      if (batch.created_at) {
        const batchTime = parseDateString(batch.created_at).getTime();
        if (startDate) {
          const startMs = parseDateString(startDate + 'T00:00:00').getTime();
          if (batchTime < startMs) return false;
        }
        if (endDate) {
          const endMs = parseDateString(endDate + 'T23:59:59').getTime();
          if (batchTime > endMs) return false;
        }
      } else {
        if (startDate || endDate) return false;
      }

      return true;
    });
  }, [groupedBatches, selectedBatchId, searchTerm, startDate, endDate]);

  // Filter policies inside the selected batch by search term and date range (Detail View search)
  const filteredCoberturas = useMemo(() => {
    if (selectedBatchId === null) return [];
    return selectedBatchRecords.filter(cobertura => {
      // 1. Search term filter
      const searchStr = searchTerm.toLowerCase();
      const nombre = (cobertura.nombre || '').toLowerCase();
      const nameField = (cobertura.name || '').toLowerCase();
      const email = (cobertura.email || '').toLowerCase();
      const dni = (cobertura.dni || '').toLowerCase();
      const poliza = (cobertura.numero_poliza || '').toLowerCase();
      const vigencia = (cobertura.fecha_vigencia || '').toLowerCase();
      const template = (cobertura.templateid || '').toLowerCase();

      const matchesSearch = (
        nombre.includes(searchStr) ||
        nameField.includes(searchStr) ||
        email.includes(searchStr) ||
        dni.includes(searchStr) ||
        poliza.includes(searchStr) ||
        vigencia.includes(searchStr) ||
        template.includes(searchStr)
      );
      if (!matchesSearch) return false;

      // 2. Date range filter (by confirmado_at if confirmed, otherwise created_at)
      const isConfirmed = cobertura.poliza_confirmada === true ||
        cobertura.poliza_confirmada === 1 ||
        cobertura.poliza_confirmada === '1' ||
        cobertura.poliza_confirmada === 'true';

      const dateToUse = isConfirmed ? cobertura.confirmado_at : cobertura.created_at;

      if (dateToUse) {
        const itemTime = parseDateString(dateToUse).getTime();
        if (startDate) {
          const startMs = parseDateString(startDate + 'T00:00:00').getTime();
          if (itemTime < startMs) return false;
        }
        if (endDate) {
          const endMs = parseDateString(endDate + 'T23:59:59').getTime();
          if (itemTime > endMs) return false;
        }
      } else {
        if (startDate || endDate) return false;
      }

      return true;
    });
  }, [selectedBatchRecords, selectedBatchId, searchTerm, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBatchId, startDate, endDate]);

  const totalItems = selectedBatchId === null ? filteredBatches.length : filteredCoberturas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedBatches = useMemo(() => {
    if (selectedBatchId !== null) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBatches.slice(start, start + itemsPerPage);
  }, [filteredBatches, currentPage, itemsPerPage, selectedBatchId]);

  const paginatedCoberturas = useMemo(() => {
    if (selectedBatchId === null) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCoberturas.slice(start, start + itemsPerPage);
  }, [filteredCoberturas, currentPage, itemsPerPage, selectedBatchId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = parseDateString(dateStr);
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
      <div className="pt-24 px-4 md:px-8 pb-12 min-h-screen flex flex-col items-center justify-center">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-[#00AEEF] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-500 font-medium">Cargando coberturas aceptadas...</p>
      </div>
    );
  }

  const showingFrom = (currentPage - 1) * itemsPerPage + 1;
  const showingTo = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pt-24 px-4 md:px-8 pb-12 animate-in fade-in duration-700">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#003865]">Coberturas Aceptadas</h2>
          {selectedBatchId ? (
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setSelectedBatchId(null)}
                className="flex items-center gap-1 text-sm font-semibold text-[#00AEEF] hover:text-[#003865] transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Volver al listado de archivos</span>
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 max-w-[200px] sm:max-w-xs md:max-w-md truncate" title={selectedBatchRecords[0]?.src_file}>
                Archivo: {selectedBatchRecords[0]?.src_file || 'Sin archivo'}
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-1">
              Registro histórico de las conformidades firmadas por los asegurados.
            </p>
          )}
        </div>

        {/* Global Page Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          {/* Exportar Buttons (only shown in Detail View of a batch) */}
          {selectedBatchId !== null && (
            <>
              {/* Exportar Aceptadas Button */}
              <button
                onClick={() => exportToCSV(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm border transition-all cursor-pointer select-none active:scale-95 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300 w-full sm:w-auto animate-in fade-in zoom-in-95 duration-200"
                title="Exportar pólizas aceptadas a CSV"
              >
                <Download size={16} className="text-emerald-600" />
                <span>Exportar Aceptadas</span>
              </button>

              {/* Exportar Sin Aceptar Button */}
              <button
                onClick={() => exportToCSV(false)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm border transition-all cursor-pointer select-none active:scale-95 bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 hover:border-slate-300 w-full sm:w-auto animate-in fade-in zoom-in-95 duration-200"
                title="Exportar pólizas sin aceptar a CSV"
              >
                <Download size={16} className="text-slate-600" />
                <span>Exportar Sin Aceptar</span>
              </button>
            </>
          )}

          {/* CSV Upload Label */}
          {selectedBatchId === null && (
            <label className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm border transition-all cursor-pointer select-none active:scale-95 w-full sm:w-auto ${uploading
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-[#003865] hover:bg-[#002a4d] text-white border-[#003865] hover:shadow'
              }`}>
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Cargando...</span>
                </>
              ) : (
                <>
                  <Upload size={16} className="text-sky-200 transition-transform group-hover:-translate-y-0.5" />
                  <span>Cargar CSV</span>
                </>
              )}
              <input
                type="file"
                accept=".csv"
                disabled={uploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={selectedBatchId === null ? "Buscar por nombre de archivo..." : "Buscar por póliza, asegurado, DNI..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] w-full text-sm bg-white shadow-inner"
            />
          </div>

          {/* Date Picker Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar size={14} className="text-[#00AEEF]" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Desde:</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-0.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#00AEEF] text-xs bg-white text-slate-700 font-medium cursor-pointer"
                title="Fecha desde"
              />
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar size={14} className="text-[#00AEEF]" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hasta:</span>
              </div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-0.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#00AEEF] text-xs bg-white text-slate-700 font-medium cursor-pointer"
                title="Fecha hasta"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-2 rounded-lg border border-red-100 hover:bg-red-50 transition-colors cursor-pointer text-center"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {selectedBatchId === null ? (
            /* Master View: Files List */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Archivo</th>
                  <th className="px-6 py-4">Fecha de Carga</th>
                  <th className="px-6 py-4 text-center">Pólizas Confirmadas</th>
                  <th className="px-6 py-4">Archivo Procesado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">
                      No se encontraron archivos de coberturas cargados.
                    </td>
                  </tr>
                ) : (
                  paginatedBatches.map((batch) => (
                    <tr
                      key={batch.key}
                      onClick={() => setSelectedBatchId(batch.key)}
                      className="group hover:bg-[#00AEEF]/5 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <FileText size={18} className="text-[#003865] group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-semibold text-slate-800 text-[13px] group-hover:text-[#00AEEF] transition-colors">
                            {batch.src_file}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-slate-600">
                        {batch.created_at ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{formatDate(batch.created_at)}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold bg-[#00AEEF]/10 text-[#003865] rounded-full">
                          <CheckCircle2 size={13} className="text-[#00AEEF] shrink-0" />
                          <span>{batch.confirmed} / {batch.total}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {batch.src_file ? (
                          (() => {
                            const processedFileName = `${batch.src_file}_processed.csv`;
                            const fileKey = `${batch.src_file}/${processedFileName}`;
                            const isFileUploaded = existingFiles.includes(fileKey);
                            return isFileUploaded ? (
                              <button 
                                onClick={() => handleDownloadFile(processedFileName, batch.src_file)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded transition-all shadow-sm cursor-pointer"
                                title="Descargar archivo procesado desde Cloudflare R2"
                              >
                                <Download size={13} className="text-emerald-600" />
                                <span className="max-w-[150px] truncate">{processedFileName}</span>
                              </button>
                            ) : (
                              <div 
                                className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200 px-2.5 py-1 rounded select-none"
                                title="Archivo procesado aún no cargado en Cloudflare R2"
                              >
                                <FileText size={13} />
                                <span className="max-w-[150px] truncate text-slate-400">{processedFileName}</span>
                              </div>
                            );
                          })()
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setSelectedBatchId(batch.key)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#00AEEF] hover:text-[#003865] transition-colors"
                          >
                            <span>Ver detalles</span>
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                          </button>

                          <button
                            onClick={() => handleFolderUploadClick(batch)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#00AEEF]/10 hover:bg-[#003865]/10 text-[#003865] px-2.5 py-1.5 rounded-lg transition-colors border border-[#00AEEF]/20"
                            title="Subir carpeta de certificados"
                          >
                            <Upload size={13} className="text-[#00AEEF]" />
                            <span>Cargar adjuntos</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Detail View: Policies Grid */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Asegurado / Email</th>
                  <th className="px-6 py-4">DNI</th>
                  <th className="px-6 py-4">Nº Póliza</th>
                  <th className="px-6 py-4">Adjunto 1</th>
                  <th className="px-6 py-4">Template ID</th>
                  <th className="px-6 py-4">Fecha Aceptación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCoberturas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                      No se encontraron registros de coberturas en este archivo.
                    </td>
                  </tr>
                ) : (
                  paginatedCoberturas.map((cobertura) => {
                    const isConfirmed = cobertura.poliza_confirmada === true ||
                      cobertura.poliza_confirmada === 1 ||
                      cobertura.poliza_confirmada === '1' ||
                      cobertura.poliza_confirmada === 'true';
                    return (
                      <tr key={cobertura.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              size={16}
                              className={`shrink-0 ${isConfirmed ? 'text-emerald-500' : 'text-slate-300'}`}
                              title={isConfirmed ? 'Confirmada' : 'Pendiente'}
                            />
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

                        <td className="px-6 py-4">
                          {cobertura.attach1 ? (
                            (() => {
                              const fileKey = `${cobertura.src_file || ''}/${cobertura.attach1}`;
                              const isFileUploaded = existingFiles.includes(fileKey);
                              return isFileUploaded ? (
                                <button 
                                  onClick={() => handleDownloadFile(cobertura.attach1)}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded transition-all shadow-sm cursor-pointer"
                                  title="Descargar archivo desde Cloudflare R2"
                                >
                                  <Download size={13} className="text-emerald-600" />
                                  <span className="max-w-[120px] truncate">{getAttachmentFilename(cobertura.attach1)}</span>
                                </button>
                              ) : (
                                <div 
                                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200 px-2.5 py-1 rounded select-none"
                                  title="Archivo aún no cargado en Cloudflare R2"
                                >
                                  <FileText size={13} />
                                  <span className="max-w-[120px] truncate text-slate-400">{getAttachmentFilename(cobertura.attach1)}</span>
                                </div>
                              );
                            })()
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-[11px] font-mono text-slate-500 max-w-[120px] truncate" title={cobertura.templateid}>
                          {cobertura.templateid || '-'}
                        </td>
                        <td className="px-6 py-4 text-[12px] text-slate-600">
                          {formatDate(cobertura.confirmado_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {totalItems > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <div>
              Mostrando <span className="font-semibold text-slate-700">{showingFrom}</span> a{' '}
              <span className="font-semibold text-slate-700">{showingTo}</span>{' '}
              de <span className="font-semibold text-slate-700">{totalItems}</span> {selectedBatchId === null ? 'archivos' : 'registros'}
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

      {/* Hidden Files Input */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        className="hidden"
        multiple
        accept=".pdf,.csv"
      />

      {/* Upload Progress Modal */}
      {uploadProgress.active && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-100 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-sky-50 text-[#00AEEF] rounded-lg">
                <Upload size={24} className="animate-bounce" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800 text-lg">Subiendo adjuntos a R2</h3>
                <p className="text-xs text-slate-500 font-mono truncate" title={uploadingBatch?.src_file}>
                  Destino: {uploadingBatch?.src_file}
                </p>
              </div>
            </div>

            {/* Current uploading file */}
            {uploadProgress.percentage < 100 && (
              <p className="text-xs text-slate-600 mb-2 truncate font-medium">
                Subiendo: <span className="font-semibold text-slate-800">{uploadProgress.currentFileName || 'Preparando...'}</span>
              </p>
            )}

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-3.5 mb-2 overflow-hidden border border-slate-200/50">
              <div
                className="bg-gradient-to-r from-[#00AEEF] to-[#003865] h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs font-semibold mb-4 text-slate-600">
              <span>{uploadProgress.percentage}% completado</span>
              <span>{uploadProgress.completed + uploadProgress.failed} de {uploadProgress.total} archivos</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1 text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Completados:</span>
                <span className="text-emerald-600 font-bold">{uploadProgress.completed}</span>
              </div>
              <div className="flex justify-between">
                <span>Fallidos:</span>
                <span className="text-red-500 font-bold">{uploadProgress.failed}</span>
              </div>
            </div>

            {/* Close button (only shown when finished) */}
            {uploadProgress.completed + uploadProgress.failed === uploadProgress.total && (
              <button
                onClick={() => setUploadProgress(prev => ({ ...prev, active: false }))}
                className="mt-5 w-full bg-[#003865] hover:bg-[#002a4d] text-white py-2 px-4 rounded-lg font-semibold shadow transition-colors"
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
