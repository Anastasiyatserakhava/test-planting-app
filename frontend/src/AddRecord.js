import React, { useState } from 'react';
import axios from 'axios';
import './AddRecord.css';

const AddRecord = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today's date
    location: '',
    gpsCoordinates: '',
    typeOfActivity: 'Tree Planting',
    species: '',
    remarks: '',
    name: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/add-record', formData);
      setMessage('Tree planting record added successfully!');
      // Reset form fields except for date
      setFormData({
        date: formData.date, // Keep the current date
        location: '',
        gpsCoordinates: '',
        typeOfActivity: 'Tree Planting',
        species: '',
        remarks: '',
        name: ''
      });
    } catch (err) {
      console.error('Error adding record:', err);
      setError(err.response?.data?.error || 'Failed to add record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-record-container">
      <h2>Add New Tree Planting Record</h2>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter location"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="gpsCoordinates">GPS Coordinates</label>
          <input
            type="text"
            id="gpsCoordinates"
            name="gpsCoordinates"
            value={formData.gpsCoordinates}
            onChange={handleChange}
            placeholder="e.g., 41.4036, -73.5805"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="typeOfActivity">Type of Activity</label>
          <select
            id="typeOfActivity"
            name="typeOfActivity"
            value={formData.typeOfActivity}
            onChange={handleChange}
          >
            <option value="Tree Planting">Tree Planting</option>
            <option value="Tree Care">Tree Care</option>
            <option value="Educational">Educational</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="species">Species *</label>
          <input
            type="text"
            id="species"
            name="species"
            value={formData.species}
            onChange={handleChange}
            placeholder="Enter tree species"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="remarks">Remarks</label>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Additional notes or observations"
            rows="3"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Your Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </div>
        
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Adding...' : 'Add Record'}
        </button>
      </form>
    </div>
  );
};

export default AddRecord;