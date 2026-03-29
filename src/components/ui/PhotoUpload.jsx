import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { getPhotoPublicUrl } from '../../utils/urlUtils';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPT_STRING = ACCEPTED_TYPES.join(',');

export default function PhotoUpload({
  value,
  onChange,
  candidateId,
  required = false,
  error: externalError,
  disabled = false
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const displayUrl = previewUrl || getPhotoPublicUrl(value);
  const displayError = externalError || uploadError;

  const getFileExtension = (file) => {
    const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    return map[file.type] || 'jpg';
  };

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato nao suportado. Use JPG, PNG ou WebP.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `A foto deve ter no maximo ${MAX_SIZE_MB}MB. Arquivo selecionado: ${(file.size / 1024 / 1024).toFixed(1)}MB.`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    setUploading(true);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const ext = getFileExtension(file);
      const id = candidateId || crypto.randomUUID();
      const path = `${id}.${ext}`;

      const { error } = await supabase.storage
        .from('candidate-photos')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      onChange(path);
    } catch (err) {
      console.error('Erro ao fazer upload da foto:', err);
      setUploadError('Erro ao enviar a foto. Verifique sua conexao e tente novamente.');
      setPreviewUrl(null);
      onChange('');
    } finally {
      setUploading(false);
    }
  }, [candidateId, onChange]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setUploadError(null);
    onChange('');
  };

  const handleClick = () => {
    if (!uploading && !disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground mb-1">
        Foto {required && <span className="text-red-500">*</span>}
      </label>

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[180px] rounded-lg border-2 border-dashed
          cursor-pointer transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${dragOver
            ? 'border-young-orange bg-young-orange/10'
            : displayError
              ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
              : 'border-input hover:border-young-orange/60 bg-background'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="w-8 h-8 text-young-orange animate-spin" />
            <p className="text-sm text-muted-foreground">Enviando foto...</p>
          </div>
        ) : displayUrl ? (
          <div className="relative w-full flex justify-center py-4">
            <img
              src={displayUrl}
              alt="Foto do candidato"
              className="max-h-48 max-w-full rounded-lg object-contain"
              onError={() => {
                // If the stored URL fails to load, clear preview
                if (previewUrl) setPreviewUrl(null);
              }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                title="Remover foto"
              >
                <X size={14} />
              </button>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              Clique para trocar a foto
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                <span className="text-young-orange">Clique para selecionar</span> ou arraste uma foto
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG ou WebP (max. {MAX_SIZE_MB}MB)
              </p>
            </div>
            <Upload className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {displayError && (
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs">{displayError}</p>
        </div>
      )}
    </div>
  );
}
