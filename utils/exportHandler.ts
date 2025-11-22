import jsPDF from 'jspdf';
import 'jspdf/dist/polyfills.es.js'; // Required for AcroForm checkboxes
import autoTable from 'jspdf-autotable';
import { AppState, LiftType, LiftState, OneRepMaxExportData } from '../types';
import { getPlateBreakdown, getLbsPlateBreakdown } from './calculator';
import { findTopRecord } from './recordsLookup';

export const exportToCSV = (state: AppState) => {
    const { details, equipment, lifts, personalBests } = state;
    const fields = [
        'eventName','lifterName','weightClass','bodyWeight','gender','competitionDate','weighInTime',
        'squatRackHeight','squatStands','benchRackHeight','handOut','benchSafetyHeight',
        'squat1','squat2','squat3','bench1','bench2','bench3','deadlift1','deadlift2','deadlift3',
        'squatPBWeight','squatPBDate','benchPBWeight','benchPBDate','deadliftPBWeight','deadliftPBDate'
    ];

    const liftWarmupFields: string[] = [];
    ['squat', 'bench', 'deadlift'].forEach(lift => {
        for(let i=0; i<8; i++){
            liftWarmupFields.push(`${lift}Warmup${i+1}Weight`, `${lift}Warmup${i+1}Reps`);
        }
    });

    const allFields = fields.concat(liftWarmupFields);
    
    const header = allFields.join(',');

    const data: Record<string, string> = {
        ...details,
        ...equipment,
        squat1: lifts.squat.attempts['1'],
        squat2: lifts.squat.attempts['2'],
        squat3: lifts.squat.attempts['3'],
        bench1: lifts.bench.attempts['1'],
        bench2: lifts.bench.attempts['2'],
        bench3: lifts.bench.attempts['3'],
        deadlift1: lifts.deadlift.attempts['1'],
        deadlift2: lifts.deadlift.attempts['2'],
        deadlift3: lifts.deadlift.attempts['3'],
        squatPBWeight: personalBests?.squat?.weight || '',
        squatPBDate: personalBests?.squat?.date || '',
        benchPBWeight: personalBests?.bench?.weight || '',
        benchPBDate: personalBests?.bench?.date || '',
        deadliftPBWeight: personalBests?.deadlift?.weight || '',
        deadliftPBDate: personalBests?.deadlift?.date || '',
    };

    lifts.squat.warmups.forEach((s, i) => { data[`squatWarmup${i+1}Weight`] = s.weight; data[`squatWarmup${i+1}Reps`] = s.reps; });
    lifts.bench.warmups.forEach((s, i) => { data[`benchWarmup${i+1}Weight`] = s.weight; data[`benchWarmup${i+1}Reps`] = s.reps; });
    lifts.deadlift.warmups.forEach((s, i) => { data[`deadliftWarmup${i+1}Weight`] = s.weight; data[`deadliftWarmup${i+1}Reps`] = s.reps; });

    const row = allFields.map(field => {
        const value = data[field] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');

    const blob = new Blob([header + '\n' + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `${details.lifterName || 'Lifter'}_Competition_Plan.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Helper function to calculate days between dates
const calculateDaysBeforeComp = (pbDate: string, compDate: string): number | null => {
    if (!pbDate || !compDate) return null;
    try {
        const pb = new Date(pbDate);
        const comp = new Date(compDate);
        const diffTime = comp.getTime() - pb.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    } catch {
        return null;
    }
};

// Helper function to format PB date display
const formatPBDate = (pbDate: string, compDate: string): string => {
    if (!pbDate) return '';
    const daysBefore = calculateDaysBeforeComp(pbDate, compDate);
    if (daysBefore !== null && daysBefore >= 0) {
        return `${daysBefore} days before comp`;
    }
    // Format date as DD/MM/YYYY
    try {
        const date = new Date(pbDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return pbDate;
    }
};

export const exportToPDF = (state: AppState): Blob => {
    const { details, equipment, lifts, branding, personalBests } = state;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const { unit } = details;

    const primaryColor = branding.primaryColor || '#111827';
    const secondaryColor = branding.secondaryColor || '#1e293b';
    
    const pageWidth = 210;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // --- MAIN HEADER ---
    doc.setFillColor(primaryColor);
    doc.rect(margin, yPos, contentWidth, 16, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    
    if (branding.logo) {
        const imgType = branding.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(branding.logo, imgType, margin + 2, yPos + 2, 12, 12);
        doc.text('POWERLIFTING MEET PLAN', margin + 18, yPos + 10, { align: 'left' });
    } else {
        doc.text('POWERLIFTING MEET PLAN', pageWidth / 2, yPos + 10, { align: 'center' });
    }

    yPos += 16 + 6;

    // --- DETAILS & EQUIPMENT SECTION ---
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text('Competition & Equipment Details', margin, yPos);
    yPos += 5;
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 2;

    doc.setFontSize(10);
    doc.setTextColor(48, 48, 48);
    const detailCol1 = margin;
    const detailCol2 = margin + 95;
    const rowHeight = 7;
    const detailValueOffsetCol1 = 35;
    const detailValueOffsetCol2 = 45; // Increased offset for the second column

    const competitionDetails = [
        { label: 'Event Name', value: details.eventName },
        { label: 'Lifter Name', value: details.lifterName },
        { label: 'Weight Class', value: details.weightClass },
        { label: 'Competition Date', value: details.competitionDate },
        { label: 'Weigh-in Time', value: details.weighInTime },
    ];

    const equipmentDetails = [
        { label: 'Squat Rack Height', value: equipment.squatRackHeight },
        { label: 'Squat Stands', value: equipment.squatStands },
        { label: 'Bench Rack Height', value: equipment.benchRackHeight },
        { label: 'Bench Safety Height', value: equipment.benchSafetyHeight },
        { label: 'Hand Out', value: equipment.handOut },
    ];

    const maxRows = Math.max(competitionDetails.length, equipmentDetails.length);
    let currentY = yPos + 5;

    for (let i = 0; i < maxRows; i++) {
        // Zebra stripe
        if (i % 2 === 1) {
            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(margin, currentY - 4.5, contentWidth, rowHeight, 'F');
        }

        // Column 1
        if (competitionDetails[i]) {
            const { label, value } = competitionDetails[i];
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, detailCol1 + 2, currentY, { align: 'left' });
            doc.setFont('helvetica', 'normal');
            doc.text(value || '', detailCol1 + detailValueOffsetCol1, currentY, { align: 'left' });
        }

        // Column 2
        if (equipmentDetails[i]) {
            const { label, value } = equipmentDetails[i];
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, detailCol2 + 2, currentY, { align: 'left' });
            doc.setFont('helvetica', 'normal');
            doc.text(value || '', detailCol2 + detailValueOffsetCol2, currentY, { align: 'left' });
        }
        
        currentY += rowHeight;
    }

    yPos = currentY; // Set Y to be after the details section

    // --- RECORDS COMPARISON SECTION ---
    const hasRecordsData = details.recordsRegion && details.weightClass && details.recordsAgeCategory && details.recordsEquipment;

    if (hasRecordsData) {
        const genderForRecords: 'M' | 'F' | undefined = details.gender === 'male' ? 'M' : details.gender === 'female' ? 'F' : undefined;

        if (genderForRecords) {
            const recordParams = {
                gender: genderForRecords as 'M' | 'F',
                weightClass: details.weightClass,
                ageCategory: details.recordsAgeCategory!,
                equipment: details.recordsEquipment!,
                region: details.recordsRegion!,
            };

            const squatRecord = findTopRecord({ ...recordParams, lift: 'squat' });
            const benchRecord = findTopRecord({ ...recordParams, lift: 'bench_press' });
            const deadliftRecord = findTopRecord({ ...recordParams, lift: 'deadlift' });
            const totalRecord = findTopRecord({ ...recordParams, lift: 'total' });

            const hasAnyRecord = squatRecord || benchRecord || deadliftRecord || totalRecord;

            if (hasAnyRecord) {
                yPos += 4;
                doc.setFontSize(14);
                doc.setTextColor(17, 24, 39);
                doc.text(`${details.recordsRegion} Records - ${details.recordsAgeCategory} ${details.recordsEquipment}`, margin, yPos);
                yPos += 5;
                doc.setDrawColor(203, 213, 225);
                doc.line(margin, yPos, margin + contentWidth, yPos);
                yPos += 6;

                doc.setFontSize(9);
                doc.setTextColor(48, 48, 48);
                const recRowHeight = 6;
                let recY = yPos;
                const recCol1 = margin + 2;
                const recCol2 = margin + 35;
                const recCol3 = margin + 70;

                const recordsData = [
                    { lift: 'Squat', record: squatRecord },
                    { lift: 'Bench', record: benchRecord },
                    { lift: 'Deadlift', record: deadliftRecord },
                    { lift: 'Total', record: totalRecord },
                ];

                recordsData.forEach((rec, index) => {
                    if (rec.record) {
                        if (index % 2 === 1) {
                            doc.setFillColor(248, 250, 252);
                            doc.rect(margin, recY - 4, contentWidth, recRowHeight, 'F');
                        }

                        doc.setFont('helvetica', 'bold');
                        doc.text(`${rec.lift}:`, recCol1, recY);
                        doc.setFont('helvetica', 'normal');
                        doc.text(`${rec.record.record} kg`, recCol2, recY);
                        doc.setFont('helvetica', 'italic');
                        doc.setFontSize(8);
                        doc.text(rec.record.name, recCol3, recY);
                        doc.setFontSize(9);

                        recY += recRowHeight;
                    }
                });

                yPos = recY + 2;
            }
        }
    }

    // --- PERSONAL BESTS SECTION ---
    const hasPBData = personalBests && (
        (personalBests.squat?.weight && personalBests.squat?.date) ||
        (personalBests.bench?.weight && personalBests.bench?.date) ||
        (personalBests.deadlift?.weight && personalBests.deadlift?.date)
    );

    if (hasPBData) {
        yPos += 4;
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39);
        doc.text('Personal Bests', margin, yPos);
        yPos += 5;
        doc.setDrawColor(203, 213, 225);
        doc.line(margin, yPos, margin + contentWidth, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setTextColor(48, 48, 48);
        const pbRowHeight = 7;
        let pbY = yPos;
        const pbCol1 = margin + 2;
        const pbCol2 = margin + 40;
        const pbCol3 = margin + 110;

        const pbData = [
            { lift: 'Squat', weight: personalBests.squat?.weight, date: personalBests.squat?.date },
            { lift: 'Bench', weight: personalBests.bench?.weight, date: personalBests.bench?.date },
            { lift: 'Deadlift', weight: personalBests.deadlift?.weight, date: personalBests.deadlift?.date },
        ];

        pbData.forEach((pb, index) => {
            if (pb.weight && pb.date) {
                if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(margin, pbY - 4.5, contentWidth, pbRowHeight, 'F');
                }

                doc.setFont('helvetica', 'bold');
                doc.text(`${pb.lift}:`, pbCol1, pbY);
                doc.setFont('helvetica', 'normal');
                doc.text(`${pb.weight} ${unit}`, pbCol2, pbY);
                doc.text(formatPBDate(pb.date, details.competitionDate), pbCol3, pbY);

                pbY += pbRowHeight;
            }
        });

        yPos = pbY + 2;
    }

    // --- LIFT SECTION DRAWING FUNCTION ---
    const drawLiftSection = (liftName: string, liftType: LiftType) => {
        const liftData = lifts[liftType];
        
        // Lift Header
        doc.setFillColor(secondaryColor);
        doc.rect(margin, yPos, contentWidth, 9, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(liftName.toUpperCase(), margin + 5, yPos + 6.5);
        yPos += 9 + 4;

        // Attempts & Warmups side-by-side
        const attemptsWidth = 60;
        const warmupsWidth = contentWidth - attemptsWidth - 5;
        const attemptsX = margin;
        const warmupsX = margin + attemptsWidth + 5;
        let attemptsY = yPos;
        let warmupsY = yPos;
        const cbSize = 4; // Checkbox size

        // Draw Attempts Box
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text('Attempts (kg)', attemptsX, attemptsY);
        attemptsY += 5;

        const attempts: Array<{key: '1' | '2' | '3', label: string}> = [
            { key: '1', label: 'Opener' }, { key: '2', label: 'Second' }, { key: '3', label: 'Third' },
        ];
        
        attempts.forEach((attempt, index) => {
            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 252); // slate-50
                doc.rect(attemptsX, attemptsY - 4, attemptsWidth, 6, 'F');
            }
            
            // Add checkbox
            const attemptCb = new (doc as any).AcroForm.CheckBox();
            attemptCb.fieldName = `${liftType}-attempt-${index}`;
            attemptCb.Rect = [attemptsX, attemptsY - 3.5, cbSize, cbSize];
            attemptCb.V = '/Off'; // Set Value to Off
            attemptCb.AS = '/Off'; // Set Appearance State to Off
            doc.addField(attemptCb);

            doc.setFontSize(11);
            doc.setTextColor(48, 48, 48);
            doc.setFont('helvetica', 'normal');
            doc.text(`${attempt.label}:`, attemptsX + cbSize + 2, attemptsY);
            doc.setFont('helvetica', 'bold');
            doc.text(`${liftData.attempts[attempt.key] || '___'} kg`, attemptsX + attemptsWidth - 2, attemptsY, { align: 'right' });
            attemptsY += 6;
        });

        // Draw Warmups Box
        const populatedWarmups = liftData.warmups.filter(w => w.weight && w.reps);
        if (populatedWarmups.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Warm-ups', warmupsX, warmupsY);
            if (unit === 'kg' && liftData.includeCollars) {
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text('(w/ 5kg collars)', warmupsX + 22, warmupsY);
            }
            warmupsY += 5;

            // Header
            doc.setFillColor(241, 245, 249); // slate-100
            doc.rect(warmupsX, warmupsY - 3, warmupsWidth, 5, 'F');
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFont('helvetica', 'bold');
            const weightColX = warmupsX + cbSize + 4;
            const repsColX = weightColX + 18;
            const loadingColX = repsColX + 15;
            doc.text(`Weight (${unit})`, weightColX, warmupsY);
            doc.text('Reps', repsColX, warmupsY);
            doc.text('Plate Loading (per side)', loadingColX, warmupsY);
            warmupsY += 5;

            // Rows
            populatedWarmups.forEach((set, index) => {
                const weight = parseFloat(set.weight);
                const plateBreakdown = unit === 'lbs'
                    ? !isNaN(weight) ? getLbsPlateBreakdown(weight) : ''
                    : !isNaN(weight) ? getPlateBreakdown(weight, liftData.includeCollars) : '';
                
                if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252); // slate-50
                    doc.rect(warmupsX, warmupsY - 4, warmupsWidth, 6, 'F');
                }
                
                // Add checkbox
                const warmupCb = new (doc as any).AcroForm.CheckBox();
                warmupCb.fieldName = `${liftType}-warmup-${index}`;
                warmupCb.Rect = [warmupsX, warmupsY - 3.5, cbSize, cbSize];
                warmupCb.V = '/Off'; // Set Value to Off
                warmupCb.AS = '/Off'; // Set Appearance State to Off
                doc.addField(warmupCb);

                doc.setFontSize(10);
                doc.setTextColor(48, 48, 48);
                doc.setFont('helvetica', 'normal');
                doc.text(`${set.weight} ${unit}`, weightColX, warmupsY);
                doc.text(`x ${set.reps}`, repsColX, warmupsY);
                
                const plateFontSize = plateBreakdown.length > 20 ? 8 : 9;
                doc.setFontSize(plateFontSize);
                doc.text(plateBreakdown, loadingColX, warmupsY);
                
                warmupsY += 6;
            });
        }
        
        const populatedCues = liftData.cues.filter(c => c.trim() !== '');
        if (populatedCues.length > 0) {
            warmupsY += 4; // Add a little space
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Technical Cues:', warmupsX, warmupsY);
            warmupsY += 5;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(48, 48, 48);
            populatedCues.forEach(cue => {
                doc.text(`• ${cue}`, warmupsX + 2, warmupsY);
                warmupsY += 5;
            });
        }

        if (liftData.coachingNote) {
            warmupsY += 4; // Add a little space
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(180, 83, 9); // amber-700
            doc.text('Coaching Note:', warmupsX, warmupsY);
            warmupsY += 5;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(48, 48, 48);
            const noteLines = doc.splitTextToSize(liftData.coachingNote, warmupsWidth - 6);
            
            const boxHeight = (noteLines.length * 4) + 4;
            doc.setFillColor(254, 252, 232); // amber-50
            doc.rect(warmupsX - 2, warmupsY - 4, warmupsWidth + 4, boxHeight, 'F');
            
            doc.text(noteLines, warmupsX, warmupsY);
            warmupsY += boxHeight;
        }

        yPos = Math.max(attemptsY, warmupsY) + 6; // Set Y to be after the longest column
    };
    
    drawLiftSection('Squat', 'squat');
    drawLiftSection('Bench Press', 'bench');
    drawLiftSection('Deadlift', 'deadlift');

    return doc.output('blob');
};


export const exportToMobilePDF = (state: AppState): Blob => {
    const { details, equipment, lifts, branding, personalBests } = state;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const { unit } = details;
    
    const primaryColor = branding.primaryColor || '#111827';
    const secondaryColor = branding.secondaryColor || '#1e293b';

    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // --- PAGE 1: DETAILS & EQUIPMENT ---
    let yPos = margin;

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(margin, yPos, contentWidth, 20, 'F');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    if (branding.logo) {
        const imgType = branding.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(branding.logo, imgType, margin + 4, yPos + 2.5, 15, 15);
        doc.text('MEET PLAN', margin + 25, yPos + 13, { align: 'left' });
    } else {
        doc.text('MEET PLAN', pageWidth / 2, yPos + 13, { align: 'center' });
    }
    yPos += 20 + 12;

    // Details Section
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text('Competition Details', pageWidth / 2, yPos, { align: 'center'});
    yPos += 12;

    const competitionDetails = [
        { label: 'Event Name', value: details.eventName },
        { label: 'Lifter Name', value: details.lifterName },
        { label: 'Weight Class', value: details.weightClass },
        { label: 'Competition Date', value: details.competitionDate },
        { label: 'Weigh-in Time', value: details.weighInTime },
    ];

    const equipmentDetails = [
        { label: 'Squat Rack Height', value: equipment.squatRackHeight },
        { label: 'Squat Stands', value: equipment.squatStands },
        { label: 'Bench Rack Height', value: equipment.benchRackHeight },
        { label: 'Bench Safety Height', value: equipment.benchSafetyHeight },
        { label: 'Hand Out', value: equipment.handOut },
    ];
    
    const rowHeight = 18;
    const valueOffset = 70;
    
    doc.setFontSize(16);

    // Competition Details
    competitionDetails.forEach((detail, index) => {
        if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 12.5, contentWidth, rowHeight, 'F');
        }
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}:`, margin + 2, yPos);
        
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value || '', margin + valueOffset, yPos);
        yPos += rowHeight;
    });

    // Separator
    yPos += 8;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(margin + 5, yPos, margin + contentWidth - 5, yPos);
    yPos += 8;
    
    doc.setFontSize(22);
    doc.setTextColor(17, 24, 39);
    doc.text('Equipment Settings', pageWidth / 2, yPos, { align: 'center'});
    yPos += 12;
    
    // Equipment Details
    doc.setFontSize(16);
    equipmentDetails.forEach((detail, index) => {
        if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, yPos - 12.5, contentWidth, rowHeight, 'F');
        }
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}:`, margin + 2, yPos);
        
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value || '', margin + valueOffset, yPos);
        yPos += rowHeight;
    });

    // --- LIFT PAGES ---
    const drawMobileLiftPage = (liftName: string, liftType: LiftType, liftData: LiftState) => {
        doc.addPage();
        let pageY = margin;
        
        // Lift Header
        doc.setFillColor(secondaryColor);
        doc.rect(margin, pageY, contentWidth, 16, 'F');
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(liftName.toUpperCase(), pageWidth / 2, pageY + 11, { align: 'center' });
        pageY += 16 + 12;

        const cbSize = 8;

        // Personal Best Section (if available)
        const pb = personalBests?.[liftType];
        if (pb?.weight && pb?.date) {
            doc.setFillColor(249, 250, 251); // slate-50
            doc.rect(margin, pageY - 6, contentWidth, 18, 'F');

            doc.setFontSize(14);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFont('helvetica', 'bold');
            doc.text('Personal Best:', margin + 2, pageY + 3);

            doc.setTextColor(17, 24, 39);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text(`${pb.weight} ${unit}`, margin + 50, pageY + 3);

            const dateText = formatPBDate(pb.date, details.competitionDate);
            doc.setTextColor(71, 85, 105); // slate-600
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(13);
            doc.text(dateText, margin + 50, pageY + 10);

            pageY += 18 + 8;
        }

        // Record Section (if available)
        if (details.recordsRegion && details.weightClass && details.recordsAgeCategory && details.recordsEquipment) {
            const genderForRecords: 'M' | 'F' | undefined = details.gender === 'male' ? 'M' : details.gender === 'female' ? 'F' : undefined;

            if (genderForRecords) {
                const recordParams = {
                    gender: genderForRecords as 'M' | 'F',
                    weightClass: details.weightClass,
                    ageCategory: details.recordsAgeCategory!,
                    equipment: details.recordsEquipment!,
                    region: details.recordsRegion!,
                };

                const liftRecordMap: Record<LiftType, 'squat' | 'bench_press' | 'deadlift'> = {
                    squat: 'squat',
                    bench: 'bench_press',
                    deadlift: 'deadlift',
                };

                const liftRecord = findTopRecord({ ...recordParams, lift: liftRecordMap[liftType] });

                if (liftRecord) {
                    doc.setFillColor(239, 246, 255); // blue-50
                    doc.rect(margin, pageY - 6, contentWidth, 18, 'F');

                    doc.setFontSize(14);
                    doc.setTextColor(59, 130, 246); // blue-500
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${details.recordsRegion} Record:`, margin + 2, pageY + 3);

                    doc.setTextColor(17, 24, 39);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(16);
                    doc.text(`${liftRecord.record} kg`, margin + 50, pageY + 3);

                    doc.setTextColor(71, 85, 105); // slate-600
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(13);
                    doc.text(liftRecord.name, margin + 50, pageY + 10);

                    pageY += 18 + 8;
                }
            }
        }

        // Attempts Section
        doc.setFontSize(18);
        doc.setTextColor(17, 24, 39);
        doc.text('Attempts (kg)', margin, pageY);
        pageY += 10;

        const attempts: Array<{key: '1' | '2' | '3', label: string}> = [
            { key: '1', label: 'Opener' }, { key: '2', label: 'Second' }, { key: '3', label: 'Third' },
        ];
        
        const attemptRowHeight = 16;
        attempts.forEach((attempt, index) => {
            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, pageY - 10, contentWidth, attemptRowHeight, 'F');
            }
            
            const cbY = pageY - 6;
            doc.setDrawColor(30, 41, 59);
            doc.setLineWidth(0.8);
            doc.rect(margin, cbY, cbSize, cbSize, 'S');

            const attemptCb = new (doc as any).AcroForm.CheckBox();
            attemptCb.fieldName = `mobile-${liftType}-attempt-${index}`;
            attemptCb.Rect = [margin, cbY, cbSize, cbSize];
            attemptCb.V = '/Off'; attemptCb.AS = '/Off';
            doc.addField(attemptCb);

            doc.setFontSize(16);
            doc.setTextColor(48, 48, 48);
            doc.setFont('helvetica', 'normal');
            doc.text(`${attempt.label}:`, margin + cbSize + 4, pageY);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text(`${liftData.attempts[attempt.key] || '___'} kg`, margin + contentWidth, pageY, { align: 'right' });
            pageY += attemptRowHeight;
        });

        pageY += 15; // Space between sections

        // Warmups Section
        const populatedWarmups = liftData.warmups.filter(w => w.weight && w.reps);
        if (populatedWarmups.length > 0) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Warm-ups', margin, pageY);
            if (unit === 'kg' && liftData.includeCollars) {
                doc.setFontSize(11);
                doc.setTextColor(100, 116, 139);
                doc.text('(with 5kg collars)', margin + 35, pageY);
            }
            pageY += 10;

            // Header
            const warmupHeaderHeight = 8;
            doc.setFillColor(241, 245, 249);
            doc.rect(margin, pageY - 6, contentWidth, warmupHeaderHeight, 'F');
            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            const weightColX = margin + cbSize + 5;
            const repsColX = weightColX + 30;
            const loadingColX = repsColX + 25;
            doc.text(`Weight (${unit})`, weightColX, pageY);
            doc.text('Reps', repsColX, pageY);
            doc.text('Plate Loading (per side)', loadingColX, pageY);
            pageY += warmupHeaderHeight + 2;

            // Rows
            const warmupRowHeight = 16;
            populatedWarmups.forEach((set, index) => {
                const weight = parseFloat(set.weight);
                const plateBreakdown = unit === 'lbs'
                    ? !isNaN(weight) ? getLbsPlateBreakdown(weight) : ''
                    : !isNaN(weight) ? getPlateBreakdown(weight, liftData.includeCollars) : '';
                
                if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(margin, pageY - 10.5, contentWidth, warmupRowHeight, 'F');
                }
                
                const cbY = pageY - 7;
                doc.setDrawColor(30, 41, 59);
                doc.setLineWidth(0.8);
                doc.rect(margin, cbY, cbSize, cbSize, 'S');

                const warmupCb = new (doc as any).AcroForm.CheckBox();
                warmupCb.fieldName = `mobile-${liftType}-warmup-${index}`;
                warmupCb.Rect = [margin, cbY, cbSize, cbSize];
                warmupCb.V = '/Off'; warmupCb.AS = '/Off';
                doc.addField(warmupCb);

                doc.setFontSize(19);
                doc.setTextColor(48, 48, 48);

                doc.setFont('helvetica', 'bold');
                doc.text(`${set.weight} ${unit}`, weightColX, pageY);
                
                doc.setFont('helvetica', 'normal');
                doc.text(`x ${set.reps}`, repsColX, pageY);
                
                doc.setFontSize(16);
                doc.text(plateBreakdown, loadingColX, pageY);
                
                pageY += warmupRowHeight;
            });
        }

        // Cues Section
        const populatedCues = liftData.cues.filter(c => c.trim() !== '');
        if (populatedCues.length > 0) {
            pageY += 15;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('Technical Cues', margin, pageY);
            pageY += 10;

            const cueRowHeight = 12;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(48, 48, 48);

            populatedCues.forEach((cue, index) => {
                 if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(margin, pageY - 9, contentWidth, cueRowHeight, 'F');
                }
                doc.text(`• ${cue}`, margin + 2, pageY);
                pageY += cueRowHeight;
            });
        }
        
        // Coaching Note Section
        const coachingNote = liftData.coachingNote;
        if (coachingNote) {
            pageY += 15;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(180, 83, 9); // amber-700
            doc.text('Coaching Note', margin, pageY);
            pageY += 10;
            
            const noteRowHeight = 12;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(48, 48, 48);

            const noteLines = doc.splitTextToSize(coachingNote, contentWidth - 4);
            
            const boxHeight = noteLines.length * (noteRowHeight - 4) + 8;
            doc.setFillColor(254, 252, 232); // amber-50
            doc.rect(margin, pageY - 9, contentWidth, boxHeight, 'F');
            
            noteLines.forEach((line: string) => {
                doc.text(line, margin + 2, pageY);
                pageY += (noteRowHeight - 4);
            });
            pageY += 4;
        }
    };
    
    drawMobileLiftPage('Squat', 'squat', lifts.squat);
    drawMobileLiftPage('Bench Press', 'bench', lifts.bench);
    drawMobileLiftPage('Deadlift', 'deadlift', lifts.deadlift);

    return doc.output('blob');
};

export const exportOneRepMaxToPDF = (data: OneRepMaxExportData): Blob => {
    const { isMobile, branding, lifterName, weight, reps, unit, results } = data;
    const doc = new jsPDF(isMobile ? 'portrait' : 'p', 'mm', 'a4');

    const primaryColor = branding.primaryColor || '#111827';
    const pageWidth = 210;
    const margin = isMobile ? 15 : 10;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // --- HEADER ---
    doc.setFillColor(primaryColor);
    doc.rect(margin, yPos, contentWidth, isMobile ? 20 : 16, 'F');
    doc.setFontSize(isMobile ? 22 : 20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    
    if (branding.logo) {
        const imgType = branding.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(branding.logo, imgType, margin + (isMobile ? 4 : 2), yPos + (isMobile ? 4 : 2), isMobile ? 12 : 12, isMobile ? 12 : 12);
        doc.text('1RM RESULTS', margin + (isMobile ? 20 : 18), yPos + (isMobile ? 13 : 10), { align: 'left' });
    } else {
        doc.text('1RM RESULTS', pageWidth / 2, yPos + (isMobile ? 13 : 10), { align: 'center' });
    }

    yPos += (isMobile ? 20 : 16) + (isMobile ? 10 : 8);

    // --- INFO SECTION ---
    const date = new Date().toLocaleDateString();
    if (isMobile) {
        doc.setFontSize(15);
        doc.setTextColor(48, 48, 48);
        doc.setFont('helvetica', 'normal');

        const lifterStr = `Lifter: ${lifterName || 'N/A'}`;
        const inputStr = `${weight} ${unit} x ${reps} reps`;
        const dateStr = `Date: ${date}`;

        // Single line for info
        doc.text(`${lifterStr}  |  ${inputStr}  |  ${dateStr}`, pageWidth / 2, yPos, { align: 'center'});
        
        yPos += 12;
    } else {
        doc.setFontSize(14);
        doc.setTextColor(17, 24, 39); // slate-800
        doc.text('Calculation Details', margin, yPos, { align: 'left'});
        yPos += 5;
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.line(margin, yPos, margin + contentWidth, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setTextColor(48, 48, 48);

        doc.setFont('helvetica', 'bold');
        doc.text('Lifter:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(lifterName || 'N/A', margin + 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text('Input:', margin + 95, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${weight} ${unit} x ${reps} reps`, margin + 110, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Date:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(date, margin + 20, yPos);
        yPos += 12;
    }

    // --- 1RM RESULT ---
    const boxStartY = yPos;
    const boxHeight = isMobile ? 28 : 22;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, boxStartY, contentWidth, boxHeight, 3, 3, 'FD');
    
    // Vertically center the title and number within the box for better appearance
    const titleY = boxStartY + (isMobile ? 8 : 6);
    doc.setFontSize(isMobile ? 12 : 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175); // blue-800
    doc.text('STRENGTH ANALYTICS 1RM ESTIMATE', pageWidth / 2, titleY, { align: 'center' });
    
    const numberY = titleY + (isMobile ? 11 : 9);
    doc.setFontSize(isMobile ? 32 : 32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39); // slate-900
    doc.text(`${(Math.round(results.strengthAnalytics1RM * 2) / 2).toFixed(1)} ${unit}`, pageWidth / 2, numberY, { align: 'center' });
    
    yPos = boxStartY + boxHeight + (isMobile ? 10 : 12);

    // --- TABLE ---
    doc.setFontSize(isMobile ? 20 : 14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Training Zone Percentages', isMobile ? pageWidth / 2 : margin, yPos, { align: isMobile ? 'center' : 'left'});
    yPos += isMobile ? 8 : 6;

    const tableData = results.repTableData.map(row => [
        row.reps.toString(),
        `${row.percentage}%`,
        `${row.weight}`
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Reps', '% of 1RM', `Weight (${unit})`]],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: '#e2e8f0', // slate-200
            textColor: '#1e293b', // slate-800
            fontStyle: 'bold',
            fontSize: isMobile ? 12 : 9,
        },
        styles: {
            cellPadding: isMobile ? 3 : 2,
            fontSize: isMobile ? 12 : 9,
            textColor: '#0f172a' // slate-900
        },
        columnStyles: {
            0: { halign: 'center', fontStyle: 'bold' },
            1: { halign: 'center' },
            2: { halign: 'center', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin }
    });
    
    return doc.output('blob');
};

export const savePdf = (blob: Blob, fileName: string) => {
    if (blob.size === 0) {
        alert("Sorry, an error occurred while generating the PDF. Please try again.");
        return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const sharePdf = async (blob: Blob, fileName: string, title: string, text: string) => {
    if (blob.size === 0) {
        alert("Sorry, an error occurred while generating the PDF. It cannot be shared.");
        return;
    }
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const shareData = {
        files: [file],
        title: title,
        text: text,
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Error sharing PDF:', error);
                // Fallback to saving if sharing fails for a reason other than user cancellation
                savePdf(blob, fileName);
            }
        }
    } else {
        console.warn("Web Share API cannot share these files, falling back to download.");
        savePdf(blob, fileName);
    }
};