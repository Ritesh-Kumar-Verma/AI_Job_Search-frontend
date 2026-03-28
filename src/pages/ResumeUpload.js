import React, { useState, useEffect } from 'react';
import { resumeAPI } from '../services/api';

function ResumeUpload() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadedResume, setUploadedResume] = useState(null);

  useEffect(() => {
    loadResume();
  }, []);

  const loadResume = async () => {
    try {
      const res = await resumeAPI.get();
      setUploadedResume(res.data);
    } catch (err) {
    
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValid = ['application/pdf', 'text/plain'].includes(file.type);
      if (isValid) {
        setResume(file);
        setError('');
      } else {
        setError('Only PDF and TXT files are allowed');
        setResume(null);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!resume) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resumeAPI.upload(resume);
      setMessage('Resume uploaded successfully!');
      setResume(null);
      loadResume();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#2563eb' }}>Upload Your Resume</h1>

        <p style={{ color: '#667', marginBottom: '2rem' }}>
          Upload a PDF or text file. We'll extract skills and match you with relevant jobs.
        </p>

        {uploadedResume && (
          <div style={{ backgroundColor: '#d1fae5', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            <p style={{ color: '#065f46', marginBottom: '0.5rem' }}>
              ✓ Current Resume: <strong>{uploadedResume.fileName}</strong>
            </p>
            {uploadedResume.skills && uploadedResume.skills.length > 0 && (
              <p style={{ color: '#065f46', fontSize: '0.875rem' }}>
                Skills detected: {uploadedResume.skills.join(', ')}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label htmlFor="resume">Select Resume File</label>
            <input
              id="resume"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              style={{ padding: '1rem', border: '2px dashed #2563eb', borderRadius: '0.5rem' }}
            />
            {resume && <p style={{ marginTop: '0.5rem', color: '#667', fontSize: '0.875rem' }}>Selected: {resume.name}</p>}
          </div>

          {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
          {message && <div style={{ color: 'green', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!resume || loading}
          >
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResumeUpload;
