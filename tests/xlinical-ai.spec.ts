import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  // Authentication
  await page.goto('http://localhost:8080/auth');
  await page.getByRole('textbox', { name: 'Email' }).fill('muslimkaki@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('textbox', { name: 'Password' }).press('Enter');

  // Start New Assessment
  await page.getByRole('button', { name: 'New Patient Assessment' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'New Patient Assessment' }).click();

  // Patient Registration
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Female' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('ewerty');
  await page.getByRole('spinbutton', { name: 'Age *' }).fill('55');
  await page.locator('div').filter({ hasText: /^Location\/Ward \*$/ }).click();
  await page.getByRole('textbox', { name: 'Location/Ward *' }).fill('eghjkl');
  await page.getByRole('button', { name: 'Create Patient' }).click();

  // Chief Complaint
  await page.getByRole('textbox', { name: 'Enter custom chief complaint' }).fill('coughing');
  await page.getByRole('button', { name: 'Continue' }).click();

  // History of Present Illness (HPI) Phase 1
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
  await page.getByText('No recent major events').click();
  await page.getByRole('button', { name: 'Next Question' }).click();
  await page.getByRole('button', { name: 'Continue to Review of Systems' }).click();

  // Review of Systems - Record positive and negative findings
  await page.locator('div').filter({ hasText: /^Fever$/ }).getByRole('button').first().click();
  await page.locator('div').filter({ hasText: /^Chills$/ }).getByRole('button').first().click();
  await page.locator('div').filter({ hasText: /^Headache$/ }).getByRole('button').first().click();
  await page.locator('div').filter({ hasText: /^Vision changes$/ }).getByRole('button').nth(1).click();
  await page.locator('div').filter({ hasText: /^Hearing loss$/ }).getByRole('button').nth(1).click();
  await page.getByRole('button', { name: 'Continue to Assessment Summary' }).click();

  // Past Medical & Social History
  await page.getByRole('combobox').filter({ hasText: 'Select status' }).click();
  await page.getByRole('option', { name: 'Former smoker' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Select usage' }).click();
  await page.getByRole('option', { name: 'None' }).click();
  await page.getByPlaceholder('e.g. 10').fill('5');
  
  await page.getByRole('combobox').filter({ hasText: 'Select' }).click();
  await page.getByRole('option', { name: 'Lives alone' }).click();
  await page.locator('div').filter({ hasText: /^Cancer$/ }).click();
  await page.getByRole('checkbox', { name: 'Asthma' }).check();
  await page.getByRole('button', { name: 'Continue to Physical Exam' }).click();

  // Physical Examination
  await page.getByRole('textbox', { name: 'Blood Pressure' }).fill('120/70');
  await page.getByRole('textbox', { name: 'Heart Rate' }).fill('75');
  await page.getByRole('textbox', { name: 'Respiratory Rate' }).fill('20');
  await page.getByRole('textbox', { name: 'Temperature' }).fill('98');
  await page.getByRole('textbox', { name: 'Oxygen Saturation' }).fill('94');

  await page.getByRole('tab', { name: 'General' }).click();
  await page.getByRole('textbox', { name: 'Describe patient\'s general' }).fill('good');
  await page.getByRole('tab', { name: 'Systems' }).click();
  
  await page.getByRole('checkbox', { name: 'Wheezes' }).check({ force: true });
  await page.getByRole('checkbox', { name: 'Crackles/rales' }).check({ force: true });
  await page.locator('#cardiovascular-normal').check({ force: true });
  await page.locator('#abdomen-normal').check({ force: true });
  await page.locator('#neurological-normal').check({ force: true });
  await page.locator('#musculoskeletal-normal').check({ force: true });

  await page.getByRole('button', { name: 'Continue to Assessment & Plan' }).click();

  // Clinical Decision Support
  await page.getByRole('tab', { name: 'AI Diagnosis' }).click();
  await page.getByRole('button', { name: 'Retry' }).click();
  
  await page.getByRole('tab', { name: 'Investigations' }).click();
  await page.getByRole('checkbox').first().check({ force: true });
  await page.getByRole('checkbox').nth(1).check({ force: true });
  await page.getByRole('textbox', { name: 'Provide detailed clinical' }).fill('goodsdfghjkl;');
  await page.getByRole('tab', { name: 'Clinical Scores' }).click();
  await page.getByRole('checkbox', { name: 'Clinical signs of DVT' }).check({ force: true });
  await page.getByRole('tab', { name: 'Treatment & Management' }).click();
  await page.getByRole('checkbox').first().check({ force: true });
  await page.locator('div').filter({ hasText: /^Physical therapy$/ }).click();
  await page.getByRole('checkbox').nth(1).check({ force: true });
  await page.getByRole('textbox', { name: 'Outline specific follow-up' }).fill('xcfvghjkl;\'');
  await page.getByRole('button', { name: 'Save Clinical Plan' }).click();

  // Handle loading state to ensure patient summary has finished generating
  await expect(page.getByText('Generating Patient Summary')).toBeHidden({ timeout: 60000 });
  await page.getByRole('button', { name: 'Skip to Summary' }).click();

  // Summary and Export Documentation
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
  await page.getByRole('textbox', { name: 'Recipient Doctor (Optional)' }).fill('dfghjk');
  await page.getByRole('textbox', { name: 'Facility (Optional)' }).fill('cvgbhnjkl;');
  await page.getByRole('textbox', { name: 'Clinical Question *' }).fill('Please evaluate for coronary artery diseasdfghjkl;\'\nase and provide risk stratification');
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