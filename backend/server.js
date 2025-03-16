const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const SPREADSHEET_ID = '1EySpWSE1NosfWziH4voX5PsdtYrtxrCmWn3sMdSkYLg';
const API_KEY = 'AIzaSyAebz-xL67LSPO4VCb7g9AmK6X25bwLMho';
const sheets = google.sheets({ version: 'v4', auth: API_KEY });

function normalizeName(name) {
    // Remove all punctuation marks and convert to lowercase
    name = name
        .replace(/[^\w\s]/g, '') // Remove all non-alphanumeric characters (punctuation)
        .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
        .trim()                 // Trim leading and trailing spaces
        .toLowerCase();         // Convert to lowercase

    // Extract the "Class of" year
    const classOfMatch = name.match(/\bclass of (\d{4})\b/);
    const classOfYear = classOfMatch ? classOfMatch[1] : null;

    // Remove the "Class of" part from the name
    name = name.replace(/\bclass of \d{4}\b/g, '').trim();

    // Handle names with commas (e.g., "Tserakhava, Anastasiya")
    if (name.includes(',')) {
        const [lastName, firstName] = name.split(',').map(part => part.trim());
        name = `${firstName} ${lastName}`; // Reorder to "FirstName LastName"
    } else {
        // Handle names without commas (e.g., "Tserakhava Anastasiya")
        const parts = name.split(' ');
        if (parts.length >= 2) {
            const lastName = parts[0]; // First part is the last name
            const firstName = parts.slice(1).join(' '); // Rest is the first name
            name = `${firstName} ${lastName}`; // Reorder to "FirstName LastName"
        }
    }

    // Add the "Class of" year back to the name
    if (classOfYear) {
        name = `${name} class of ${classOfYear}`;
    }

    return name;
}

async function getSheetData(sheetName) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'MasterSheet',
    });
    console.log('API Response:', response.data);
    return response.data.values;
}

app.post('/api/search', async (req, res) => {
    const { name } = req.body;
    console.log(`Searching for name: "${name}"`); // Log the name being searched

    try {
        const data = await getSheetData('MasterSheet');
        console.log('Fetched data:', data);

        // Normalize the user's input
        const normalizedUserName = name; // The name is already normalized by the frontend

        // Skip the first row (headers) and filter rows that match the normalized name
        const matchingRows = data.slice(1).filter(row => {
            const rowName = row[7]; // Assuming 'name' is in the 8th column (index 7)
            if (!rowName) {
                console.warn('Row with missing name:', row);
                return false;
            }

            // Normalize the name from the sheet
            const normalizedRowName = normalizeName(rowName);
            console.log(`Comparing "${normalizedRowName}" with "${normalizedUserName}"`); // Log comparison
            return normalizedRowName === normalizedUserName;
        });

        console.log('Matching rows:', matchingRows);

        if (matchingRows.length > 0) {
            const results = matchingRows.map(row => ({
                num: row[0],           // num
                date: row[1],          // Date
                location: row[2],      // Location
                gpsCoordinates: row[3], // GPS Coordinates
                typeOfActivity: row[4], // Type of Activity
                species: row[5],       // Species
                remarks: row[6],       // Remarks
                name: row[7],          // name (original, non-normalized)
            }));
            res.json({ name: matchingRows[0][7], results }); // Return the original name for display
        } else {
            res.status(404).json({ error: 'Name not found' });
        }
    } catch (err) {
        console.error('Error in /api/search:', err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Server started successfully!');
});