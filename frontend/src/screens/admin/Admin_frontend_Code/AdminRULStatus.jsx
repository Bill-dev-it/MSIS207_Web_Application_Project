import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchRULSystemStatus } from '../../../services/adminService';
import { useAuth } from '../../../auth/AuthContext';
import './AdminStyles.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Suppliers', path: '/admin/suppliers' },
  { label: 'Companies / Buyers', path: '/admin/companies' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Orders', path: '/admin/orders' },
  { label: 'Reviews / Reports', path: '/admin/reports' },
  { label: 'RUL System Status', path: '/admin/rul-status' },
  { label: 'System Settings', path: '/admin/settings' },
];

function getUrgencyBarColor(urgency) {
  const normalized = String(urgency || '').toUpperCase();
  if (normalized === 'NORMAL') return '#16A34A';
  if (normalized === 'MONITOR') return '#2563EB';
  if (normalized === 'PREPARE') return '#D97706';
  if (normalized === 'PRIORITIZE') return '#DC2626';
  return '#64748B';
}

function getUrgencyBadgeClass(urgency) {
  const normalized = String(urgency || '').toUpperCase();
  if (normalized === 'NORMAL') return 'admin-badge badge-green';
  if (normalized === 'MONITOR') return 'admin-badge badge-blue';
  if (normalized === 'PREPARE') return 'admin-badge badge-yellow';
  if (normalized === 'PRIORITIZE') return 'admin-badge badge-red';
  return 'admin-badge';
}

function getResultBadgeClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'SUCCEEDED' || normalized === 'OK') {
    return 'admin-badge badge-green';
  }
  if (normalized === 'FAILED') {
    return 'admin-badge badge-red';
  }
  return 'admin-badge badge-yellow';
}

const AdminRULStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRulStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchRULSystemStatus();
      const payload = response?.data || response || null;
      setStatusData(payload);
    } catch (err) {
      setError(err?.message || 'Unable to load RUL system status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRulStatus();
  }, [loadRulStatus]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const volumeSeries = Array.isArray(statusData?.prediction_volume_14d)
    ? statusData.prediction_volume_14d
    : [];
  const maxDailyVolume = Math.max(
    ...volumeSeries.map((d) => Number(d.count) || 0),
    1
  );

  const urgencyList = Array.isArray(statusData?.urgency_distribution)
    ? statusData.urgency_distribution
    : [
        { urgency: 'NORMAL', label: 'Normal', count: 0 },
        { urgency: 'MONITOR', label: 'Monitor', count: 0 },
        { urgency: 'PREPARE', label: 'Prepare', count: 0 },
        { urgency: 'PRIORITIZE', label: 'Prioritize', count: 0 },
      ];
  const maxUrgencyCount = Math.max(
    ...urgencyList.map((u) => Number(u.count) || 0),
    1
  );

  const recentPredictions = Array.isArray(statusData?.recent_predictions)
    ? statusData.recent_predictions
    : [];

  const failedCount7d = Number(statusData?.failed_runs_7d?.count) || 0;
  const serviceStatusText = statusData?.service?.status || 'Operational';
  const isOperational =
    String(serviceStatusText).toUpperCase() === 'OPERATIONAL';

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand">AeroRUL Admin</div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/admin/rul-status' ||
              location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-breadcrumbs">
            <span>Admin portal</span>
            <span>›</span>
            <span className="current">RUL System Status</span>
          </div>

          <div className="admin-user-controls">
            <div className="admin-role-pill">Role: Admin</div>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Body */}
        <div className="admin-content">
          <div
            style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
              <h1 className="admin-page-title">RUL System Status</h1>
              <span className="admin-page-subtitle">
                Model health and recent runs
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="admin-card"
              style={{
                marginBottom: '16px',
                borderColor: '#FECACA',
                backgroundColor: '#FEF2F2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ color: '#DC2626', fontSize: '13px', fontWeight: 500 }}>
                {error}
              </div>
              <button
                type="button"
                className="btn-outline"
                onClick={loadRulStatus}
              >
                Retry
              </button>
            </div>
          )}

          {/* Top 4 KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">SERVICE</div>
              <div
                className="kpi-value"
                style={{ color: isOperational ? '#16A34A' : '#D97706' }}
              >
                {loading ? '—' : serviceStatusText}
              </div>
              <div className="kpi-subtitle">
                {loading
                  ? 'Checking service...'
                  : statusData?.service?.last_check || 'Last check just now'}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">MODEL VERSION</div>
              <div className="kpi-value">
                {loading ? '—' : statusData?.model?.version || 'v1.0.0'}
              </div>
              <div className="kpi-subtitle">
                {loading
                  ? 'Loading model...'
                  : statusData?.model?.deployed_label || 'Deployed'}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">PREDICTIONS TODAY</div>
              <div className="kpi-value">
                {loading
                  ? '—'
                  : Number(statusData?.predictions_today?.count) || 0}
              </div>
              <div className="kpi-subtitle">
                {loading
                  ? 'Loading metrics...'
                  : statusData?.predictions_today?.subtitle || '0 total recorded'}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">FAILED RUNS (7D)</div>
              <div
                className="kpi-value"
                style={{ color: failedCount7d > 0 ? '#D97706' : '#0F172A' }}
              >
                {loading ? '—' : failedCount7d}
              </div>
              <div className="kpi-subtitle">
                {loading
                  ? 'Loading metrics...'
                  : statusData?.failed_runs_7d?.subtitle || '0% failure rate'}
              </div>
            </div>
          </div>

          {/* Middle Section: 14-Day Volume + Urgency Distribution */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            {/* Prediction volume (14 days) */}
            <div className="admin-card">
              <div className="admin-card-title">
                Prediction volume (14 days)
              </div>
              <div
                style={{
                  height: '180px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  marginTop: '16px',
                  padding: '20px 16px 12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                {loading ? (
                  <div
                    style={{
                      margin: 'auto',
                      color: '#94A3B8',
                      fontSize: '12px',
                    }}
                  >
                    Loading 14-day prediction volume...
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${Math.max(
                        volumeSeries.length,
                        14
                      )}, minmax(0, 1fr))`,
                      gap: '8px',
                      alignItems: 'end',
                      height: '100%',
                    }}
                  >
                    {volumeSeries.map((day) => {
                      const dayCount = Number(day.count) || 0;
                      const barHeightPct =
                        dayCount > 0
                          ? Math.max(
                              Math.round((dayCount / maxDailyVolume) * 100),
                              18
                            )
                          : 6;

                      return (
                        <div
                          key={day.date}
                          title={`${day.label}: ${dayCount} prediction(s)`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            height: '100%',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: dayCount > 0 ? '#1D4ED8' : 'transparent',
                            }}
                          >
                            {dayCount > 0 ? dayCount : '0'}
                          </span>
                          <div
                            style={{
                              width: '100%',
                              maxWidth: '22px',
                              height: `${barHeightPct}%`,
                              minHeight: dayCount > 0 ? '18px' : '4px',
                              backgroundColor:
                                dayCount > 0 ? '#2563EB' : '#E2E8F0',
                              borderRadius: '4px 4px 2px 2px',
                              transition: 'height 0.2s ease',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '9px',
                              color: '#64748B',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {String(day.label || '').split(' ')[1] || day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Urgency distribution (latest per engine) */}
            <div className="admin-card">
              <div className="admin-card-title">
                Urgency distribution (latest per engine)
              </div>
              <div
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {urgencyList.map((item) => {
                  const itemCount = Number(item.count) || 0;
                  const widthPercent =
                    itemCount > 0
                      ? Math.max(
                          Math.round((itemCount / maxUrgencyCount) * 100),
                          12
                        )
                      : 0;
                  const barColor = getUrgencyBarColor(item.urgency);

                  return (
                    <div
                      key={item.urgency}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '75px 1fr 30px',
                        alignItems: 'center',
                        fontSize: '12px',
                        gap: '12px',
                      }}
                    >
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>
                        {item.label}
                      </span>
                      <div
                        style={{
                          height: '12px',
                          backgroundColor: '#F1F5F9',
                          borderRadius: '6px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${widthPercent}%`,
                            height: '100%',
                            backgroundColor: barColor,
                            borderRadius: '6px',
                            transition: 'width 0.25s ease',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          textAlign: 'right',
                          color: '#0F172A',
                          fontWeight: 600,
                        }}
                      >
                        {itemCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Section: Recent prediction table */}
          <div className="admin-card" style={{ padding: 0 }}>
            <div style={{ padding: '20px 20px 0 20px' }}>
              <div className="admin-card-title" style={{ marginBottom: 0 }}>
                Recent prediction
              </div>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>TIME</th>
                    <th style={{ width: '16%' }}>ENGINE</th>
                    <th style={{ width: '26%' }}>COMPANY</th>
                    <th style={{ width: '16%' }}>RUL</th>
                    <th style={{ width: '16%' }}>URGENCY</th>
                    <th style={{ width: '14%' }}>RESULT</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: 'center',
                          padding: '32px 16px',
                          color: '#64748B',
                        }}
                      >
                        Loading recent predictions...
                      </td>
                    </tr>
                  ) : recentPredictions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: 'center',
                          padding: '32px 16px',
                          color: '#64748B',
                        }}
                      >
                        No RUL prediction runs recorded in the database yet.
                      </td>
                    </tr>
                  ) : (
                    recentPredictions.map((pred) => (
                      <tr key={pred.prediction_id}>
                        <td style={{ color: '#0F172A' }}>{pred.time || '—'}</td>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>
                          {pred.engine_code || '—'}
                        </td>
                        <td style={{ color: '#334155' }}>
                          {pred.company_name || '—'}
                        </td>
                        <td style={{ color: '#0F172A' }}>
                          {pred.rul_cycles || '—'}
                        </td>
                        <td>
                          {pred.urgency ? (
                            <span className={getUrgencyBadgeClass(pred.urgency)}>
                              {pred.urgency_label}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={getResultBadgeClass(pred.status)}>
                            {pred.result_label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminRULStatus;
