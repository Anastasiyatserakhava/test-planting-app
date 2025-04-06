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
    const [activeTab, setActiveTab] = useState('search'); // 'search' or 'add'
    const [addRecordMessage, setAddRecordMessage] = useState('');
    const [addRecordError, setAddRecordError] = useState('');
    const [addRecordForm, setAddRecordForm] = useState({
        date: new Date().toISOString().split('T')[0], // Default to today's date
        location: '',
        gpsCoordinates: '',
        typeOfActivity: 'Tree Planting',
        species: '',
        remarks: '',
        name: ''
    });

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

    // Handle Add Record form changes
    const handleAddRecordChange = (e) => {
        const { name, value } = e.target;
        setAddRecordForm({
            ...addRecordForm,
            [name]: value
        });
    };

    // Handle Add Record submission
    const handleAddRecordSubmit = async (e) => {
        e.preventDefault();
        setAddRecordMessage('');
        setAddRecordError('');

        try {
            // Use the logged-in user's name for the record
            const recordData = {
                ...addRecordForm,
                name: name // Use the authenticated user's name
            };

            const response = await axios.post('http://localhost:5000/api/add-record', recordData);
            
            setAddRecordMessage('Tree planting record added successfully!');
            
            // Reset form fields except for date
            setAddRecordForm({
                date: addRecordForm.date, // Keep the current date
                location: '',
                gpsCoordinates: '',
                typeOfActivity: 'Tree Planting',
                species: '',
                remarks: '',
                name: name
            });
            
            // Refresh data after adding a record
            fetchData();
        } catch (err) {
            console.error('Error adding record:', err);
            setAddRecordError(err.response?.data?.error || 'Failed to add record. Please try again.');
        }
    };

    // Fetch data function
    const fetchData = async () => {
        if (name) {
            try {
                console.log('Searching for name:', name);
                const normalizedUserName = normalizeName(name);
                const response = await axios.post('http://localhost:5000/api/search', { name: normalizedUserName });
                console.log('Response:', response.data);
                setData(response.data);
                setError('');
            } catch (err) {
                console.error('Error fetching data:', err.response ? err.response.data : err.message);
                setError('Name not found');
                setData(null);
            }
        }
    };

    // Fetch data when name changes
    useEffect(() => {
        fetchData();
    }, [name]);

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Tree Planting Tracker</h1>

            {!user ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <SignUpForm onSignUp={handleSignUp} error={error} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <LoginForm onLogin={handleLogin} error={error} />
                    </div>
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <p style={{ margin: 0, fontSize: '18px' }}>Welcome, {formatNameForDisplay(name)}!</p>
                        <div>
                            <button 
                                onClick={() => setActiveTab('search')} 
                                style={{ 
                                    marginRight: '10px', 
                                    padding: '8px 16px',
                                    backgroundColor: activeTab === 'search' ? '#4CAF50' : '#f1f1f1',
                                    color: activeTab === 'search' ? 'white' : 'black',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                View My Records
                            </button>
                            <button 
                                onClick={() => setActiveTab('add')} 
                                style={{ 
                                    marginRight: '10px', 
                                    padding: '8px 16px',
                                    backgroundColor: activeTab === 'add' ? '#4CAF50' : '#f1f1f1',
                                    color: activeTab === 'add' ? 'white' : 'black',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add New Record
                            </button>
                            <button 
                                onClick={handleLogout}
                                style={{ 
                                    padding: '8px 16px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {activeTab === 'search' ? (
                        <div>
                            {data ? (
                                <div>
                                    <h2>Your Tree Planting Records</h2>
                                    <table style={{ 
                                        width: '100%', 
                                        borderCollapse: 'collapse', 
                                        marginTop: '20px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>#</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Location</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>GPS Coordinates</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type of Activity</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Species</th>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.results.map((row, index) => (
                                                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.num}</td>
                                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.date}</td>
                                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.location}</td>
                                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.gpsCoordinates}</td>
                                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.typeOfActivity}</td>
                                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.species}</td>
                                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{row.remarks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ 
                                    padding: '20px', 
                                    backgroundColor: '#f8f9fa', 
                                    borderRadius: '8px',
                                    textAlign: 'center' 
                                }}>
                                    <p>No records found. Add your first tree planting record!</p>
                                    <button 
                                        onClick={() => setActiveTab('add')}
                                        style={{ 
                                            padding: '8px 16px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Add Record
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '20px', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <h2>Add New Tree Planting Record</h2>
                            
                            {addRecordMessage && (
                                <div style={{ 
                                    padding: '10px', 
                                    backgroundColor: '#d4edda', 
                                    color: '#155724',
                                    borderRadius: '4px',
                                    marginBottom: '20px'
                                }}>
                                    {addRecordMessage}
                                </div>
                            )}
                            
                            {addRecordError && (
                                <div style={{ 
                                    padding: '10px', 
                                    backgroundColor: '#f8d7da', 
                                    color: '#721c24',
                                    borderRadius: '4px',
                                    marginBottom: '20px'
                                }}>
                                    {addRecordError}
                                </div>
                            )}
                            
                            <form onSubmit={handleAddRecordSubmit}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={addRecordForm.date}
                                        onChange={handleAddRecordChange}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={addRecordForm.location}
                                        onChange={handleAddRecordChange}
                                        placeholder="Enter location"
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        GPS Coordinates
                                    </label>
                                    <input
                                        type="text"
                                        name="gpsCoordinates"
                                        value={addRecordForm.gpsCoordinates}
                                        onChange={handleAddRecordChange}
                                        placeholder="e.g., 41.4036, -73.5805"
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Type of Activity
                                    </label>
                                    <select
                                        name="typeOfActivity"
                                        value={addRecordForm.typeOfActivity}
                                        onChange={handleAddRecordChange}
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    >
                                        <option value="Tree Planting">Tree Planting</option>
                                        <option value="Tree Care">Tree Care</option>
                                        <option value="Educational">Educational</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Species *
                                    </label>
                                    <input
                                        type="text"
                                        name="species"
                                        value={addRecordForm.species}
                                        onChange={handleAddRecordChange}
                                        placeholder="Enter tree species"
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                        required
                                    />
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Remarks
                                    </label>
                                    <textarea
                                        name="remarks"
                                        value={addRecordForm.remarks}
                                        onChange={handleAddRecordChange}
                                        placeholder="Additional notes or observations"
                                        rows="3"
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }}
                                    ></textarea>
                                </div>
                                
                                <button 
                                    type="submit"
                                    style={{ 
                                        padding: '10px 20px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '16px'
                                    }}
                                >
                                    Add Record
                                </button>
                            </form>
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
        <form onSubmit={handleSubmit} style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <h2>Sign Up</h2>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Second Name"
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Year (e.g., 2026)"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <button 
                type="submit"
                style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                }}
            >
                Sign Up
            </button>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
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
        <form onSubmit={handleSubmit} style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <h2>Login</h2>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Second Name"
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="Year (e.g., 2026)"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    style={{ 
                        width: '100%', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                    }}
                />
            </div>
            <button 
                type="submit"
                style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%'
                }}
            >
                Login
            </button>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </form>
    );
}

export default App;