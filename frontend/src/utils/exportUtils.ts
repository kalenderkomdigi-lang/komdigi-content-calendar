import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { IdeaItem, VideoContent, ContentIdea, PodcastEpisode } from '@/utils/api';

interface DocWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

/**
 * Sanitizes file names for safe saving
 */
const sanitizeFilename = (name: string): string => {
  return (name || 'konten').replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 50);
};

/**
 * Helper to add official BLSDM Komdigi Header in PDF documents
 */
const addPDFHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Blue accent bar at top
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text('BADAN PENGEMBANGAN SDM KOMUNIKASI DAN DIGITAL', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('Kementerian Komunikasi dan Digital Republik Indonesia', 14, 24);

  // Divider line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 28, pageWidth - 14, 28);

  // Document Subject Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(title, 14, 36);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text(subtitle, 14, 42);
  }
};

/**
 * Helper to add Footer with page numbers
 */
const addPDFFooter = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    
    const footerText = `Dokumen Resmi BLSDM Komdigi | Halaman ${i} dari ${pageCount}`;
    doc.text(footerText, 14, pageHeight - 10);

    const timeText = `Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    doc.text(timeText, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }
};

// ==========================================
// 1. IDE KONTEN EXPORTS (PDF & EXCEL)
// ==========================================

export const exportIdeasToPDF = (theme: string, dateStr: string, ideas: IdeaItem[]) => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'REKOMENDASI IDE KONTEN MEDIA SOSIAL', `Tema: "${theme}" ${dateStr ? `| Tanggal: ${dateStr}` : ''}`);

  const tableData = ideas.map((idea, idx) => [
    `0${idx + 1}`,
    idea.title || '-',
    idea.format || '-',
    idea.summary || '-',
    idea.reference_url || '-'
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['No', 'Judul Ide Konten', 'Format', 'Ringkasan / Alur Pembahasan', 'Link Referensi']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 65 },
      4: { cellWidth: 40, textColor: [37, 99, 235] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  addPDFFooter(doc);
  doc.save(`Ide_Konten_${sanitizeFilename(theme)}.pdf`);
};

export const exportIdeasToExcel = (theme: string, dateStr: string, ideas: IdeaItem[]) => {
  const rows = ideas.map((idea, idx) => ({
    'No': idx + 1,
    'Tema Utama': theme,
    'Tanggal': dateStr || '-',
    'Judul Ide Konten': idea.title,
    'Format Konten': idea.format,
    'Ringkasan Konten': idea.summary,
    'Link Referensi': idea.reference_url || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 25 }, // Tema Utama
    { wch: 15 }, // Tanggal
    { wch: 35 }, // Judul Ide
    { wch: 20 }, // Format Konten
    { wch: 50 }, // Ringkasan Konten
    { wch: 45 }  // Link Referensi
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ide Konten');

  XLSX.writeFile(workbook, `Ide_Konten_${sanitizeFilename(theme)}.xlsx`);
};

// ==========================================
// 2. STORYBOARD / KONSEP VIDEO EXPORTS (PDF & EXCEL)
// ==========================================

export const exportStoryboardToPDF = (theme: string, video: VideoContent) => {
  const doc = new jsPDF();
  addPDFHeader(doc, 'NASKAH & STORYBOARD VIDEO PRODUCTION', `Topik: "${theme}" | Format: ${video.format} | Durasi: ${video.duration}`);

  let currentY = 48;

  // Metadata Table Box
  const metaData = [
    ['Judul Video', video.title || '-'],
    ['Format Video', video.format || '-'],
    ['Durasi Total', video.duration || '-'],
    ['Hook (3 Detik Pertama)', `"${video.hook || '-'}"`],
    ['Saran Musik Latar', video.music_suggestion || '-'],
    ['Call to Action (CTA)', video.cta || '-']
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Parameter', 'Detail Spesifikasi Video']],
    body: metaData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
      cellPadding: 3.5
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold', fillColor: [241, 245, 249] },
      1: { cellWidth: 140 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Storyboard Scenes Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('ALUR SCENE STORYBOARD', 14, currentY);

  currentY += 4;

  const sceneRows = (video.scenes || []).map((scene) => [
    `Scene ${scene.scene_number}`,
    scene.duration || '-',
    scene.visual || '-',
    `"${scene.narration || '-'}"`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Scene', 'Durasi', 'Deskripsi Visual & Camera Shot', 'Naskah Narasi / Dialog']],
    body: sceneRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 70 },
      3: { cellWidth: 75, fontStyle: 'italic' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Caption Section
  if (video.caption) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('CAPTION MEDIA SOSIAL & HASHTAGS', 14, currentY);

    currentY += 4;

    const fullCaptionText = `${video.caption}\n\n${(video.hashtags || []).join(' ')}`;

    autoTable(doc, {
      startY: currentY,
      head: [['Draf Caption Siap Publikasi']],
      body: [[fullCaptionText]],
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // Emerald-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 4
      }
    });
  }

  addPDFFooter(doc);
  doc.save(`Storyboard_${sanitizeFilename(video.title || theme)}.pdf`);
};

export const exportStoryboardToExcel = (theme: string, video: VideoContent) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Konsep Video & Metadata
  const metaRows = [
    { 'Parameter': 'Judul Video', 'Detail': video.title },
    { 'Parameter': 'Format Video', 'Detail': video.format },
    { 'Parameter': 'Durasi Total', 'Detail': video.duration },
    { 'Parameter': 'Hook (3 Detik Pertama)', 'Detail': video.hook },
    { 'Parameter': 'Saran Musik Latar', 'Detail': video.music_suggestion },
    { 'Parameter': 'Call to Action (CTA)', 'Detail': video.cta },
    { 'Parameter': 'Caption', 'Detail': video.caption },
    { 'Parameter': 'Hashtags', 'Detail': (video.hashtags || []).join(' ') }
  ];
  const metaSheet = XLSX.utils.json_to_sheet(metaRows);
  metaSheet['!cols'] = [{ wch: 25 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(workbook, metaSheet, 'Konsep Video');

  // Sheet 2: Storyboard Scenes
  const sceneRows = (video.scenes || []).map((scene) => ({
    'Scene #': scene.scene_number,
    'Durasi': scene.duration,
    'Deskripsi Visual & Shot': scene.visual,
    'Naskah Narasi / Dialog': scene.narration
  }));
  const sceneSheet = XLSX.utils.json_to_sheet(sceneRows);
  sceneSheet['!cols'] = [
    { wch: 10 },
    { wch: 15 },
    { wch: 50 },
    { wch: 60 }
  ];
  XLSX.utils.book_append_sheet(workbook, sceneSheet, 'Storyboard Scenes');

  XLSX.writeFile(workbook, `Storyboard_${sanitizeFilename(video.title || theme)}.xlsx`);
};

// ==========================================
// 3. RIWAYAT KONTEN EXPORTS (PDF & EXCEL)
// ==========================================

export const exportHistoryItemToPDF = (item: ContentIdea) => {
  const doc = new jsPDF();
  const dateFormatted = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  addPDFHeader(doc, 'RIWAYAT PUBLIKASI KONTEN MEDIA SOSIAL', `Tema: "${item.theme}" | Jadwal Tayang: ${dateFormatted}`);

  let currentY = 48;

  if (item.ideas && item.ideas.length > 0) {
    const tableData = item.ideas.map((idea, idx) => [
      `0${idx + 1}`,
      idea.title || '-',
      idea.format || '-',
      idea.summary || '-',
      idea.reference_url || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Judul Ide Konten', 'Format', 'Ringkasan / Alur Pembahasan', 'Link Referensi']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
        cellPadding: 3.5
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 65 },
        4: { cellWidth: 40, textColor: [37, 99, 235] }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (item.caption) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('CAPTION MEDIA SOSIAL', 14, currentY);

    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Teks Caption Siap Publikasi']],
      body: [[item.caption]],
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 4
      }
    });
  }

  addPDFFooter(doc);
  doc.save(`Riwayat_Konten_${sanitizeFilename(item.theme)}.pdf`);
};

export const exportHistoryItemToExcel = (item: ContentIdea) => {
  const workbook = XLSX.utils.book_new();

  const dateFormatted = new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Sheet 1: Ide Konten
  if (item.ideas && item.ideas.length > 0) {
    const ideasRows = item.ideas.map((idea, idx) => ({
      'No': idx + 1,
      'Tema': item.theme,
      'Jadwal Tayang': dateFormatted,
      'Judul Ide': idea.title,
      'Format': idea.format,
      'Ringkasan': idea.summary,
      'Link Referensi': idea.reference_url || '-'
    }));
    const ideasSheet = XLSX.utils.json_to_sheet(ideasRows);
    ideasSheet['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 35 },
      { wch: 20 },
      { wch: 50 },
      { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(workbook, ideasSheet, 'Ide Konten');
  }

  // Sheet 2: Caption
  const captionRows = [
    { 'Tema': item.theme, 'Jadwal Tayang': dateFormatted, 'Caption': item.caption }
  ];
  const captionSheet = XLSX.utils.json_to_sheet(captionRows);
  captionSheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 80 }
  ];
  XLSX.utils.book_append_sheet(workbook, captionSheet, 'Caption');

  XLSX.writeFile(workbook, `Riwayat_Konten_${sanitizeFilename(item.theme)}.xlsx`);
};

// ==========================================
// 4. PODCAST / PODHUB SCRIPT EXPORTS (PDF & TXT)
// ==========================================

export const exportPodcastScriptToPDF = (episode: PodcastEpisode) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  addPDFHeader(
    doc,
    'NASKAH PRODUKSI PODHUB / PODCAST INSTANSI',
    `Topik: "${episode.topic}" | Durasi: ${episode.duration || '20 Menit'} | Pembicara: ${episode.speaker_count} Orang`
  );

  let currentY = 50;

  // Metadata Box
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Judul Episode: ${episode.title}`, 18, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Kategori: ${episode.category || 'Anak Muda Kantor'} | Gaya/Vibe: ${episode.vibe || 'PodHub Santai'}`, 18, currentY + 15);
  doc.text(`Jumlah Pembicara: ${episode.speaker_count} Orang yang hadir`, 18, currentY + 22);

  currentY += 34;

  // Speakers Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('DAFTAR PEMBICARA & PERSONA', 14, currentY);

  const speakerRows = episode.speakers.map((sp, idx) => [
    `#${idx + 1}`,
    sp.name,
    sp.role,
    sp.persona || '-'
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['No', 'Nama Pembicara', 'Peran / Role', 'Karakter & Persona']],
    body: speakerRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 35, fontStyle: 'bold' },
      2: { cellWidth: 40 },
      3: { cellWidth: 'auto' },
    },
  });

  currentY = ((doc as DocWithAutoTable).lastAutoTable?.finalY ?? currentY) + 10;

  // Segments & Dialogues
  episode.segments.forEach((segment) => {
    // Check if new page is needed for segment header
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(2, 132, 199); // Sky-600
    doc.text(`${segment.title} (${segment.duration || 'Durasi Fleksibel'})`, 14, currentY);

    if (segment.summary) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Sinopsis: ${segment.summary}`, 14, currentY + 5);
      currentY += 8;
    } else {
      currentY += 4;
    }

    const dialogueRows = segment.dialogue.map((d) => [
      `${d.speaker_name}\n(${d.speaker_role})`,
      d.cue || '-',
      d.line
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Pembicara', 'Petunjuk Intonasi / Cue', 'Naskah Dialog']],
      body: dialogueRows,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235], // Blue-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 38, fontStyle: 'italic', textColor: [100, 116, 139] },
        2: { cellWidth: 'auto' },
      },
    });

    currentY = ((doc as DocWithAutoTable).lastAutoTable?.finalY ?? currentY) + 8;
  });

  // Key Takeaways & Caption (if on new page or fits)
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  if (episode.key_takeaways && episode.key_takeaways.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('POIN KUNCI / TAKEAWAYS EPISODE:', 14, currentY);
    currentY += 6;

    episode.key_takeaways.forEach((point, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(`${idx + 1}. ${point}`, pageWidth - 28);
      doc.text(splitText, 14, currentY);
      currentY += (splitText.length * 4) + 2;
    });
    currentY += 4;
  }

  addPDFFooter(doc);
  doc.save(`Naskah_PodHub_${sanitizeFilename(episode.title)}.pdf`);
};

export const exportPodcastScriptToTXT = (episode: PodcastEpisode) => {
  let content = `==========================================================\n`;
  content += `NASKAH PODHUB / PODCAST INSTANSI BLSDM KOMDIGI\n`;
  content += `==========================================================\n\n`;
  content += `Judul Episode : ${episode.title}\n`;
  content += `Topik Utama   : ${episode.topic}\n`;
  content += `Kategori      : ${episode.category || 'Anak Muda Kantor'}\n`;
  content += `Gaya / Vibe   : ${episode.vibe || 'PodHub Santai & Relatable'}\n`;
  content += `Durasi        : ${episode.duration || '20 Menit'}\n`;
  content += `Total Speaker : ${episode.speaker_count} Orang\n\n`;

  content += `--- DAFTAR PEMBICARA ---\n`;
  episode.speakers.forEach((sp, idx) => {
    content += `${idx + 1}. [${sp.name}] - ${sp.role}\n   Karakter: ${sp.persona}\n\n`;
  });

  content += `==========================================================\n`;
  content += `RUNDOWN & DIALOG LENGKAP\n`;
  content += `==========================================================\n\n`;

  episode.segments.forEach((seg) => {
    content += `>>> ${seg.title} (${seg.duration || 'Durasi Fleksibel'})\n`;
    if (seg.summary) content += `Sinopsis Segmen: ${seg.summary}\n`;
    content += `----------------------------------------------------------\n`;
    seg.dialogue.forEach((line) => {
      content += `[${line.speaker_name.toUpperCase()} - ${line.speaker_role}] ${line.cue ? `${line.cue} ` : ''}\n`;
      content += `"${line.line}"\n\n`;
    });
    content += `\n`;
  });

  if (episode.key_takeaways && episode.key_takeaways.length > 0) {
    content += `==========================================================\n`;
    content += `POIN KUNCI / KEY TAKEAWAYS:\n`;
    episode.key_takeaways.forEach((point, i) => {
      content += `${i + 1}. ${point}\n`;
    });
    content += `\n`;
  }

  if (episode.social_caption) {
    content += `==========================================================\n`;
    content += `CAPTION PROMOSI MEDIA SOSIAL:\n`;
    content += `${episode.social_caption}\n`;
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Naskah_PodHub_${sanitizeFilename(episode.title)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

