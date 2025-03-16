import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';

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

function formatNameForDisplay(name) {
    return name
        .split(' ') // Split the name into words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
        .join(' '); // Rejoin the words into a single string
}

function App() {
    const [name, setName] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null); // Firebase user state

    // Handle sign-up
    const handleSignUp = async (email, password, firstName, secondName, year) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Combine first name, second name, and year to create the full name
            const fullName = `${firstName} ${secondName} - Class of ${year}`;
            const normalizedName = normalizeName(fullName); // Normalize the name
            setName(normalizedName); // Store the normalized name in local state
            setUser(user);
        } catch (err) {
            console.error('Sign-up failed:', err);
            setError('Sign-up failed. Please try again.');
        }
    };

    const handleLogin = async (email, password, firstName, secondName, year) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Combine first name, second name, and year to create the full name
            const fullName = `${firstName} ${secondName} - Class of ${year}`;
            const normalizedName = normalizeName(fullName); // Normalize the name
            setName(normalizedName); // Store the normalized name in local state
            setUser(user);
        } catch (err) {
            console.error('Login failed:', err);
            setError('Login failed. Please check your credentials.');
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setName('');
            setData(null);
        } catch (err) {
            console.error('Logout failed:', err);
            setError('Logout failed. Please try again.');
        }
    };

    // Fetch data when name changes
    useEffect(() => {
        if (name) {
            const fetchData = async () => {
                try {
                    console.log('Searching for name:', name); // Log the name being searched

                    // Normalize the user's input before sending it to the server
                    const normalizedUserName = normalizeName(name);

                    const response = await axios.post('http://localhost:5000/api/search', { name: normalizedUserName });
                    console.log('Response:', response.data); // Log the response
                    setData(response.data);
                    setError('');
                } catch (err) {
                    console.error('Error fetching data:', err.response ? err.response.data : err.message); // Log the error
                    setError('Name not found');
                    setData(null);
                }
            };
            fetchData();
        }
    }, [name]);

    return (
        <div style={{ padding: '20px' }}>
            <h1>Torque Experiment Data</h1>

            {!user ? (
                <>
                    <SignUpForm onSignUp={handleSignUp} error={error} />
                    <LoginForm onLogin={handleLogin} error={error} />
                </>
            ) : (
                <div>
                    <p>Welcome, {formatNameForDisplay(name)}!</p>
                    <button onClick={handleLogout}>Logout</button>

                    {data && (
                        <div>
                            <h2>Data for {formatNameForDisplay(data.name)}</h2>
                            <table border="1" cellPadding="10" style={{ marginTop: '20px' }}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Date</th>
                                        <th>Location</th>
                                        <th>GPS Coordinates</th>
                                        <th>Type of Activity</th>
                                        <th>Species</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.results.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.num}</td>
                                            <td>{row.date}</td>
                                            <td>{row.location}</td>
                                            <td>{row.gpsCoordinates}</td>
                                            <td>{row.typeOfActivity}</td>
                                            <td>{row.species}</td>
                                            <td>{row.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Sign-Up Form Component
function SignUpForm({ onSignUp, error }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [secondName, setSecondName] = useState('');
    const [year, setYear] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSignUp(email, password, firstName, secondName, year);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Sign Up</h2>
            <div>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Second Name"
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    required
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Year (e.g., 2026)"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Sign Up</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}

// Login Form Component
function LoginForm({ onLogin, error }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [secondName, setSecondName] = useState('');
    const [year, setYear] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password, firstName, secondName, year);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            <div>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Second Name"
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    required
                />
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Year (e.g., 2026)"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Login</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}

export default App;