const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const SPREADSHEET_ID = '1EySpWSE1NosfWziH4voX5PsdtYrtxrCmWn3sMdSkYLg';
const API_KEY = 'AIzaSyAebz-xL67LSPO4VCb7g9AmK6X25bwLMho';

// For read-only operations (like search)
const readOnlySheets = google.sheets({ version: 'v4', auth: API_KEY });

// For write operations - using OAuth2
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // You need to create this file with your service account credentials
  scopes: SCOPES
});

// Function to get authenticated client
async function getAuthenticatedClient() {
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

function normalizeName(name) {
    // Same function as before
    name = name
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const classOfMatch = name.match(/\bclass of (\d{4})\b/);
    const classOfYear = classOfMatch ? classOfMatch[1] : null;

    name = name.replace(/\bclass of \d{4}\b/g, '').trim();

    if (name.includes(',')) {
        const [lastName, firstName] = name.split(',').map(part => part.trim());
        name = `${firstName} ${lastName}`;
    } else {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            const lastName = parts[0];
            const firstName = parts.slice(1).join(' ');
            name = `${firstName} ${lastName}`;
        }
    }

    if (classOfYear) {
        name = `${name} class of ${classOfYear}`;
    }

    return name;
}

async function getSheetData(sheetName) {
    const response = await readOnlySheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'MasterSheet',
    });
    console.log('API Response:', response.data);
    return response.data.values;
}

async function getNextRowNumber() {
    try {
        const data = await getSheetData('MasterSheet');
        return data.length > 1 ? parseInt(data[data.length - 1][0]) + 1 : 1;
    } catch (err) {
        console.error('Error getting next row number:', err);
        throw err;
    }
}

app.post('/api/search', async (req, res) => {
    const { name } = req.body;
    console.log(`Searching for name: "${name}"`);

    try {
        const data = await getSheetData('MasterSheet');
        console.log('Fetched data:', data);

        const normalizedUserName = name;

        const matchingRows = data.slice(1).filter(row => {
            const rowName = row[7];
            if (!rowName) {
                console.warn('Row with missing name:', row);
                return false;
            }

            const normalizedRowName = normalizeName(rowName);
            console.log(`Comparing "${normalizedRowName}" with "${normalizedUserName}"`);
            return normalizedRowName === normalizedUserName;
        });

        console.log('Matching rows:', matchingRows);

        if (matchingRows.length > 0) {
            const results = matchingRows.map(row => ({
                num: row[0],
                date: row[1],
                location: row[2],
                gpsCoordinates: row[3],
                typeOfActivity: row[4],
                species: row[5],
                remarks: row[6],
                name: row[7],
            }));
            res.json({ name: matchingRows[0][7], results });
        } else {
            res.status(404).json({ error: 'Name not found' });
        }
    } catch (err) {
        console.error('Error in /api/search:', err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.post('/api/add-record', async (req, res) => {
    const { date, location, gpsCoordinates, typeOfActivity, species, remarks, name } = req.body;
    
    console.log('Adding new tree planting record:', req.body);
    
    try {
        // Validate required fields
        if (!date || !location || !species || !name) {
            return res.status(400).json({ error: 'Missing required fields: date, location, species, and name are required' });
        }
        
        // Get the next row number
        const nextRowNum = await getNextRowNumber();
        
        // Prepare the new row data
        const newRow = [
            nextRowNum.toString(),
            date,
            location,
            gpsCoordinates || '',
            typeOfActivity || 'Tree Planting',
            species,
            remarks || '',
            name,
        ];
        
        // Get authenticated client for write operations
        const sheetsClient = await getAuthenticatedClient();
        
        // Append the new row to the spreadsheet
        await sheetsClient.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'MasterSheet',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [newRow]
            },
        });
        
        res.status(201).json({ 
            message: 'Tree planting record added successfully',
            record: {
                num: nextRowNum,
                date,
                location,
                gpsCoordinates: gpsCoordinates || '',
                typeOfActivity: typeOfActivity || 'Tree Planting',
                species,
                remarks: remarks || '',
                name
            }
        });
    } catch (err) {
        console.error('Error in /api/add-record:', err);
        res.status(500).json({ error: 'Failed to add record: ' + err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Server started successfully!');
});