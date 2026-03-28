import React, { useState, useEffect } from 'react';
import { applicationsAPI } from '../services/api';

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationsAPI.getAll();
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId, newStatus) => {
    try {
      await applicationsAPI.updateStatus(applicationId, newStatus);
      loadApplications();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const statusOptions = [
    { value: 'applied', label: 'Applied', icon: '📝', color: '#dbeafe', textColor: '#1e40af' },
    { value: 'in-progress', label: 'Interview', icon: '💼', color: '#fef3c7', textColor: '#92400e' },
    { value: 'offer', label: 'Offer', icon: '🎉', color: '#d1fae5', textColor: '#065f46' },
    { value: 'accepted', label: 'Accepted', icon: '✅', color: '#d1fae5', textColor: '#065f46' },
    { value: 'rejected', label: 'Rejected', icon: '❌', color: '#fee2e2', textColor: '#7f1d1d' },
  ];

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getStatusBadge = (status) => {
    const info = getStatusInfo(status);
    return (
      <span
        style={{
          backgroundColor: info.color,
          color: info.textColor,
          padding: '0.25rem 0.75rem',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        {info.icon} {info.label}
      </span>
    );
  };

  const ApplicationTimeline = ({ app }) => {
    const timeline = [
      { status: 'applied', label: 'Applied', date: app.appliedAt || app.appliedDate },
      { status: 'in-progress', label: 'Interview', date: app.interviewDate },
      { status: 'offer', label: 'Offer/Decision', date: app.offerDate },
    ];

    const currentIndex = statusOptions.findIndex(s => s.value === app.status);

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem 0'
      }}>
        {timeline.map((step, index) => {
          const isActive = index <= currentIndex && app.status !== 'rejected';
          const isRejected = app.status === 'rejected';

          return (
            <React.Fragment key={step.status}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '80px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isRejected && index > 0 ? '#fee2e2' : (isActive ? '#10b981' : '#e5e7eb'),
                  color: isRejected && index > 0 ? '#b91c1c' : (isActive ? 'white' : '#9ca3af'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}>
                  {isActive && !isRejected ? '✓' : (index + 1)}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                  color: isActive ? '#333' : '#9ca3af'
                }}>
                  {step.label}
                </span>
                {step.date && (
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
                    {new Date(step.date).toLocaleDateString()}
                  </span>
                )}
              </div>
              {index < timeline.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: index < currentIndex && !isRejected ? '#10b981' : '#e5e7eb',
                  marginBottom: '1.5rem'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem', color: '#2563eb' }}>📋 My Applications</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#667', fontSize: '1.1rem' }}>No applications yet.</p>
          <p style={{ color: '#999', marginTop: '0.5rem' }}>Start applying to jobs from the Job Feed!</p>
        </div>
      ) : (
        <div>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {statusOptions.slice(0, 4).map(status => {
              const count = applications.filter(a => a.status === status.value).length;
              return (
                <div key={status.value} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{status.icon}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: status.textColor }}>{count}</div>
                  <div style={{ fontSize: '0.875rem', color: '#667' }}>{status.label}</div>
                </div>
              );
            })}
          </div>

          {/* Applications List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {applications.map(app => (
              <div key={app._id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem', color: '#1e40af' }}>
                      {app.jobTitle || app.jobId?.title || 'Unknown Job'}
                    </h3>
                    <p style={{ color: '#667', marginBottom: '0.5rem' }}>
                      {app.company || app.jobId?.company || 'Unknown Company'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>
                      Applied: {new Date(app.appliedAt || app.appliedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {app.matchScore && (
                      <span style={{
                        fontWeight: '600',
                        color: app.matchScore > 70 ? '#047857' : '#d97706',
                        backgroundColor: app.matchScore > 70 ? '#d1fae5' : '#fef3c7',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem'
                      }}>
                        {app.matchScore}% Match
                      </span>
                    )}
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                {/* Timeline */}
                <ApplicationTimeline app={app} />

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#667' }}>Update Status:</span>
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app._id, e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-small"
                    >
                      View Job
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;
