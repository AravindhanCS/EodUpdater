import React, { useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

export default function FileUploadSection({
  selectedFile,
  onFileSelect,
  isDragActive,
  setIsDragActive
}) {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileSelect(file);
      }
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="file-upload-card glass-panel">
      <div 
        className={`upload-dropzone ${isDragActive ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".xlsx,.xls"
          onChange={handleInputChange}
        />

        {selectedFile ? (
          <div className="file-selected-info">
            <div className="file-badge-icon">
              <FileSpreadsheet size={28} className="sheet-icon" />
            </div>
            <div>
              <h4 className="file-name">{selectedFile.name}</h4>
              <p className="file-meta">
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready to append entries and download
              </p>
            </div>
            <span className="change-file-btn">Change file</span>
          </div>
        ) : (
          <div className="upload-prompt">
            <UploadCloud size={36} className="upload-icon" />
            <h4>Drop your Effort Tracker Excel file here</h4>
            <p>or click to browse from your computer (.xlsx)</p>
          </div>
        )}
      </div>
    </div>
  );
}
