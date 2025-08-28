const fs = require('fs');
const path = require('path');

function csvToJson(csvFilePath, jsonFilePath) {
  try {
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (!isNaN(value) && value !== '') {
          obj[header] = parseFloat(value);
        } else {
          obj[header] = value;
        }
      });
      
      result.push(obj);
    }
    
    fs.writeFileSync(jsonFilePath, JSON.stringify(result, null, 2));
    console.log(`Successfully converted ${csvFilePath} to ${jsonFilePath}`);
    console.log(`Converted ${result.length} rows`);
  } catch (error) {
    console.error('Error converting CSV to JSON:', error.message);
  }
}

const csvPath = path.join(__dirname, 'public', 'DINS_data.csv');
const jsonPath = path.join(__dirname, 'public', 'data.json');

csvToJson(csvPath, jsonPath);