export const generateClinicalVignette = (
  chiefComplaint: string,
  answers: any,
  rosData: any
): string => {
  let vignette = `A patient presents with a chief complaint of ${chiefComplaint}.\n\n`;

  // 1. History of Present Illness
  vignette += `HISTORY OF PRESENT ILLNESS:\n`;
  if (answers && Object.keys(answers).length > 0) {
    const hpiDetails = Object.entries(answers).map(([, a]: [string, any]) => {
      const val = a.value || '';
      const notes = a.notes ? `(${a.notes})` : '';
      return `${val} ${notes}`.trim();
    });
    vignette += hpiDetails.filter(Boolean).join('. ') + '.\n\n';
  } else {
    vignette += `Further history not provided.\n\n`;
  }

  // 2. Review of Systems
  vignette += `REVIEW OF SYSTEMS:\n`;
  const positiveROS: string[] = [];
  
  if (rosData && Object.keys(rosData).length > 0) {
    Object.values(rosData).forEach((data: any) => {
      if (data && data.positive && Array.isArray(data.positive)) {
        positiveROS.push(...data.positive);
      }
    });
  }

  if (positiveROS.length > 0) {
    vignette += `Positive for ${positiveROS.join(', ')}. Otherwise negative for major systemic complaints.\n`;
  } else {
    vignette += `Unremarkable or not assessed.\n`;
  }

  return vignette;
};