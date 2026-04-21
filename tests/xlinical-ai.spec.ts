import { test, expect } from '@playwright/test';
import { ReviewOfSystemsPage } from './ReviewOfSystemsPage';

test('Clinical AI Assessment Flow', async ({ page }) => {
  // Give the overall test a generous timeout for full end-to-end runs
  test.setTimeout(90000); 
  
  // ==========================================
  // Authentication
  // ==========================================
  await page.goto('/auth');
  await page.getByRole('textbox', { name: 'Email' }).fill('muslimkaki@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');

  // Wait for the network to calm down and WebSockets to connect
  await page.waitForLoadState('networkidle');

  // ==========================================
  // Start New Assessment
  // ==========================================
  const newAssessmentBtn = page.getByRole('button', { name: 'New Patient Assessment' });
  await newAssessmentBtn.waitFor({ state: 'visible' });
  await newAssessmentBtn.click();

  // ==========================================
  // Patient Registration
  // ==========================================
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Female' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('Test Patient');
  await page.getByRole('spinbutton', { name: 'Age *' }).fill('55');
  await page.locator('div').filter({ hasText: /^Location\/Ward \*$/ }).click();
  await page.getByRole('textbox', { name: 'Location/Ward *' }).fill('ICU-A');
  await page.getByRole('button', { name: 'Create Patient' }).click();

  // ==========================================
  // Chief Complaint
  // ==========================================
  await page.getByRole('textbox', { name: 'Enter custom chief complaint' }).fill('coughing');
  await page.getByRole('button', { name: 'Continue' }).click();

  // ==========================================
  // History of Present Illness (HPI) Phase 1
  // ==========================================
  await page.getByRole('radio', { name: 'Gradual over days/weeks' }).click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByText('Cold air/allergens').click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.locator('div').filter({ hasText: /^Chronic cough$/ }).click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByText('Dry cough').click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByText('No chest pain').click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  // Severity Scale
  await page.locator('.relative.h-2').click();
  await page.getByRole('button', { name: 'Continue to Review of Systems' }).click();

  // Adaptive Questions Phase 2
  const followUp = page.getByText('No recent major events');
  await followUp.waitFor({ state: 'visible', timeout: 15000 });
  await followUp.click({ force: true });
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByRole('button', { name: 'Continue to Review of Systems' }).click();

  // ==========================================
  // 6. Review of Systems (Batch Save Architecture)
  // ==========================================
  await expect(page, 'App redirected to login unexpectedly.').not.toHaveURL(/.*auth/);

  const rosPage = new ReviewOfSystemsPage(page);

  // Perform the clicks
  await rosPage.clickSymptom('Fever');
  await rosPage.clickSymptom('Chills');
  await rosPage.clickSymptom('Headache');
  await rosPage.clickSymptom('Vision changes', true);
  await rosPage.clickSymptom('Hearing loss', true);

  // Verify React state aggregated properly
  await rosPage.verifySymptomCounts(3, 2);

  // 🚨 BATCH SAVE TRIGGER 🚨
  await rosPage.continueToSummary();

  // ==========================================
  // 7. Past Medical & Social History
  // ==========================================
  await expect(page.getByRole('heading', { name: 'Past Medical History' })).toBeVisible({ timeout: 15000 });
  
  const statusCombobox = page.getByRole('combobox').filter({ hasText: 'Select status' });
  await statusCombobox.click();
  await page.getByRole('option', { name: 'Former smoker' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Select usage' }).click();
  await page.getByRole('option', { name: 'None' }).click();
  await page.getByPlaceholder('e.g. 10').fill('5');
  
  await page.getByRole('combobox').filter({ hasText: 'Select' }).click();
  await page.getByRole('option', { name: 'Lives alone' }).click();
  await page.locator('div').filter({ hasText: /^Cancer$/ }).click();
  await page.getByRole('checkbox', { name: 'Asthma' }).check();
  
  // Wait for PMH save
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: 'Continue to Physical Exam' }).click()
  ]);

  // ==========================================
  // Physical Examination
  // ==========================================
  await page.getByRole('textbox', { name: 'Blood Pressure' }).fill('120/70');
  await page.getByRole('textbox', { name: 'Heart Rate' }).fill('75');
  await page.getByRole('textbox', { name: 'Respiratory Rate' }).fill('20');
  await page.getByRole('textbox', { name: 'Temperature' }).fill('98');
  await page.getByRole('textbox', { name: 'Oxygen Saturation' }).fill('94');

  await page.getByRole('tab', { name: 'General' }).click();
  await page.getByRole('textbox', { name: /describe patient/i }).fill('Patient is alert and stable.');

  const systemsTab = page.getByRole('tab', { name: 'Systems' });
  await systemsTab.waitFor({ state: 'visible' });
  await systemsTab.click();
  
  await page.getByLabel('Wheezes').click();
  await page.getByLabel('Crackles/rales').click();
  await page.locator('#cardiovascular-normal').click({ force: true });
  await page.locator('#abdomen-normal').click();
  await page.locator('#neurological-normal').click();
  await page.locator('#musculoskeletal-normal').click();

  // Wait for Physical Exam save
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: 'Continue to Assessment & Plan' }).click()
  ]);

  // ==========================================
  // 9. Clinical Decision Support (AI Generation)
  // ==========================================
  await expect(page.getByText(/Generating/)).toHaveCount(0, { timeout: 80000 });

  await page.getByRole('tab', { name: 'AI Diagnosis' }).click();
  await page.getByRole('button', { name: 'Retry' }).click();
  
  const investigationsTab = page.getByRole('tab', { name: 'Investigations' });
  await investigationsTab.waitFor({ state: 'visible' });
  await investigationsTab.click({ force: true });
  await page.getByRole('checkbox').first().check({ force: true });
  await page.getByRole('checkbox').nth(1).check({ force: true });
  await page.getByRole('textbox', { name: 'Provide detailed clinical' }).fill('Routine blood work.');
  
  await page.getByRole('tab', { name: 'Clinical Scores' }).click();
  await page.getByRole('checkbox', { name: 'Clinical signs of DVT' }).check({ force: true });
  
  await page.getByRole('tab', { name: 'Treatment & Management' }).click();
  await page.getByRole('checkbox').first().check({ force: true });
  await page.locator('div').filter({ hasText: /^Physical therapy$/ }).click();
  await page.getByRole('checkbox').nth(1).check({ force: true });
  await page.getByRole('textbox', { name: 'Outline specific follow-up' }).fill('Follow up in 2 weeks.');
  
  await page.getByRole('button', { name: 'Save Clinical Plan' }).click();

  // ==========================================
  // 10. Summary and Export Documentation
  // ==========================================
  await expect(page.getByText('Generating Patient Summary')).toBeHidden({ timeout: 60000 });
  const finalButton = page.getByRole('button', { name: /(Skip to Summary|Complete Assessment)/ });
  await finalButton.waitFor({ state: 'visible' });
  await finalButton.click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF' }).click();
  const download = await downloadPromise;
  
  await page.getByRole('button', { name: 'Create SOAP Note' }).click();
  await page.getByRole('button', { name: 'Save SOAP Note' }).click();
  await page.getByRole('button', { name: 'Generate Referral Letter' }).click();
  
  await page.getByRole('combobox').filter({ hasText: 'Select specialty' }).click();
  await page.getByRole('option', { name: 'Cardiology' }).click();
  await page.getByRole('combobox').filter({ hasText: 'RoutineStandard referral' }).click();
  await page.getByRole('option', { name: 'Routine Standard referral' }).click();
  await page.getByRole('textbox', { name: 'Recipient Doctor (Optional)' }).fill('Dr. Smith');
  await page.getByRole('textbox', { name: 'Facility (Optional)' }).fill('Central Hospital');
  await page.getByRole('textbox', { name: 'Clinical Question *' }).fill('Please evaluate for coronary artery disease and provide risk stratification');
  
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await page.getByRole('button', { name: 'Save Referral Letter' }).click();
  
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  
  await page.getByRole('button', { name: 'Copy as Clinical Vignette' }).click();
  await page.getByRole('button', { name: 'Complete Assessment' }).click();
  await page.getByRole('button', { name: 'Return to Dashboard' }).click();
});