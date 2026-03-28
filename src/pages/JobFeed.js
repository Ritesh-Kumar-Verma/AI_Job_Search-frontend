import React, { useState, useEffect } from 'react';
import { jobsAPI, applicationsAPI } from '../services/api';

function JobFeed({ externalFilters, onFiltersChange }) {
  const [jobs, setJobs] = useState([]);
  const [bestMatches, setBestMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [filterOptions, setFilterOptions] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    datePosted: 'all',
    jobType: [],
    workMode: [],
    location: '',
    skills: [],
    matchScore: '',
  });
  const [suggestedFilters, setSuggestedFilters] = useState(null);
  const [pendingApplication, setPendingApplication] = useState(null);

  useEffect(() => {
    if (externalFilters) {
      setFilters(prev => {
        const newFilters = { ...prev };

        // Handle clearAll
        if (externalFilters.clearAll) {
          return {
            search: '',
            datePosted: 'all',
            jobType: [],
            workMode: [],
            location: '',
            skills: [],
            matchScore: '',
          };
        }

        if (externalFilters.search !== undefined) newFilters.search = externalFilters.search;
        if (externalFilters.location !== undefined) newFilters.location = externalFilters.location;
        if (externalFilters.datePosted !== undefined) newFilters.datePosted = externalFilters.datePosted;
        if (externalFilters.matchScore !== undefined) newFilters.matchScore = externalFilters.matchScore;
        if (externalFilters.workMode !== undefined) {
          newFilters.workMode = Array.isArray(externalFilters.workMode)
            ? externalFilters.workMode
            : [externalFilters.workMode].filter(Boolean);
        }
        if (externalFilters.jobType !== undefined) {
          newFilters.jobType = Array.isArray(externalFilters.jobType)
            ? externalFilters.jobType
            : [externalFilters.jobType].filter(Boolean);
        }
        if (externalFilters.skills !== undefined) {
          newFilters.skills = Array.isArray(externalFilters.skills)
            ? externalFilters.skills
            : [externalFilters.skills].filter(Boolean);
        }

        return newFilters;
      });
      setSuggestedFilters(externalFilters);
    }
  }, [externalFilters]);

  // Re-load jobs when filters change from AI
  useEffect(() => {
    if (externalFilters) {
      loadJobs();
    }
  }, [filters]);

  useEffect(() => {
    loadJobs();
    loadApplications();
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const res = await jobsAPI.getFilterOptions();
      setFilterOptions(res.data);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsAPI.getFiltered(filters);
      const allJobs = res.data.jobs || [];
      setJobs(allJobs);

      const topMatches = [...allJobs]
        .filter(job => job.matchScore >= 70)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8);
      setBestMatches(topMatches);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await applicationsAPI.getAll();
      const applied = new Set(res.data.applications.map(app => app.jobId));
      setAppliedJobs(applied);
    } catch (err) {
      console.error('Error loading applications:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setSuggestedFilters(null); 
   
    if (onFiltersChange) {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const handleApply = (job) => {
    const jobUrl = job.url || job.redirectUrl || '#';
    window.open(jobUrl, '_blank');

    setPendingApplication(job);
  };

  const confirmApplication = async (response) => {
    if (!pendingApplication) return;

    if (response === 'yes') {
      try {
        const jobId = pendingApplication._id || pendingApplication.externalId;


        await applicationsAPI.apply(jobId, {
          title: pendingApplication.title,
          company: pendingApplication.company,
          url: pendingApplication.url || pendingApplication.redirectUrl,
          matchScore: pendingApplication.matchScore,
        });
        setAppliedJobs(prev => new Set([...prev, jobId]));
      } catch (err) {
        if (!err.response?.data?.message?.includes('Already applied')) {
          console.error('Error applying:', err);
        }
      }
    } else if (response === 'already') {
      const jobId = pendingApplication._id || pendingApplication.externalId;
      try {
        await applicationsAPI.apply(jobId, {
          title: pendingApplication.title,
          company: pendingApplication.company,
          url: pendingApplication.url || pendingApplication.redirectUrl,
          matchScore: pendingApplication.matchScore,
        });
      } catch (err) {
      }
      setAppliedJobs(prev => new Set([...prev, jobId]));
    }

    setPendingApplication(null);
  };

  const applyFilters = () => {
    loadJobs();
  };


  const getScoreBadge = (score) => {
    if (score >= 70) return <span className="match-score score-high">🟢 {score}%</span>;
    if (score >= 40) return <span className="match-score score-medium">🟡 {score}%</span>;
    return <span className="match-score score-low">⚪ {score}%</span>;
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      datePosted: 'all',
      jobType: [],
      workMode: [],
      location: '',
      skills: [],
      matchScore: '',
    });
    setSuggestedFilters(null);
  };

  const getTimePosted = (date) => {
    const now = new Date();
    const postedDate = new Date(date);
    const diffMs = now - postedDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postedDate.toLocaleDateString();
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem', color: '#2563eb' }}>🔍 Job Feed</h1>

      {/* Application Confirmation Popup */}
      {pendingApplication && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>
              📋 Application Status
            </h3>
            <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
              Did you apply to <strong>{pendingApplication.title}</strong> at <strong>{pendingApplication.company}</strong>?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => confirmApplication('yes')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                ✅ Yes, I Applied
              </button>
              <button
                onClick={() => confirmApplication('no')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                👀 No, Just Browsing
              </button>
              <button
                onClick={() => confirmApplication('already')}
                className="btn btn-secondary"
                style={{ width: '100%', backgroundColor: '#fef3c7', color: '#92400e', border: 'none' }}
              >
                📝 Applied Earlier
              </button>
            </div>
          </div>
        </div>
      )}

      {suggestedFilters && (
        <div style={{ backgroundColor: '#dbeafe', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', color: '#1e40af' }}>
          <p style={{ marginBottom: '0.5rem' }}>💡 AI Suggestion applied! Showing results based on your preferences.</p>
        </div>
      )}

      {/* Best Matches Section */}
      {bestMatches.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏆 Best Matches For You
            <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#667' }}>
              ({bestMatches.length} high-scoring jobs)
            </span>
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {bestMatches.map(job => (
              <div
                key={`best-${job._id || job.externalId}`}
                className="job-card"
                style={{
                  borderLeft: '4px solid #10b981',
                  backgroundColor: '#f0fdf4'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="job-title" style={{ fontSize: '1rem' }}>{job.title}</div>
                    <div className="job-company">{job.company}</div>
                  </div>
                  {getScoreBadge(job.matchScore)}
                </div>
                <div className="job-location" style={{ marginTop: '0.5rem' }}>📍 {job.location}</div>
                {job.matchExplanation && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#047857' }}>
                    {job.matchExplanation}
                  </div>
                )}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleApply(job)}
                    disabled={appliedJobs.has(job._id || job.externalId)}
                    className="btn btn-primary btn-small"
                    style={{ opacity: appliedJobs.has(job._id || job.externalId) ? 0.7 : 1, flex: 1 }}
                  >
                    {appliedJobs.has(job._id || job.externalId) ? '✅ Applied' : '✨ Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      <div className="filters">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#333' }}>📋 Filters</h2>

        {/* Search and Location Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="filter-group">
            <label>🔎 Job Title / Role</label>
            <input
              type="text"
              placeholder="e.g., React Developer, Python Engineer"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>📍 Location</label>
            <input
              type="text"
              placeholder="e.g., London, Manchester, Remote"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>📅 Date Posted</label>
            <select
              value={filters.datePosted}
              onChange={(e) => handleFilterChange('datePosted', e.target.value)}
            >
              <option value="all">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </div>

          <div className="filter-group">
            <label>⭐ Match Score</label>
            <select
              value={filters.matchScore}
              onChange={(e) => handleFilterChange('matchScore', e.target.value)}
            >
              <option value="">All</option>
              <option value="high">High ({'>'}70%)</option>
              <option value="medium">Medium (40-70%)</option>
            </select>
          </div>
        </div>

        {/* Job Type Filter */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>💼 Job Type</label>
          <div className="filter-options">
            {['Full-time', 'Part-time', 'Contract', 'Internship'].map(type => (
              <div key={type} className="checkbox-group">
                <input
                  type="checkbox"
                  id={`jobtype-${type}`}
                  checked={filters.jobType.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...filters.jobType, type]
                      : filters.jobType.filter(t => t !== type);
                    handleFilterChange('jobType', newTypes);
                  }}
                />
                <label htmlFor={`jobtype-${type}`} style={{ margin: 0 }}>{type}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Work Mode Filter */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>🏢 Work Mode</label>
          <div className="filter-options">
            {['Remote', 'Hybrid', 'On-site'].map(mode => (
              <div key={mode} className="checkbox-group">
                <input
                  type="checkbox"
                  id={`workmode-${mode}`}
                  checked={filters.workMode.includes(mode)}
                  onChange={(e) => {
                    const newModes = e.target.checked
                      ? [...filters.workMode, mode]
                      : filters.workMode.filter(m => m !== mode);
                    handleFilterChange('workMode', newModes);
                  }}
                />
                <label htmlFor={`workmode-${mode}`} style={{ margin: 0 }}>{mode}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Filter */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>💡 Skills (Select to filter)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {filterOptions && filterOptions.skills && filterOptions.skills.slice(0, 12).map(skill => (
              <button
                key={skill}
                onClick={() => {
                  const newSkills = filters.skills.includes(skill)
                    ? filters.skills.filter(s => s !== skill)
                    : [...filters.skills, skill];
                  handleFilterChange('skills', newSkills);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  border: `2px solid ${filters.skills.includes(skill) ? '#2563eb' : '#e5e7eb'}`,
                  backgroundColor: filters.skills.includes(skill) ? '#2563eb' : 'white',
                  color: filters.skills.includes(skill) ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!filters.skills.includes(skill)) {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.backgroundColor = '#dbeafe';
                  }
                }}
                onMouseLeave={e => {
                  if (!filters.skills.includes(skill)) {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                {skill}
              </button>
            ))}
          </div>
          {filters.skills.length > 0 && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#667' }}>
              Selected: {filters.skills.join(', ')}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={applyFilters} className="btn btn-primary">
            🔍 Apply Filters ({jobs.length} jobs)
          </button>
          <button onClick={clearFilters} className="btn btn-secondary">
            🔄 Clear Filters
          </button>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#667' }}>Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#667' }}>
          <p style={{ fontSize: '1.1rem' }}>😔 No jobs found matching your filters.</p>
          <p style={{ marginTop: '0.5rem' }}>Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: '1.5rem', color: '#667', fontSize: '0.95rem' }}>
            Showing <strong>{jobs.length}</strong> job{jobs.length !== 1 ? 's' : ''}
          </p>
          {jobs.map(job => (
            <div key={job._id || job.externalId} className="job-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div className="job-title">{job.title}</div>
                  <div className="job-company">{job.company}</div>
                  <div className="job-location">📍 {job.location}</div>
                  <div style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Posted {getTimePosted(job.postedDate)}
                  </div>
                </div>
                {job.matchScore !== undefined && getScoreBadge(job.matchScore)}
              </div>

              <div className="job-meta">
                {job.jobType && <span className="tag tag-primary">💼 {job.jobType}</span>}
                {job.workMode && <span className="tag">🏢 {job.workMode}</span>}
                {job.salary && <span className="tag">💰 {job.salary}</span>}
              </div>

              {job.skills && job.skills.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#333' }}>
                    Required Skills:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {job.skills.slice(0, 5).map(skill => (
                      <span key={skill} className="tag" style={{ fontSize: '0.8rem' }}>
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="tag" style={{ fontSize: '0.8rem' }}>
                        +{job.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <p style={{ color: '#667', marginBottom: '1rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                {job.description?.substring(0, 250)}...
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleApply(job)}
                  disabled={appliedJobs.has(job._id || job.externalId)}
                  className="btn btn-primary"
                  style={{ opacity: appliedJobs.has(job._id || job.externalId) ? 0.7 : 1 }}
                >
                  {appliedJobs.has(job._id || job.externalId) ? '✅ Applied' : '✨ Apply Now'}
                </button>
                <a
                  href={job.url || job.redirectUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  🔗 View on Site
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobFeed;
