import React, { useState, useMemo } from 'react';
import { Allowance, ExportOptions, ExportField, ImportResult, ImportError } from '../../types/allowance';

interface AllowanceExportProps {
  allowances: Allowance[];
  onImport: (data: any[]) => Promise<ImportResult>;
  onExportComplete?: (filename: string, recordCount: number) => void;
}

const AllowanceExport: React.FC<AllowanceExportProps> = ({
  allowances,
  onImport,
  onExportComplete
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeRevoked: false,
    fields: ['spender', 'amount', 'contract', 'createdAt', 'status']
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);

  const availableFields: { key: ExportField; label: string; description: string }[] = [
    { key: 'spender', label: 'Spender Address', description: 'The address that can spend the tokens' },
    { key: 'amount', label: 'Amount', description: 'The allowance amount' },
    { key: 'contract', label: 'Contract', description: 'Token contract name and address' },
    { key: 'createdAt', label: 'Created Date', description: 'When the allowance was created' },
    { key: 'status', label: 'Status', description: 'Current allowance status' },
    { key: 'metadata', label: 'Metadata', description: 'Additional allowance information' }
  ];

  const filteredAllowances = useMemo(() => {
    let filtered = [...allowances];
    
    if (!exportOptions.includeRevoked) {
      filtered = filtered.filter(a => a.status !== 'revoked');
    }
    
    if (exportOptions.dateRange) {
      filtered = filtered.filter(a => 
        a.createdAt >= exportOptions.dateRange!.start && 
        a.createdAt <= exportOptions.dateRange!.end
      );
    }
    
    return filtered;
  }, [allowances, exportOptions]);

  const handleFieldToggle = (field: ExportField) => {
    setExportOptions(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field]
    }));
  };

  const generateCSV = (data: Allowance[]): string => {
    const headers = exportOptions.fields.map(field => {
      const fieldInfo = availableFields.find(f => f.key === field);
      return fieldInfo?.label || field;
    });

    const rows = data.map(allowance => {
      return exportOptions.fields.map(field => {
        switch (field) {
          case 'spender':
            return allowance.spender;
          case 'amount':
            return allowance.amount.toString();
          case 'contract':
            return `${allowance.contractName} (${allowance.contractAddress})`;
          case 'createdAt':
            return allowance.createdAt.toISOString();
          case 'status':
            return allowance.status;
          case 'metadata':
            return JSON.stringify(allowance.metadata || {});
          default:
            return '';
        }
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  const generateJSON = (data: Allowance[]): string => {
    const exportData = data.map(allowance => {
      const exportItem: any = {};
      
      exportOptions.fields.forEach(field => {
        switch (field) {
          case 'spender':
            exportItem.spender = allowance.spender;
            break;
          case 'amount':
            exportItem.amount = allowance.amount.toString();
            break;
          case 'contract':
            exportItem.contractName = allowance.contractName;
            exportItem.contractAddress = allowance.contractAddress;
            break;
          case 'createdAt':
            exportItem.createdAt = allowance.createdAt.toISOString();
            break;
          case 'status':
            exportItem.status = allowance.status;
            break;
          case 'metadata':
            exportItem.metadata = allowance.metadata;
            break;
        }
      });
      
      return exportItem;
    });

    return JSON.stringify(exportData, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (filteredAllowances.length === 0) {
      alert('No allowances to export with current filters');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(90, prev + 10));
      }, 100);

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `allowances_${timestamp}.${exportOptions.format}`;
      
      let content: string;
      let mimeType: string;

      if (exportOptions.format === 'csv') {
        content = generateCSV(filteredAllowances);
        mimeType = 'text/csv';
      } else {
        content = generateJSON(filteredAllowances);
        mimeType = 'application/json';
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      downloadFile(content, filename, mimeType);
      
      if (onExportComplete) {
        onExportComplete(filename, filteredAllowances.length);
      }

      setTimeout(() => {
        setExportProgress(0);
        setIsExporting(false);
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
      alert('Export failed. Please try again.');
    }
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('Invalid CSV format');

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const parseJSON = (content: string): any[] => {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  };

  const validateImportData = (data: any[]): ImportError[] => {
    const errors: ImportError[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      
      if (!row.spender) {
        errors.push({
          row: rowNumber,
          field: 'spender',
          message: 'Spender address is required'
        });
      }
      
      if (!row.amount) {
        errors.push({
          row: rowNumber,
          field: 'amount',
          message: 'Amount is required'
        });
      } else if (isNaN(Number(row.amount))) {
        errors.push({
          row: rowNumber,
          field: 'amount',
          message: 'Amount must be a valid number'
        });
      }
      
      if (row.spender && !/^S[TPMN][0-9A-Z]{39}$/.test(row.spender)) {
        errors.push({
          row: rowNumber,
          field: 'spender',
          message: 'Invalid Stacks address format'
        });
      }
    });
    
    return errors;
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const content = await importFile.text();
      setImportProgress(25);

      let data: any[];
      
      if (importFile.name.endsWith('.csv')) {
        data = parseCSV(content);
      } else if (importFile.name.endsWith('.json')) {
        data = parseJSON(content);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON files.');
      }

      setImportProgress(50);

      const validationErrors = validateImportData(data);
      setImportProgress(75);

      const result = await onImport(data);
      setImportProgress(100);
      
      setImportResult({
        ...result,
        errors: [...validationErrors, ...result.errors]
      });

    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [{
          row: 0,
          field: 'file',
          message: error instanceof Error ? error.message : 'Import failed'
        }]
      });
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 2000);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  return (
    <div className="allowance-export">
      <div className="export-section">
        <h3>Export Allowances</h3>
        
        <div className="export-options">
          <div className="option-group">
            <label>Export Format</label>
            <div className="format-options">
              <label className="radio-option">
                <input
                  type="radio"
                  value="csv"
                  checked={exportOptions.format === 'csv'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'csv' | 'json' }))}
                />
                CSV (Spreadsheet)
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="json"
                  checked={exportOptions.format === 'json'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'csv' | 'json' }))}
                />
                JSON (Data)
              </label>
            </div>
          </div>

          <div className="option-group">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={exportOptions.includeRevoked}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeRevoked: e.target.checked }))}
              />
              Include revoked allowances
            </label>
          </div>

          <div className="option-group">
            <label>Fields to Export</label>
            <div className="field-options">
              {availableFields.map(field => (
                <label key={field.key} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={exportOptions.fields.includes(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                  />
                  <span className="field-label">{field.label}</span>
                  <span className="field-description">{field.description}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="option-group">
            <label>Date Range (Optional)</label>
            <div className="date-range">
              <input
                type="date"
                value={exportOptions.dateRange?.start.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setExportOptions(prev => ({
                    ...prev,
                    dateRange: date ? { ...prev.dateRange, start: date } : undefined
                  }));
                }}
              />
              <span>to</span>
              <input
                type="date"
                value={exportOptions.dateRange?.end.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setExportOptions(prev => ({
                    ...prev,
                    dateRange: date ? { ...prev.dateRange, end: date } : undefined
                  }));
                }}
              />
            </div>
          </div>
        </div>

        <div className="export-summary">
          <p>
            Ready to export <strong>{filteredAllowances.length}</strong> allowances
            {exportOptions.fields.length > 0 && (
              <span> with <strong>{exportOptions.fields.length}</strong> fields</span>
            )}
          </p>
        </div>

        {isExporting && (
          <div className="export-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="progress-text">Exporting... {exportProgress}%</span>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={isExporting || filteredAllowances.length === 0 || exportOptions.fields.length === 0}
          className="export-button"
        >
          {isExporting ? 'Exporting...' : `Export ${filteredAllowances.length} Allowances`}
        </button>
      </div>

      <div className="import-section">
        <h3>Import Allowances</h3>
        
        <div className="import-options">
          <div className="file-input-group">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="file-input"
              id="import-file"
            />
            <label htmlFor="import-file" className="file-input-label">
              {importFile ? importFile.name : 'Choose CSV or JSON file'}
            </label>
          </div>

          {importFile && (
            <div className="file-info">
              <p>File: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>
            </div>
          )}
        </div>

        {isImporting && (
          <div className="import-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <span className="progress-text">Importing... {importProgress}%</span>
          </div>
        )}

        {importResult && (
          <div className="import-result">
            <div className={`result-summary ${importResult.success ? 'success' : 'error'}`}>
              <h4>{importResult.success ? 'Import Completed' : 'Import Failed'}</h4>
              <div className="result-stats">
                <span>Imported: {importResult.imported}</span>
                <span>Skipped: {importResult.skipped}</span>
                <span>Errors: {importResult.errors.length}</span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="import-errors">
                <h5>Import Errors:</h5>
                <div className="error-list">
                  {importResult.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="error-item">
                      <span className="error-row">Row {error.row}:</span>
                      <span className="error-field">{error.field}</span>
                      <span className="error-message">{error.message}</span>
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <div className="more-errors">
                      +{importResult.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!importFile || isImporting}
          className="import-button"
        >
          {isImporting ? 'Importing...' : 'Import Allowances'}
        </button>
      </div>
    </div>
  );
};

export default AllowanceExport;