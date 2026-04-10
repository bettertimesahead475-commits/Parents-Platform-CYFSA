import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Calendar, AlertTriangle, CheckCircle,
  Download, Share2, Clock, Scale, Shield, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { getCase, generateReport } from '../services/api';
import Timeline from '../components/Timeline';
import ViolationsList from '../components/ViolationsList';
import RemediesPanel from '../components/RemediesPanel';
import DocumentViewer from '../components/DocumentViewer';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ['case', id],
    queryFn: () => getCase(id!),
    refetchInterval: (data) => {
      // Keep polling if analysis is in progress
      return data?.status === 'analyzing' ? 5000 : false;
    }
  });

  const handleGenerateReport = async () => {
    try {
      const response = await generateReport(id!);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `case-report-${id}.pdf`;
      link.click();
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading case</div>;
  if (!caseData) return <div>Case not found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'violations', label: 'Issues Found', icon: AlertTriangle },
    { id: 'remedies', label: 'Procedural Options', icon: Scale },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Case #{caseData.caseNumber}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Created: {format(new Date(caseData.createdAt), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {caseData.documents?.length || 0} Documents
              </span>
              {caseData.metadata?.casAgency && (
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  {caseData.metadata.casAgency}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 
                       rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                       rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share with Lawyer
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          {caseData.status === 'analyzing' ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
              Analysis in Progress...
            </div>
          ) : caseData.status === 'completed' ? (
            <div className="inline-flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full ${getRiskLevelColor(caseData.analysis?.riskLevel)}`}>
                Risk Level: {caseData.analysis?.riskLevel?.toUpperCase()}
              </div>
              {caseData.analysis?.violations?.length > 0 && (
                <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                  {caseData.analysis.violations.length} Potential Issues Found
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm
                    transition-colors
                    ${selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'violations' && caseData.analysis?.violations?.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                      {caseData.analysis.violations.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Analysis Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {caseData.analysis?.summary || 'Analysis pending...'}
                  </p>
                </div>
              </div>

              {/* Key Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Key Findings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Timeline Events</span>
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold">
                      {caseData.timeline?.length || 0}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Potential Issues</span>
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      {caseData.analysis?.violations?.length || 0}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Remedies Available</span>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {caseData.analysis?.remedies?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Case Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Case Information</h3>
                <div className="border rounded-lg p-4">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-600">Parent(s)</dt>
                      <dd className="font-medium">
                        {caseData.metadata?.parentNames?.join(', ') || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Children</dt>
                      <dd className="font-medium">
                        {caseData.metadata?.childrenInfo?.map((c: any) => 
                          `${c.name} (age ${c.age})`
                        ).join(', ') || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">CAS Agency</dt>
                      <dd className="font-medium">
                        {caseData.metadata?.casAgency || 'Not specified'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-600">Court File #</dt>
                      <dd className="font-medium">
                        {caseData.metadata?.courtFileNumber || 'Not specified'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'timeline' && (
            <Timeline events={caseData.timeline || []} />
          )}

          {selectedTab === 'violations' && (
            <ViolationsList violations={caseData.analysis?.violations || []} />
          )}

          {selectedTab === 'remedies' && (
            <RemediesPanel remedies={caseData.analysis?.remedies || []} />
          )}

          {selectedTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
                <div className="space-y-2">
                  {caseData.documents?.map((doc: any) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocument(doc)}
                      className={`
                        w-full text-left p-3 border rounded-lg transition-colors
                        ${selectedDocument?.id === doc.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{doc.filename}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {doc.type} • {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                {selectedDocument ? (
                  <DocumentViewer document={selectedDocument} />
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500">Select a document to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Important Legal Notice</p>
            <p>
              This procedural compliance review is an educational tool based on the materials provided. 
              It analyzes CAS actions against Ontario's legal framework but does NOT constitute legal advice. 
              Every case is unique. You must consult with a qualified lawyer about your specific situation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
