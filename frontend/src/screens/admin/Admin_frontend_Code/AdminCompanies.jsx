import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  fetchAdminCompanies,
  fetchAdminCompanyDetail,
} from '../../../services/adminService';
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

function formatSpend(amount, currency = 'USD') {
  const num = Number(amount);
  if (!Number.isFinite(num) || num === 0) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatCompanyTypeLabel(type) {
  const normalized = String(type || '').toUpperCase();
  if (normalized === 'AIRLINE') return 'Airline';
  if (normalized === 'MRO') return 'MRO';
  if (normalized === 'MIXED') return 'Airline / MRO';
  return type || '—';
}

function getTypeBadgeStyle(type) {
  const normalized = String(type || '').toUpperCase();
  if (normalized === 'MRO') {
    return {
      backgroundColor: '#EFF6FF',
      color: '#1D4ED8',
      border: '1px solid #BFDBFE',
    };
  }
  return {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    border: '1px solid #BFDBFE',
  };
}

function formatStatusLabel(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE') return 'Active';
  if (normalized === 'PENDING') return 'Pending';
  if (normalized === 'SUSPENDED') return 'Suspended';
  return status || 'Pending';
}

function getStatusBadgeClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE') return 'admin-badge badge-green';
  if (normalized === 'SUSPENDED') return 'admin-badge badge-red';
  return 'admin-badge badge-yellow';
}

const AdminCompanies = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companyDetail, setCompanyDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const latestDetailRequestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminCompanies({
        search: debouncedSearch,
      });
      const payload = response?.data || response || {};
      const items = Array.isArray(payload.items) ? payload.items : [];
      setCompanies(items);
    } catch (err) {
      setError(err?.message || 'Unable to load buyer companies.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const loadCompanyDetailById = useCallback(async (companyId) => {
    if (!companyId) return;

    const requestId = latestDetailRequestRef.current + 1;
    latestDetailRequestRef.current = requestId;

    setSelectedCompanyId(String(companyId));
    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await fetchAdminCompanyDetail(companyId);
      if (latestDetailRequestRef.current !== requestId) return;

      const payload = response?.data || response || null;
      setCompanyDetail(payload);
    } catch (err) {
      if (latestDetailRequestRef.current !== requestId) return;
      setCompanyDetail(null);
      setDetailError(err?.message || 'Unable to load company detail.');
    } finally {
      if (latestDetailRequestRef.current === requestId) {
        setDetailLoading(false);
      }
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    latestDetailRequestRef.current += 1;
    setSelectedCompanyId(null);
    setCompanyDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCloseDetail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompanyId, handleCloseDetail]);

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
              item.path === '/admin/companies' ||
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
            <span className="current">Companies / Buyers</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <input
              type="text"
              className="admin-search"
              placeholder="Search company or tax ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search company or tax ID"
              style={{ width: '320px' }}
            />

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
              <h1 className="admin-page-title">Companies / Buyers</h1>
              <span className="admin-page-subtitle">Buyer organizations</span>
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
                onClick={loadCompanies}
              >
                Retry
              </button>
            </div>
          )}

          {/* Companies Table */}
          <div className="admin-card" style={{ padding: 0 }}>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>COMPANY</th>
                    <th style={{ width: '13%' }}>TYPE</th>
                    <th style={{ width: '16%' }}>TAX ID</th>
                    <th style={{ width: '11%' }}>ENGINES</th>
                    <th style={{ width: '13%' }}>SPEND</th>
                    <th style={{ width: '11%' }}>STATUS</th>
                    <th style={{ width: '8%', textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: 'center',
                          padding: '36px 16px',
                          color: '#64748B',
                        }}
                      >
                        Loading buyer organizations...
                      </td>
                    </tr>
                  ) : companies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: 'center',
                          padding: '36px 16px',
                          color: '#64748B',
                        }}
                      >
                        No buyer companies match the current search filter.
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company.company_id}>
                        <td style={{ fontWeight: 600, color: '#0F172A' }}>
                          {company.company_name || '—'}
                        </td>
                        <td>
                          <span
                            className="admin-badge"
                            style={getTypeBadgeStyle(company.company_type)}
                          >
                            {formatCompanyTypeLabel(company.company_type)}
                          </span>
                        </td>
                        <td style={{ color: '#334155' }}>
                          {company.tax_id || '—'}
                        </td>
                        <td style={{ color: '#0F172A' }}>
                          {Number(company.engine_count) || 0}
                        </td>
                        <td style={{ fontWeight: 500, color: '#0F172A' }}>
                          {formatSpend(company.spend, company.currency)}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(company.status)}>
                            {formatStatusLabel(company.status)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() =>
                              loadCompanyDetailById(company.company_id)
                            }
                          >
                            View
                          </button>
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

      {/* Company Detail Modal (Read-Only) */}
      {selectedCompanyId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-company-detail-title"
          onClick={handleCloseDetail}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
        >
          <div
            className="admin-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '780px',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.18)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid #E2E8F0',
                paddingBottom: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <h2
                    id="admin-company-detail-title"
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#0F172A',
                    }}
                  >
                    {companyDetail?.company_name ||
                      `Company #${selectedCompanyId}`}
                  </h2>
                  {companyDetail?.status && (
                    <span className={getStatusBadgeClass(companyDetail.status)}>
                      {formatStatusLabel(companyDetail.status)}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#64748B',
                    marginTop: '4px',
                  }}
                >
                  Read-only organization profile · Company ID #
                  {companyDetail?.company_id || selectedCompanyId}
                </div>
              </div>

              <button
                type="button"
                className="btn-outline"
                onClick={handleCloseDetail}
              >
                Close
              </button>
            </div>

            {detailLoading ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#64748B',
                }}
              >
                Loading company details...
              </div>
            ) : detailError ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#DC2626', fontSize: '13px' }}>
                  {detailError}
                </span>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => loadCompanyDetailById(selectedCompanyId)}
                >
                  Retry
                </button>
              </div>
            ) : companyDetail ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {/* Summary Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '12px',
                    backgroundColor: '#F8FAFC',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Organization Type
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        marginTop: '4px',
                      }}
                    >
                      {formatCompanyTypeLabel(companyDetail.company_type)}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Tax ID
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        marginTop: '4px',
                      }}
                    >
                      {companyDetail.tax_id || '—'}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Country Code
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        marginTop: '4px',
                      }}
                    >
                      {companyDetail.country_code || '—'}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Registered Engines
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        marginTop: '4px',
                      }}
                    >
                      {Number(companyDetail.engine_count) || 0}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Total Spend
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0F172A',
                        marginTop: '4px',
                      }}
                    >
                      {formatSpend(companyDetail.spend, companyDetail.currency)}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Registered Date
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#0F172A',
                        marginTop: '4px',
                      }}
                    >
                      {formatDateTime(companyDetail.created_at)}
                    </div>
                  </div>
                </div>

                {/* Company Users */}
                <div>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '8px',
                    }}
                  >
                    Organization Users ({companyDetail.users?.length || 0})
                  </h3>
                  <div
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>NAME</th>
                          <th>EMAIL</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!companyDetail.users ||
                        companyDetail.users.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              style={{
                                textAlign: 'center',
                                color: '#64748B',
                                padding: '16px',
                              }}
                            >
                              No user accounts assigned to this company yet.
                            </td>
                          </tr>
                        ) : (
                          companyDetail.users.map((u) => (
                            <tr key={u.user_id}>
                              <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                              <td style={{ color: '#64748B' }}>{u.email}</td>
                              <td>
                                <span
                                  className={getStatusBadgeClass(u.status)}
                                >
                                  {u.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fleet Engines */}
                <div>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '8px',
                    }}
                  >
                    Fleet Engines ({companyDetail.engines?.length || 0})
                  </h3>
                  <div
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ENGINE CODE</th>
                          <th>SERIAL NUMBER</th>
                          <th>AIRCRAFT</th>
                          <th>POSITION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!companyDetail.engines ||
                        companyDetail.engines.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                textAlign: 'center',
                                color: '#64748B',
                                padding: '16px',
                              }}
                            >
                              No engines registered for this organization.
                            </td>
                          </tr>
                        ) : (
                          companyDetail.engines.map((eng) => (
                            <tr key={eng.engine_id}>
                              <td style={{ fontWeight: 600 }}>
                                {eng.engine_code}
                              </td>
                              <td>{eng.serial_number || '—'}</td>
                              <td>
                                {eng.tail_number
                                  ? `${eng.tail_number} (${eng.model_code || ''})`
                                  : '—'}
                              </td>
                              <td>{eng.position || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Orders */}
                <div>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0F172A',
                      marginBottom: '8px',
                    }}
                  >
                    Recent Orders ({companyDetail.recent_orders?.length || 0})
                  </h3>
                  <div
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ORDER</th>
                          <th>DATE</th>
                          <th>AMOUNT</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!companyDetail.recent_orders ||
                        companyDetail.recent_orders.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                textAlign: 'center',
                                color: '#64748B',
                                padding: '16px',
                              }}
                            >
                              No orders placed by this organization yet.
                            </td>
                          </tr>
                        ) : (
                          companyDetail.recent_orders.map((ord) => (
                            <tr key={ord.order_id}>
                              <td style={{ fontWeight: 600 }}>
                                {ord.order_number}
                              </td>
                              <td>{formatDateTime(ord.created_at)}</td>
                              <td>
                                {formatSpend(ord.total_amount, ord.currency)}
                              </td>
                              <td>
                                <span className="admin-badge badge-blue">
                                  {ord.status}
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
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompanies;
