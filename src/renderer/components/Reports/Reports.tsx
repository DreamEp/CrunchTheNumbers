import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Card, Button, EmptyState } from '../ui';
import { ReportFilters } from './ReportFilters';
import { ReportSummary } from './ReportSummary';
import { ReportDetails } from './ReportDetails';
import { ExportModal } from './ExportModal';
import {
  ReportData,
  ReportFilters as ReportFiltersType,
} from '../../../shared/reportTypes';
import {
  calculateReport,
  calculateIndividualReport,
} from '../../utils/reportCalculations';

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: lastDayOfMonth.toISOString().split('T')[0],
  };
}

function Reports() {
  const {
    participants,
    sessionsHistory,
    dateMarkers,
    settings,
    cachedReport,
    cachedReportFilters,
    setCachedReport,
  } = useAppStore();

  const defaultDates = useMemo(() => getDefaultDateRange(), []);

  // Use cached filters if available, otherwise use defaults
  const [filters, setFilters] = useState<ReportFiltersType>(() =>
    cachedReportFilters || {
      mode: 'dateRange',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      selectedParticipantIds: [],
      reportDays: settings.recurringDays,
      includeCancelledInAverage: true,
      includeVacationSickInAverage: false,
      showRevenue: true,
    }
  );

  // Use cached report if available
  const [report, setReport] = useState<ReportData | null>(cachedReport);
  const [showExportModal, setShowExportModal] = useState(false);

  // Save report and filters to store when they change
  useEffect(() => {
    setCachedReport(report, filters);
  }, [report, filters, setCachedReport]);

  const handleGenerate = () => {
    if (filters.mode === 'individual' && filters.selectedParticipantIds.length === 1) {
      const participant = participants.find(
        (p) => p.id === filters.selectedParticipantIds[0]
      );
      if (participant) {
        const reportData = calculateIndividualReport(
          participant,
          sessionsHistory,
          dateMarkers,
          settings
        );
        setReport(reportData);
      }
    } else {
      const reportData = calculateReport(
        filters,
        participants,
        sessionsHistory,
        dateMarkers,
        settings
      );
      setReport(reportData);
    }
  };

  const formatPeriod = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text">Rapports</h2>
        {report && (
          <Button onClick={() => setShowExportModal(true)}>
            Exporter
          </Button>
        )}
      </div>

      <Card>
        <ReportFilters
          participants={participants}
          filters={filters}
          onFiltersChange={setFilters}
          onGenerate={handleGenerate}
        />
      </Card>

      {report ? (
        <div className="space-y-6">
          <div className="text-sm text-subtext">
            Rapport généré pour la période{' '}
            <span className="text-accent font-medium">
              {formatPeriod(report.periodStart, report.periodEnd)}
            </span>
          </div>

          <Card>
            <ReportSummary summary={report.summary} showRevenue={filters.showRevenue} />
          </Card>

          <Card>
            <ReportDetails details={report.participantDetails} showRevenue={filters.showRevenue} />
          </Card>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="📊"
            message="Sélectionnez les filtres et cliquez sur Générer pour créer un rapport"
          />
        </Card>
      )}

      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        report={report}
      />
    </div>
  );
}

export default Reports;
