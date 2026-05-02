
// ABOUTME: PDF generation service for clinical reports and documentation
// ABOUTME: Handles professional medical document formatting and export using jsPDF

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClinicalReport, ReferralLetter, SOAPNote, PDFExportOptions } from '@/types/reporting';
import { Patient, DifferentialDiagnosis } from '@/types/medical';

export class PDFGeneratorService {
  private static defaultOptions: PDFExportOptions = {
    includeHeader: true,
    includeFooter: true,
    includePageNumbers: true,
    orientation: 'portrait',
    format: 'a4',
    margins: { top: 20, right: 15, bottom: 20, left: 15 }
  };

  static async generateClinicalReportPDF(
    report: ClinicalReport,
    patient: Patient,
    differentials: DifferentialDiagnosis[],
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const config = { ...this.defaultOptions, ...options };
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.format
    });

    // Set up fonts and styling
    pdf.setFont('helvetica');
    
    let yPosition = config.margins.top;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - config.margins.left - config.margins.right;

    // Header
    if (config.includeHeader) {
      yPosition = this.addHeader(pdf, config.margins.left, yPosition);
    }

    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Clinical Assessment Report', config.margins.left, yPosition);
    yPosition += 10;

    // Patient Demographics
    yPosition = this.addPatientDemographics(pdf, patient, config.margins.left, yPosition);
    
    // Chief Complaint
    yPosition = this.addSection(pdf, 'Chief Complaint', report.content.chiefComplaint, config.margins.left, yPosition, contentWidth);
    
    // History of Present Illness
    if (report.content.historyPresentIllness.length > 0) {
      yPosition = this.addSection(pdf, 'History of Present Illness', report.content.historyPresentIllness.join(' '), config.margins.left, yPosition, contentWidth);
    }

    // Review of Systems
    if (Object.keys(report.content.reviewOfSystems).length > 0) {
      yPosition = this.addReviewOfSystems(pdf, report.content.reviewOfSystems, config.margins.left, yPosition);
    }

    // Past Medical History
    if (report.content.pastMedicalHistory) {
      yPosition = this.addPastMedicalHistory(pdf, report.content.pastMedicalHistory, config.margins.left, yPosition, contentWidth);
    }

    // Physical Examination
    if (report.content.physicalExamination) {
      yPosition = this.addPhysicalExamination(pdf, report.content.physicalExamination, config.margins.left, yPosition, contentWidth);
    }

    // Differential Diagnoses
    if (differentials.length > 0) {
      yPosition = this.addDifferentialDiagnoses(pdf, differentials, config.margins.left, yPosition, contentWidth);
    }

    // Clinical Plan & Investigations
    if (report.content.clinicalDecisionData) {
      yPosition = this.addClinicalPlan(pdf, report.content.clinicalDecisionData, config.margins.left, yPosition, contentWidth);
    }

    // Physician Signature
    yPosition = this.addSignatureBlock(pdf, config.margins.left, yPosition, config.physicianName);

    // Footer
    if (config.includeFooter) {
      this.addFooter(pdf, config);
    }

    return pdf.output('blob');
  }

  static async generateReferralLetterPDF(
    referral: ReferralLetter,
    patient: Patient,
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const config = { ...this.defaultOptions, ...options };
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.format
    });

    pdf.setFont('helvetica');
    let yPosition = config.margins.top;
    const contentWidth = pdf.internal.pageSize.getWidth() - config.margins.left - config.margins.right;

    // Letterhead
    yPosition = this.addLetterhead(pdf, config.margins.left, yPosition);

    // Date
    pdf.setFontSize(12);
    pdf.text(new Date().toLocaleDateString(), config.margins.left, yPosition);
    yPosition += 15;

    // Recipient
    if (referral.recipientName) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Dr. ${referral.recipientName}`, config.margins.left, yPosition);
      yPosition += 6;
    }
    if (referral.recipientFacility) {
      pdf.setFont('helvetica', 'normal');
      pdf.text(referral.recipientFacility, config.margins.left, yPosition);
      yPosition += 10;
    }

    // Subject line
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Re: ${patient.name} (${patient.patientId}) - ${referral.specialty} Referral`, config.margins.left, yPosition);
    yPosition += 10;

    // Salutation
    pdf.setFont('helvetica', 'normal');
    pdf.text('Dear Colleague,', config.margins.left, yPosition);
    yPosition += 10;

    // Clinical question
    yPosition = this.addSection(pdf, 'Clinical Question', referral.clinicalQuestion, config.margins.left, yPosition, contentWidth);

    // Patient demographics
    yPosition = this.addPatientDemographics(pdf, patient, config.margins.left, yPosition);

    // Relevant history
    if (referral.relevantHistory) {
      yPosition = this.addSection(pdf, 'Relevant History', referral.relevantHistory, config.margins.left, yPosition, contentWidth);
    }

    // Examination findings
    if (referral.examinationFindings) {
      yPosition = this.addSection(pdf, 'Examination Findings', referral.examinationFindings, config.margins.left, yPosition, contentWidth);
    }

    // Investigations completed
    if (referral.investigationsCompleted) {
      yPosition = this.addSection(pdf, 'Investigations Completed', referral.investigationsCompleted, config.margins.left, yPosition, contentWidth);
    }

    // Closing
    yPosition += 5;
    pdf.text('Thank you for your expertise in managing this patient.', config.margins.left, yPosition);
    yPosition += 10;
    pdf.text('Yours sincerely,', config.margins.left, yPosition);
    yPosition += 15;
    pdf.text(config.physicianName || 'Dr. [Your Name]', config.margins.left, yPosition);

    if (config.includeFooter) {
      this.addFooter(pdf, config);
    }

    return pdf.output('blob');
  }

  static async generateSOAPNotePDF(
    soapNote: SOAPNote,
    patient: Patient,
    options: Partial<PDFExportOptions> = {}
  ): Promise<Blob> {
    const config = { ...this.defaultOptions, ...options };
    const pdf = new jsPDF({
      orientation: config.orientation,
      unit: 'mm',
      format: config.format
    });

    pdf.setFont('helvetica');
    let yPosition = config.margins.top;
    const contentWidth = pdf.internal.pageSize.getWidth() - config.margins.left - config.margins.right;

    if (config.includeHeader) {
      yPosition = this.addHeader(pdf, config.margins.left, yPosition);
    }

    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SOAP Note', config.margins.left, yPosition);
    yPosition += 10;

    // Patient info
    yPosition = this.addPatientDemographics(pdf, patient, config.margins.left, yPosition);

    // SOAP sections
    yPosition = this.addSection(pdf, 'Subjective', soapNote.subjective, config.margins.left, yPosition, contentWidth);
    yPosition = this.addSection(pdf, 'Objective', soapNote.objective, config.margins.left, yPosition, contentWidth);
    yPosition = this.addSection(pdf, 'Assessment', soapNote.assessment, config.margins.left, yPosition, contentWidth);
    yPosition = this.addSection(pdf, 'Plan', soapNote.plan, config.margins.left, yPosition, contentWidth);

    if (soapNote.additionalNotes) {
      yPosition = this.addSection(pdf, 'Additional Notes', soapNote.additionalNotes, config.margins.left, yPosition, contentWidth);
    }

    // Physician Signature
    yPosition = this.addSignatureBlock(pdf, config.margins.left, yPosition, config.physicianName);

    if (config.includeFooter) {
      this.addFooter(pdf, config);
    }

    return pdf.output('blob');
  }

  private static addHeader(pdf: jsPDF, x: number, y: number): number {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Medical Practice', x, y);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Clinical Documentation System', x, y + 6);
    return y + 20;
  }

  private static addLetterhead(pdf: jsPDF, x: number, y: number): number {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Medical Practice', x, y);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Address Line 1', x, y + 8);
    pdf.text('Address Line 2', x, y + 14);
    pdf.text('Phone: (000) 000-0000 | Email: practice@medical.com', x, y + 20);
    return y + 35;
  }

  private static checkPageBreak(pdf: jsPDF, currentY: number, requiredSpace: number = 20): number {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (currentY + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      return 20; // Default top margin
    }
    return currentY;
  }

  private static addPatientDemographics(pdf: jsPDF, patient: Patient, x: number, y: number): number {
    y = this.checkPageBreak(pdf, y, 40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient Information:', x, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${patient.name}`, x, y);
    y += 6;
    pdf.text(`Patient ID: ${patient.patientId}`, x, y);
    y += 6;
    pdf.text(`Age: ${patient.age} years`, x, y);
    y += 6;
    pdf.text(`Gender: ${patient.gender}`, x, y);
    if (patient.location) {
      y += 6;
      pdf.text(`Location: ${patient.location}`, x, y);
    }
    return y + 10;
  }

  private static addSection(pdf: jsPDF, title: string, content: string, x: number, y: number, width: number): number {
    y = this.checkPageBreak(pdf, y, 15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${title}:`, x, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(content, width);
    for (let i = 0; i < lines.length; i++) {
      y = this.checkPageBreak(pdf, y, 8);
      pdf.text(lines[i], x, y);
      y += 6;
    }
    return y + 5;
  }

  private static addReviewOfSystems(pdf: jsPDF, rosData: Record<string, any>, x: number, y: number): number {
    y = this.checkPageBreak(pdf, y, 15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Review of Systems:', x, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    Object.entries(rosData).forEach(([system, data]) => {
      if (data.positive && data.positive.length > 0) {
        y = this.checkPageBreak(pdf, y, 8);
        pdf.text(`${system}: ${data.positive.join(', ')}`, x, y);
        y += 6;
      }
    });
    return y + 5;
  }

  private static addPastMedicalHistory(pdf: jsPDF, pmhData: any, x: number, y: number, width: number): number {
    y = this.checkPageBreak(pdf, y, 15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Past Medical History:', x, y);
    y += 8;

    pdf.setFontSize(10);
    
    const printRow = (label: string, content: string, isRed: boolean = false) => {
      if (!content) return;
      y = this.checkPageBreak(pdf, y, 10);
      pdf.setFont('helvetica', 'bold');
      if (isRed) pdf.setTextColor(220, 38, 38);
      pdf.text(label, x, y);
      if (isRed) pdf.setTextColor(0, 0, 0);
      
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(content, width - 30);
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) y = this.checkPageBreak(pdf, y, 8);
        pdf.text(lines[i], x + 30, y);
        y += 6;
      }
    };

    if (pmhData.conditions?.length) printRow('Conditions:', pmhData.conditions.join(', '));
    if (pmhData.surgeries?.length) printRow('Surgeries:', pmhData.surgeries.join(', '));
    if (pmhData.medications?.length) printRow('Medications:', pmhData.medications.join(', '));
    if (pmhData.allergies?.length) printRow('Allergies:', pmhData.allergies.join(', '), true);
    if (pmhData.familyHistory) printRow('Family Hx:', pmhData.familyHistory);
    if (pmhData.socialHistory) printRow('Social Hx:', pmhData.socialHistory);

    return y + 5;
  }

  private static addPhysicalExamination(pdf: jsPDF, peData: any, x: number, y: number, width: number): number {
    y = this.checkPageBreak(pdf, y, 15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Physical Examination:', x, y);
    y += 8;

    pdf.setFontSize(10);
    
    if (peData.vitalSigns) {
      y = this.checkPageBreak(pdf, y, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Vitals:', x, y);
      pdf.setFont('helvetica', 'normal');
      const vs = peData.vitalSigns;
      const vitalsStr = `BP: ${vs.bloodPressure || '-'}, HR: ${vs.heartRate || '-'}, RR: ${vs.respiratoryRate || '-'}, Temp: ${vs.temperature || '-'}, SpO2: ${vs.oxygenSaturation || '-'}`;
      pdf.text(vitalsStr, x + 20, y);
      y += 6;
    }

    if (peData.generalAppearance) {
      y = this.checkPageBreak(pdf, y, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('General:', x, y);
      pdf.setFont('helvetica', 'normal');
      const genLines = pdf.splitTextToSize(peData.generalAppearance, width - 20);
      for (let i = 0; i < genLines.length; i++) {
        if (i > 0) y = this.checkPageBreak(pdf, y, 8);
        pdf.text(genLines[i], x + 20, y);
        y += 6;
      }
    }

    if (peData.systems) {
      Object.entries(peData.systems).forEach(([sys, data]: [string, any]) => {
        y = this.checkPageBreak(pdf, y, 10);
        pdf.setFont('helvetica', 'bold');
        const sysName = sys.charAt(0).toUpperCase() + sys.slice(1) + ':';
        pdf.text(sysName, x, y);
        
        pdf.setFont('helvetica', 'normal');
        let findings = data.normal ? 'Normal' : (data.findings?.join(', ') || '');
        if (data.notes) findings += ` - ${data.notes}`;
        
        const lines = pdf.splitTextToSize(findings, width - 30);
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) y = this.checkPageBreak(pdf, y, 8);
          pdf.text(lines[i], x + 30, y);
          y += 6;
        }
      });
    }

    return y + 5;
  }

  private static addDifferentialDiagnoses(pdf: jsPDF, differentials: DifferentialDiagnosis[], x: number, y: number, width: number): number {
    y = this.checkPageBreak(pdf, y, 15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Differential Diagnoses:', x, y);
    y += 8;
    
    pdf.setFont('helvetica', 'normal');
    differentials.forEach((diff, index) => {
      y = this.checkPageBreak(pdf, y, 10);
      pdf.text(`${index + 1}. ${diff.condition} (${diff.probability}%)`, x, y);
      y += 6;
      if (diff.explanation) {
        const lines = pdf.splitTextToSize(`   ${diff.explanation}`, width - 10);
        for (let i = 0; i < lines.length; i++) {
          y = this.checkPageBreak(pdf, y, 8);
          pdf.text(lines[i], x + 5, y);
          y += 6;
        }
      }
      y += 3;
    });
    return y + 5;
  }

  private static addClinicalPlan(pdf: jsPDF, cdsData: any, x: number, y: number, width: number): number {
    y = this.checkPageBreak(pdf, y, 15);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Clinical Plan & Investigations:', x, y);
    y += 8;

    pdf.setFontSize(10);
    
    const printSection = (label: string, items: string[]) => {
      if (!items || items.length === 0) return;
      y = this.checkPageBreak(pdf, y, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, x, y);
      y += 6;
      
      pdf.setFont('helvetica', 'normal');
      items.forEach(item => {
        const lines = pdf.splitTextToSize(`• ${item}`, width - 10);
        for (let i = 0; i < lines.length; i++) {
          y = this.checkPageBreak(pdf, y, 8);
          pdf.text(lines[i], x + 5, y);
          y += 6;
        }
      });
      y += 2;
    };

    if (cdsData.investigation_plan?.selected?.length) printSection('Investigations Ordered:', cdsData.investigation_plan.selected);
    
    if (cdsData.investigation_plan?.results?.length) {
      const results = cdsData.investigation_plan.results.map((r: any) => `${r.name}: ${r.value}`);
      printSection('Lab/Investigation Results:', results);
    }

    if (cdsData.treatment_plan?.medications?.length) printSection('Prescribed Medications:', cdsData.treatment_plan.medications);
    if (cdsData.treatment_plan?.nonPharmacological?.length) printSection('Non-Pharmacological Treatment:', cdsData.treatment_plan.nonPharmacological);

    if (cdsData.treatment_plan?.followUp) {
      y = this.checkPageBreak(pdf, y, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Follow-up Plan:', x, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(cdsData.treatment_plan.followUp, width - 10);
      for (let i = 0; i < lines.length; i++) {
        y = this.checkPageBreak(pdf, y, 8);
        pdf.text(lines[i], x + 5, y);
        y += 6;
      }
      y += 4;
    }

    if (cdsData.clinical_notes) {
      y = this.checkPageBreak(pdf, y, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clinical Notes:', x, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(cdsData.clinical_notes, width - 10);
      for (let i = 0; i < lines.length; i++) {
        y = this.checkPageBreak(pdf, y, 8);
        pdf.text(lines[i], x + 5, y);
        y += 6;
      }
      y += 4;
    }

    return y + 5;
  }

  private static addSignatureBlock(pdf: jsPDF, x: number, y: number, physicianName?: string): number {
    y = this.checkPageBreak(pdf, y, 30);
    y += 20; // Add some spacing before the signature line
    
    // Draw Signature Line
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.line(x, y, x + 70, y);
    
    // Draw Date Line
    pdf.line(x + 100, y, x + 150, y);
    
    y += 5;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Physician Signature', x, y);
    pdf.text('Date', x + 100, y);
    
    if (physicianName) {
      y += 5;
      pdf.setFont('helvetica', 'italic');
      pdf.text(physicianName, x, y);
    }

    return y + 10;
  }

  private static addFooter(pdf: jsPDF, config: PDFExportOptions): void {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const y = pageHeight - config.margins.bottom;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${new Date().toLocaleString()}`, config.margins.left, y);
    
    if (config.includePageNumbers) {
      const pageWidth = pdf.internal.pageSize.getWidth();
      pdf.text('Page 1', pageWidth - config.margins.right - 15, y);
    }
  }

  static async exportToPDF(htmlElement: HTMLElement, filename: string): Promise<void> {
    const canvas = await html2canvas(htmlElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  }
}
