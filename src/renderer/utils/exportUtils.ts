import { ReportData, ExportFormat } from '../../shared/reportTypes';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateForFilename(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

export function getDefaultFilename(report: ReportData): string {
  if (report.mode === 'individual' && report.participantDetails.length === 1) {
    const p = report.participantDetails[0].participant;
    return `rapport_${p.firstName}_${p.lastName}`.replace(/\s+/g, '_');
  }
  return `rapport_${formatDateForFilename(report.periodStart)}_${formatDateForFilename(report.periodEnd)}`;
}

export function exportToJSON(report: ReportData): string {
  return JSON.stringify(report, null, 2);
}

export function exportToCSV(report: ReportData): string {
  const lines: string[] = [];

  lines.push('RAPPORT PAINTRACKER');
  lines.push(`Mode;${report.mode === 'dateRange' ? 'Par dates' : 'Par personne'}`);
  lines.push(`Periode;${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`);
  lines.push(`Genere le;${formatDate(report.generatedAt)}`);
  lines.push('');

  lines.push('RESUME');
  lines.push(`Seances realisees;${report.summary.totalSessionsCompleted}`);
  lines.push(`Seances annulees;${report.summary.totalSessionsCancelled}`);
  lines.push(`Seances vacances;${report.summary.totalSessionsVacation}`);
  lines.push(`Seances maladie;${report.summary.totalSessionsSick}`);
  lines.push(`Seances a venir;${report.summary.totalSessionsUpcoming}`);
  lines.push(`Moyenne personnes/seance;${report.summary.averagePeoplePerSession.toFixed(1)}`);
  lines.push(`Packs achetes;${report.summary.creditPacksPurchased}`);
  lines.push(`Revenus totaux;${report.summary.totalRevenue.toFixed(2)} EUR`);

  if (report.summary.mostAssiduousPerson) {
    const p = report.summary.mostAssiduousPerson;
    lines.push(`Plus assidu;${p.participant.firstName} ${p.participant.lastName} (${p.rate.toFixed(0)}%)`);
  }
  if (report.summary.leastAssiduousPerson) {
    const p = report.summary.leastAssiduousPerson;
    lines.push(`Moins assidu;${p.participant.firstName} ${p.participant.lastName} (${p.rate.toFixed(0)}%)`);
  }
  if (report.summary.sessionWithMostParticipants) {
    const s = report.summary.sessionWithMostParticipants;
    lines.push(`Seance la plus remplie;${formatDate(s.date)} (${s.count} pers.)`);
  }
  if (report.summary.sessionWithFewestParticipants) {
    const s = report.summary.sessionWithFewestParticipants;
    lines.push(`Seance la moins remplie;${formatDate(s.date)} (${s.count} pers.)`);
  }
  if (report.summary.dayWithHighestAttendance) {
    const d = report.summary.dayWithHighestAttendance;
    lines.push(`Jour le plus populaire;${d.dayOfWeek} (${d.averageCount.toFixed(1)} pers. en moyenne)`);
  }

  lines.push('');
  lines.push('DETAILS PAR PARTICIPANT');
  lines.push('Nom;Prenom;Seances assistees;A venir;Seances achetees;Seances manquees;Taux presence;Revenus contribues');

  report.participantDetails.forEach((detail) => {
    const tauxStr = detail.attendanceRate !== null ? `${detail.attendanceRate.toFixed(0)}%` : 'N/A';
    lines.push(
      `${detail.participant.lastName};${detail.participant.firstName};${detail.sessionsAttended};${detail.sessionsUpcoming};${detail.sessionsPurchased};${detail.sessionsMissed};${tauxStr};${detail.revenueContributed.toFixed(2)} EUR`
    );
  });

  return lines.join('\n');
}

export function exportToHTML(report: ReportData): string {
  const catppuccinMocha = {
    base: '#1e1e2e',
    surface: '#313244',
    overlay: '#45475a',
    text: '#cdd6f4',
    subtext: '#a6adc8',
    accent: '#94e2d5',
    green: '#a6e3a1',
    red: '#f38ba8',
    yellow: '#f9e2af',
    peach: '#fab387',
  };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport PainTracker - ${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${catppuccinMocha.base};
      color: ${catppuccinMocha.text};
      padding: 2rem;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: ${catppuccinMocha.accent};
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    .subtitle {
      color: ${catppuccinMocha.subtext};
      margin-bottom: 2rem;
    }
    .section {
      background-color: ${catppuccinMocha.surface};
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .section-title {
      color: ${catppuccinMocha.accent};
      font-size: 1.25rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid ${catppuccinMocha.overlay};
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      background-color: ${catppuccinMocha.overlay};
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: ${catppuccinMocha.accent};
    }
    .stat-value.cancelled { color: ${catppuccinMocha.red}; }
    .stat-value.vacation { color: ${catppuccinMocha.peach}; }
    .stat-value.sick { color: ${catppuccinMocha.yellow}; }
    .stat-label {
      font-size: 0.875rem;
      color: ${catppuccinMocha.subtext};
      margin-top: 0.25rem;
    }
    .podium-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
    .podium-card {
      background-color: ${catppuccinMocha.overlay};
      padding: 1rem;
      border-radius: 8px;
    }
    .podium-title {
      font-size: 0.75rem;
      color: ${catppuccinMocha.subtext};
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .podium-value {
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: ${catppuccinMocha.overlay};
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: ${catppuccinMocha.subtext};
    }
    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid ${catppuccinMocha.overlay};
    }
    tr:hover {
      background-color: rgba(255,255,255,0.05);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .badge-success { background-color: rgba(166, 227, 161, 0.2); color: ${catppuccinMocha.green}; }
    .badge-warning { background-color: rgba(249, 226, 175, 0.2); color: ${catppuccinMocha.yellow}; }
    .badge-danger { background-color: rgba(243, 139, 168, 0.2); color: ${catppuccinMocha.red}; }
    .text-right { text-align: right; }
    .footer {
      text-align: center;
      color: ${catppuccinMocha.subtext};
      font-size: 0.75rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid ${catppuccinMocha.overlay};
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Rapport PainTracker</h1>
    <p class="subtitle">${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}</p>

    <div class="section">
      <h2 class="section-title">Resume</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${report.summary.totalSessionsCompleted}</div>
          <div class="stat-label">Seances realisees</div>
        </div>
        <div class="stat-card">
          <div class="stat-value cancelled">${report.summary.totalSessionsCancelled}</div>
          <div class="stat-label">Seances annulees</div>
        </div>
        <div class="stat-card">
          <div class="stat-value vacation">${report.summary.totalSessionsVacation}</div>
          <div class="stat-label">Vacances</div>
        </div>
        <div class="stat-card">
          <div class="stat-value sick">${report.summary.totalSessionsSick}</div>
          <div class="stat-label">Maladie</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.summary.totalSessionsUpcoming}</div>
          <div class="stat-label">A venir</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.summary.averagePeoplePerSession.toFixed(1)}</div>
          <div class="stat-label">Moyenne/seance</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.summary.creditPacksPurchased}</div>
          <div class="stat-label">Packs achetes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.summary.totalRevenue.toFixed(0)} EUR</div>
          <div class="stat-label">Revenus</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Podium</h2>
      <div class="podium-grid">
        ${report.summary.mostAssiduousPerson ? `
        <div class="podium-card">
          <div class="podium-title">Plus assidu</div>
          <div class="podium-value">${report.summary.mostAssiduousPerson.participant.firstName} ${report.summary.mostAssiduousPerson.participant.lastName}</div>
          <div class="badge badge-success">${report.summary.mostAssiduousPerson.rate.toFixed(0)}%</div>
        </div>
        ` : ''}
        ${report.summary.leastAssiduousPerson ? `
        <div class="podium-card">
          <div class="podium-title">Moins assidu</div>
          <div class="podium-value">${report.summary.leastAssiduousPerson.participant.firstName} ${report.summary.leastAssiduousPerson.participant.lastName}</div>
          <div class="badge badge-danger">${report.summary.leastAssiduousPerson.rate.toFixed(0)}%</div>
        </div>
        ` : ''}
        ${report.summary.sessionWithMostParticipants ? `
        <div class="podium-card">
          <div class="podium-title">Seance la plus remplie</div>
          <div class="podium-value">${formatDate(report.summary.sessionWithMostParticipants.date)}</div>
          <div>${report.summary.sessionWithMostParticipants.count} personnes</div>
        </div>
        ` : ''}
        ${report.summary.sessionWithFewestParticipants ? `
        <div class="podium-card">
          <div class="podium-title">Seance la moins remplie</div>
          <div class="podium-value">${formatDate(report.summary.sessionWithFewestParticipants.date)}</div>
          <div>${report.summary.sessionWithFewestParticipants.count} personnes</div>
        </div>
        ` : ''}
        ${report.summary.dayWithHighestAttendance ? `
        <div class="podium-card">
          <div class="podium-title">Jour le plus populaire</div>
          <div class="podium-value">${report.summary.dayWithHighestAttendance.dayOfWeek}</div>
          <div>${report.summary.dayWithHighestAttendance.averageCount.toFixed(1)} pers. en moyenne</div>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Details par participant</h2>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prenom</th>
            <th class="text-right">Assistees</th>
            <th class="text-right">A venir</th>
            <th class="text-right">Achetees</th>
            <th class="text-right">Manquees</th>
            <th class="text-right">Taux</th>
            <th class="text-right">Revenus</th>
          </tr>
        </thead>
        <tbody>
          ${report.participantDetails.map(detail => {
            const tauxBadge = detail.attendanceRate !== null
              ? `<span class="badge ${detail.attendanceRate >= 80 ? 'badge-success' : detail.attendanceRate >= 50 ? 'badge-warning' : 'badge-danger'}">${detail.attendanceRate.toFixed(0)}%</span>`
              : '<span style="color: ${catppuccinMocha.subtext}">N/A</span>';
            return `
          <tr>
            <td>${detail.participant.lastName}</td>
            <td>${detail.participant.firstName}</td>
            <td class="text-right">${detail.sessionsAttended}</td>
            <td class="text-right" style="color: ${catppuccinMocha.accent}">${detail.sessionsUpcoming}</td>
            <td class="text-right">${detail.sessionsPurchased}</td>
            <td class="text-right">${detail.sessionsMissed}</td>
            <td class="text-right">${tauxBadge}</td>
            <td class="text-right">${detail.revenueContributed.toFixed(2)} EUR</td>
          </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Rapport genere le ${formatDate(report.generatedAt)} avec PainTracker</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

export async function exportToPDF(report: ReportData): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  // Couleurs professionnelles pour PDF (fond clair)
  const colors = {
    primary: [41, 128, 185] as [number, number, number],      // Bleu professionnel
    secondary: [52, 73, 94] as [number, number, number],      // Gris foncé
    text: [44, 62, 80] as [number, number, number],           // Texte principal
    textLight: [127, 140, 141] as [number, number, number],   // Texte secondaire
    success: [39, 174, 96] as [number, number, number],       // Vert
    warning: [241, 196, 15] as [number, number, number],      // Jaune
    danger: [231, 76, 60] as [number, number, number],        // Rouge
    headerBg: [236, 240, 241] as [number, number, number],    // Gris clair pour en-têtes
    rowAlt: [248, 249, 250] as [number, number, number],      // Gris très clair pour lignes alternées
  };

  // Titre
  doc.setFontSize(22);
  doc.setTextColor(...colors.primary);
  doc.text('Rapport PainTracker', 14, 22);

  // Sous-titre (période)
  doc.setFontSize(11);
  doc.setTextColor(...colors.textLight);
  doc.text(`Période : ${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`, 14, 30);

  // Ligne de séparation
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(14, 34, 196, 34);

  let y = 44;

  // Section Résumé
  doc.setFontSize(14);
  doc.setTextColor(...colors.secondary);
  doc.text('Résumé', 14, y);
  y += 8;

  const summaryData = [
    ['Séances réalisées', report.summary.totalSessionsCompleted.toString()],
    ['Séances annulées', report.summary.totalSessionsCancelled.toString()],
    ['Séances vacances', report.summary.totalSessionsVacation.toString()],
    ['Séances maladie', report.summary.totalSessionsSick.toString()],
    ['Moyenne participants/séance', report.summary.averagePeoplePerSession.toFixed(1)],
    ['Packs achetés', report.summary.creditPacksPurchased.toString()],
    ['Revenus totaux', `${report.summary.totalRevenue.toFixed(2)} €`],
  ];

  if (report.summary.mostAssiduousPerson) {
    const p = report.summary.mostAssiduousPerson;
    summaryData.push(['Plus assidu', `${p.participant.firstName} ${p.participant.lastName} (${p.rate.toFixed(0)}%)`]);
  }

  if (report.summary.leastAssiduousPerson) {
    const p = report.summary.leastAssiduousPerson;
    summaryData.push(['Moins assidu', `${p.participant.firstName} ${p.participant.lastName} (${p.rate.toFixed(0)}%)`]);
  }

  if (report.summary.sessionWithMostParticipants) {
    const s = report.summary.sessionWithMostParticipants;
    summaryData.push(['Séance la plus remplie', `${formatDate(s.date)} (${s.count} pers.)`]);
  }

  if (report.summary.sessionWithFewestParticipants) {
    const s = report.summary.sessionWithFewestParticipants;
    summaryData.push(['Séance la moins remplie', `${formatDate(s.date)} (${s.count} pers.)`]);
  }

  if (report.summary.dayWithHighestAttendance) {
    const d = report.summary.dayWithHighestAttendance;
    summaryData.push(['Jour le plus populaire', `${d.dayOfWeek} (${d.averageCount.toFixed(1)} moy.)`]);
  }

  autoTable(doc, {
    startY: y,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: colors.text,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: colors.textLight },
      1: { cellWidth: 70, halign: 'left' },
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Section Détails par participant
  doc.setFontSize(14);
  doc.setTextColor(...colors.secondary);
  doc.text('Détails par participant', 14, y);
  y += 8;

  const tableData = report.participantDetails.map((detail) => [
    detail.participant.lastName.toUpperCase(),
    detail.participant.firstName,
    detail.sessionsAttended.toString(),
    detail.sessionsUpcoming.toString(),
    detail.sessionsPurchased.toString(),
    detail.sessionsMissed.toString(),
    detail.attendanceRate !== null ? `${detail.attendanceRate.toFixed(0)}%` : 'N/A',
    `${detail.revenueContributed.toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Nom', 'Prénom', 'Assistées', 'À venir', 'Achetées', 'Manquées', 'Taux', 'Revenus']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: colors.text,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: colors.rowAlt,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center', textColor: colors.primary },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'right' },
    },
    didParseCell: (data) => {
      // Colorer le taux de présence selon la valeur
      if (data.section === 'body' && data.column.index === 6) {
        const rawValue = data.cell.raw as string;
        if (rawValue === 'N/A') {
          data.cell.styles.textColor = colors.textLight;
          data.cell.styles.fontStyle = 'italic';
        } else {
          const rate = parseFloat(rawValue);
          if (rate >= 80) {
            data.cell.styles.textColor = colors.success;
            data.cell.styles.fontStyle = 'bold';
          } else if (rate >= 50) {
            data.cell.styles.textColor = [180, 140, 20];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = colors.danger;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...colors.textLight);
    doc.text(
      `Généré le ${formatDate(report.generatedAt)} avec PainTracker — Page ${i}/${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

export function getExportContent(
  report: ReportData,
  format: ExportFormat
): string | Promise<Uint8Array> {
  switch (format) {
    case 'json':
      return exportToJSON(report);
    case 'csv':
      return exportToCSV(report);
    case 'html':
      return exportToHTML(report);
    case 'pdf':
      return exportToPDF(report);
  }
}

export function getFileExtension(format: ExportFormat): string {
  return format;
}

export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'html':
      return 'text/html';
    case 'pdf':
      return 'application/pdf';
  }
}
