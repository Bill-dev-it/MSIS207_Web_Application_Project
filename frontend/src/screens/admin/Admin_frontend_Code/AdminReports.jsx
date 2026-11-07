import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  fetchAdminReports,
  hideAdminReport,
  dismissAdminReport,
} from '../../../services/adminService';
import { useAuth } from '../../../hooks/useAuth';
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

const STATUS_TABS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'ALL', label: 'All' },
];

function getTypeBadgeClass(type) {
  const normalized = String(type || '').toUpperCase();
  if (normalized === 'SELLER') return 'admin-badge badge-yellow';
  return 'admin-badge badge-blue';
}

function getStatusBadgeClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'RESOLVED') return 'admin-badge badge-green';
  return 'admin-badge badge-yellow';
}

function formatStatusLabel(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'RESOLVED') return 'Resolved';
  return 'Open';
}

const AdminReports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({
    OPEN: 0,
    RESOLVED: 0,
    ALL: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInFlightId, setActionInFlightId] = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminReports({ status: statusFilter });
      const payload = response?.data || response || {};
      const items = Array.isArray(payload.items) ? payload.items : [];
      const nextCounts = payload.counts || {};

      setReports(items);
      setCounts({
        OPEN: Number(nextCounts.OPEN) || 0,
        RESOLVED: Number(nextCounts.RESOLVED) || 0,
        ALL: Number(nextCounts.ALL) || 0,
      });
    } catch (err) {
      setError(err?.message || 'Unable to load reviews and reports.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleHide = async (reportId) => {
    if (!reportId || actionInFlightId) return;
    setActionInFlightId(String(reportId));
    setError(null);

    try {
      await hideAdminReport(reportId);
      await loadReports();
    } catch (err) {
      setError(err?.message || 'Failed to hide review.');
    } finally {
      setActionInFlightId(null);
    }
  };

  const handleDismiss = async (reportId) => {
    if (!reportId || actionInFlightId) return;
    setActionInFlightId(String(reportId));
    setError(null);

    try {
      await dismissAdminReport(reportId);
      await loadReports();
    } catch (err) {
      setError(err?.message || 'Failed to dismiss report.');
    } finally {
      setActionInFlightId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand">AeroRUL Admin</div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/admin/reports' ||
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
            <span className="current">Reviews / Reports</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {/* Status Filter Pills */}
            <div className="filter-pills">
              {STATUS_TABS.map((tab) => {
                const isActive = statusFilter === tab.key;
                const countValue = counts[tab.key] ?? 0;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`filter-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setStatusFilter(tab.key)}
                  >
                    {tab.label} {countValue}
                  </button>
                );
              })}
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
              <h1 className="admin-page-title">Reviews / Reports</h1>
              <span className="admin-page-subtitle">Moderation queue</span>
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
                onClick={loadReports}
              >
                Retry
              </button>
            </div>
          )}

          {/* Moderation Queue Table */}
          <div className="admin-card" style={{ padding: 0 }}>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>TYPE</th>
                    <th style={{ width: '22%' }}>TARGET</th>
                    <th style={{ width: '26%' }}>REASON</th>
                    <th style={{ width: '18%' }}>REPORTED BY</th>
                    <th style={{ width: '11%' }}>STATUS</th>
                    <th style={{ width: '11%', textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: 'center',
                          padding: '36px 16px',
                          color: '#64748B',
                        }}
                      >
                        Loading moderation queue...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: 'center',
                          padding: '36px 16px',
                          color: '#64748B',
                        }}
                      >
                        No reviews or reports found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => {
                      const isResolved =
                        String(report.status || '').toUpperCase() ===
                        'RESOLVED';
                      const isBusy =
                        actionInFlightId === String(report.id);

                      return (
                        <tr key={report.id}>
                          <td>
                            <span className={getTypeBadgeClass(report.type)}>
                              {report.type || 'Review'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#0F172A' }}>
                            {report.target || '—'}
                          </td>
                          <td style={{ color: '#334155' }}>
                            {report.reason || '—'}
                          </td>
                          <td style={{ color: '#334155' }}>
                            {report.reported_by || '—'}
                          </td>
                          <td>
                            <span
                              className={getStatusBadgeClass(report.status)}
                            >
                              {formatStatusLabel(report.status)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isResolved ? (
                              <span style={{ color: '#94A3B8' }}>—</span>
                            ) : (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  gap: '8px',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn-outline"
                                  disabled={isBusy}
                                  onClick={() => handleHide(report.id)}
                                >
                                  Hide
                                </button>
                                <button
                                  type="button"
                                  className="btn-outline"
                                  disabled={isBusy}
                                  onClick={() => handleDismiss(report.id)}
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
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

export default AdminReports;
