console.log('Fetching all forms...');
const { forms } = await getForms();
console.log(`Found ${forms.length} forms total`);

const createdForms = forms.filter(form => form.type === "created");
console.log(`Total created forms: ${createdForms.length}`);

if (createdForms.length === 0) {
  console.log('No created forms found. Exiting...');
  return;
}

// Skip first position and get the rest
const formsToProcess = createdForms.slice(1);
console.log(`Processing ${formsToProcess.length} forms (skipped first one)`);

if (formsToProcess.length === 0) {
  console.log('No forms to process after skipping first one. Exiting...');
  return;
}

for (const form of formsToProcess) {
  // ... existing code ...
} 