import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createCase, uploadDocuments } from '../services/api';
import DocumentList from '../components/DocumentList';
import CaseMetadataForm from '../components/CaseMetadataForm';

export default function NewCase() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [caseMetadata, setCaseMetadata] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt'],
      'audio/*': ['.mp3', '.wav', '.m4a']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!caseMetadata) {
      toast.error('Please fill in case information');
      return;
    }

    if (files.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setIsUploading(true);

    try {
      // Create case
      const caseResponse = await createCase(caseMetadata);
      const caseId = caseResponse.data.id;

      // Upload documents
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });
      formData.append('caseId', caseId);

      await uploadDocuments(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
        setUploadProgress(progress);
      });

      toast.success('Case created successfully! Analysis in progress...');
      navigate(`/case/${caseId}`);
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          New Case Analysis
        </h1>
        <p className="text-gray-600">
          Upload your documents and we'll analyze them for procedural compliance
        </p>
      </div>

      {/* Case Metadata Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Case Information</h2>
        <CaseMetadataForm onSubmit={setCaseMetadata} />
      </div>

      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Document Upload</h2>
        
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the files here...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-2">
                Drag & drop your documents here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, Word, Images, Text files, and Audio recordings
              </p>
            </>
          )}
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Uploaded Documents ({files.length})</h3>
            <DocumentList files={files} onRemove={removeFile} />
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-gray-600">Uploading documents...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Privacy & Confidentiality</p>
            <p>
              All documents are encrypted and processed securely. Your information
              is never shared with third parties. Analysis is performed for
              educational purposes only and does not constitute legal advice.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isUploading}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={files.length === 0 || isUploading || !caseMetadata}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Processing...' : 'Start Analysis'}
        </button>
      </div>
    </div>
  );
}
