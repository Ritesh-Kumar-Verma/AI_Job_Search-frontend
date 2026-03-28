import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <div className="container">
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1 }}>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb' }}>
            JobTracker
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/jobs">Job Feed</Link>
            <Link to="/applications">Applications</Link>
            <Link to="/resume">Resume</Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#667' }}>{user?.email}</span>
          <button onClick={logout} className="btn btn-secondary btn-small">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
