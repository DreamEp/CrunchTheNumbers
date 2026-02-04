import { useState, useEffect } from 'react';
import {
  Modal,
  ModalTitle,
  ModalActions,
  Button,
  Input,
  Label,
  FormGroup,
} from '../ui';
import { ReportData, ExportFormat } from '../../../shared/reportTypes';
import {
  getDefaultFilename,
  getExportContent,
  getFileExtension,
  getMimeType,
} from '../../utils/exportUtils';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  report: ReportData | null;
}

const formatOptions: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'json', label: 'JSON', description: 'Données brutes structurées' },
  { value: 'csv', label: 'CSV', description: 'Tableur (Excel, Google Sheets)' },
  { value: 'html', label: 'HTML', description: 'Page web stylisée' },
  { value: 'pdf', label: 'PDF', description: 'Document imprimable' },
];

function ExportModal({ open, onClose, report }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [filename, setFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (open && report) {
      setFilename(getDefaultFilename(report));
    }
  }, [open, report]);

  const handleExport = async () => {
    if (!report) return;

    setIsExporting(true);

    try {
      const extension = getFileExtension(selectedFormat);
      const fullFilename = `${filename}.${extension}`;

      const filters = [
        {
          name: formatOptions.find((f) => f.value === selectedFormat)?.label || selectedFormat.toUpperCase(),
          extensions: [extension],
        },
      ];

      const result = await window.api.showSaveDialog({
        defaultPath: fullFilename,
        filters,
      });

      if (result.canceled || !result.filePath) {
        setIsExporting(false);
        return;
      }

      const content = await getExportContent(report, selectedFormat);

      if (selectedFormat === 'pdf') {
        const pdfContent = content as Uint8Array;
        await window.api.saveFile(result.filePath, pdfContent, 'binary');
      } else {
        await window.api.saveFile(result.filePath, content as string, 'utf-8');
      }

      onClose();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="md">
      <ModalTitle>Exporter le rapport</ModalTitle>

      <div className="space-y-4">
        <FormGroup>
          <Label>Nom du fichier</Label>
          <Input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Nom du fichier"
          />
        </FormGroup>

        <FormGroup>
          <Label>Format</Label>
          <div className="grid grid-cols-2 gap-3">
            {formatOptions.map((format) => (
              <button
                key={format.value}
                type="button"
                onClick={() => setSelectedFormat(format.value)}
                className={`
                  p-3 rounded-lg border text-left
                  transition-all duration-200
                  ${
                    selectedFormat === format.value
                      ? 'border-accent bg-accentMuted'
                      : 'border-border bg-overlay hover:border-muted'
                  }
                `}
              >
                <div
                  className={`font-medium ${
                    selectedFormat === format.value ? 'text-accent' : 'text-text'
                  }`}
                >
                  {format.label}
                </div>
                <div className="text-xs text-subtext mt-0.5">
                  {format.description}
                </div>
              </button>
            ))}
          </div>
        </FormGroup>
      </div>

      <ModalActions>
        <Button variant="secondary" onClick={onClose} disabled={isExporting}>
          Annuler
        </Button>
        <Button onClick={handleExport} disabled={isExporting || !filename.trim()}>
          {isExporting ? 'Exportation...' : 'Exporter'}
        </Button>
      </ModalActions>
    </Modal>
  );
}

export { ExportModal };
