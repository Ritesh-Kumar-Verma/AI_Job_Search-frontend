import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {

    if (!user?.resumeId) {
      const timer = setTimeout(() => navigate('/resume'), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ marginBottom: '1rem', color: '#2563eb' }}>Welcome, {user?.name || user?.email}!</h1>
        <p style={{ color: '#667', marginBottom: '2rem' }}>
          AI-Powered Job Tracker - Find your perfect job match
        </p>

        {!user?.resumeId && (
          <div style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
            <p style={{ color: '#92400e' }}>
              📄 Please upload your resume to get personalized job matches
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/jobs')}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💼</div>
            <h3>Browse Jobs</h3>
            <p style={{ color: '#667', fontSize: '0.875rem' }}>Find jobs matched to your skills</p>
          </div>

          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/applications')}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
            <h3>My Applications</h3>
            <p style={{ color: '#667', fontSize: '0.875rem' }}>Track your job applications</p>
          </div>

          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/resume')}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
            <h3>Upload Resume</h3>
            <p style={{ color: '#667', fontSize: '0.875rem' }}>Update your resume</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
