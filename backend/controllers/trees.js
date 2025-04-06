const { google } = require('googleapis');
const path = require('path');

async function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return await auth.getClient();
}

async function searchTrees(name) {
    try {
        const sheets = google.sheets({ version: 'v4', auth: await getGoogleSheetsClient() });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Trees!A:H', // Adjust range as needed
        });

        const rows = response.data.values || [];
        const headers = rows[0];
        
        // Filter results based on name (case-insensitive)
        const filteredResults = rows.slice(1).filter(row => {
            const rowName = row[1]?.toLowerCase(); // Assuming name is in the second column
            return rowName && rowName.includes(name.toLowerCase());
        }).map((row, index) => {
            const result = {};
            headers.forEach((header, i) => {
                result[header.toLowerCase().replace(/\s+/g, '')] = row[i];
            });
            result.num = index + 1;
            return result;
        });

        return filteredResults;
    } catch (error) {
        console.error('Error searching trees:', error);
        throw error;
    }
}

async function addTree(treeData) {
    try {
        const sheets = google.sheets({ version: 'v4', auth: await getGoogleSheetsClient() });
        
        // Prepare row data
        const row = [
            new Date().toISOString(), // Date
            treeData.name,
            treeData.location,
            treeData.gpsCoordinates,
            treeData.typeOfActivity,
            treeData.species,
            treeData.remarks,
            treeData.treeImage || '' // Image path or empty string
        ];

        // Append new row to spreadsheet
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Trees!A:H',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [row] }
        });

        return {
            message: 'Tree added successfully',
            rowsAdded: response.data.updates.updatedRows
        };
    } catch (error) {
        console.error('Error adding tree:', error);
        throw error;
    }
}

module.exports = { searchTrees, addTree };