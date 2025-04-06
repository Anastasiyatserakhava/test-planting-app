export function normalizeName(name) {
    // Remove special characters and extra spaces
    name = name
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    // Extract class year
    const classOfMatch = name.match(/\bclass of (\d{4})\b/);
    const classOfYear = classOfMatch ? classOfMatch[1] : null;

    // Remove class of year from name
    name = name.replace(/\bclass of \d{4}\b/g, '').trim();

    // Handle last name, first name format
    if (name.includes(',')) {
        const [lastName, firstName] = name.split(',').map(part => part.trim());
        name = `${firstName} ${lastName}`;
    } else {
        const parts = name.split(' ');
        if (parts.length > 1) {
            // If multiple words, assume last word is first name
            const lastName = parts.slice(0, -1).join(' ');
            const firstName = parts[parts.length - 1];
            name = `${firstName} ${lastName}`;
        }
    }

    // Add class year back if exists
    if (classOfYear) {
        name = `${name} class of ${classOfYear}`;
    }

    return name;
}