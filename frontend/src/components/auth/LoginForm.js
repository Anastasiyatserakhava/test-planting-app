// Login Form Component
import React, { useState } from 'react';

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

export default LoginForm;