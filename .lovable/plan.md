

## Plan: Three Improvements

### 1. Fix View Summary to load saved data instead of re-generating

**Problem**: When viewing a completed assessment summary, `ClinicalSummary` calls `AIService.generateDifferentialDiagnosis()` and `AIService.generateAdvancedClinicalSupport()` on mount (lines 45-48). This wastes AI credits and fails when credits are exhausted. The data is already saved in the `differential_diagnoses` and `clinical_decision_support` tables.

**Fix**:
- Add an optional `readOnly` prop to `ClinicalSummary`
- When `readOnly` is true, skip AI generation and instead load differentials from `differential_diagnoses` table and clinical decision data from the existing `useGetClinicalDecisionSupport` hook (already wired)
- Hide the "Complete Assessment" button in read-only mode
- Pass `readOnly={true}` from `Index.tsx` when rendering the `view-summary` view

**Files**: `src/components/ClinicalSummary.tsx`, `src/pages/Index.tsx`

### 2. Add delete patient and delete assessment functionality

**Changes**:
- Add a "Delete Patient" button to `PatientDetails.tsx` with a confirmation dialog (uses existing `AlertDialog` UI component)
- Add a "Delete" button per assessment row in the assessment history list
- Create delete handlers that call `supabase.from('patients').delete()` and `supabase.from('assessments').delete()` respectively (RLS policies already allow delete for authenticated users)
- On patient delete, navigate back to dashboard; on assessment delete, refresh the assessment list

**Files**: `src/components/PatientDetails.tsx`, `src/pages/Index.tsx`

### 3. Add search and filter to Patient List and Dashboard

**Changes**:
- `PatientList` already has a search bar (line 23-27) filtering by name and patient ID — enhance it with status filters (has in-progress assessment, has completed assessment, no assessments) and date range filter
- Add a similar search input to the Dashboard's recent patients section for quick filtering

**Files**: `src/components/PatientList.tsx`, `src/components/Dashboard.tsx`

---

### Implementation order
1. View Summary fix (highest impact — currently broken when credits exhausted)
2. Delete patient/assessment
3. Search and filter enhancements

