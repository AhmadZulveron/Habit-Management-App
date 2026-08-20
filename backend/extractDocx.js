const fs = require('fs');
const mammoth = require('mammoth');
const path = require('path');

const docPath = path.join(__dirname, '../Docs/LAPORAN TUGAS AKHIR.docx');
const txtPath = path.join(__dirname, 'results', 'report_text.txt');

mammoth.extractRawText({path: docPath})
  .then(function(result){
      const text = result.value; 
      fs.writeFileSync(txtPath, text, 'utf8');
      console.log('Extracted ' + text.length + ' characters to ' + txtPath);
  })
  .catch(function(err){
      console.error('Error extracting text:', err);
  });
