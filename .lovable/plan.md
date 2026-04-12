

## Problem
When viewing a completed assessment in the Patient Details view, there's no way to re-open and view the summary. The code only shows a "Resume" button for `in-progress` assessments (line 181-189 of `PatientDetails.tsx`). Completed assessments have no action button.

## Plan

### 1. Add "View Summary" button for completed assessments in PatientDetails.tsx
- Add a new prop `onViewCompletedAssessment: (assessmentId: string, chiefComplaint: string) => void`
- Next to the existing "Resume" button block (line 181-189), add an equivalent block for `status === 'completed'` that renders a "View Summary" button calling this new prop

### 2. Add a read-only summary view route in Index.tsx
- Add a new handler `handleViewCompletedAssessment` that:
  - Loads the assessment and patient data from the database (similar to `handleResumeAssessment`)
  - Sets the assessment and patient in state via dispatch
  - Sets `selectedComplaint` from the assessment's `chief_complaint`
  - Loads saved answers, ROS data, and differential diagnoses from the database into state
  - Navigates to `currentView = 'view-summary'`
- Add `'view-summary'` to the `AppState` type
- Render `ClinicalSummary` in read-only mode for the `view-summary` view (reusing the existing component which already loads differentials and clinical decision data from the database)

### 3. Pass the new callback from Index.tsx to PatientDetails
- Wire `onViewCompletedAssessment` in the `patient-details` render block, calling `handleViewCompletedAssessment`

### Files changed
- `src/components/PatientDetails.tsx` — add "View Summary" button + new prop
- `src/pages/Index.tsx` — add handler, state type, and render block for viewing completed summaries

