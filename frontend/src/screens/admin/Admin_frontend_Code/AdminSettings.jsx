import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  fetchAdminSettings,
  updateAdminSettings,
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

const SHIPPING_OPTIONS = [
  '3-5 business days',
  '5-7 business days',
  '24-48 hours',
];

const ToggleSwitch = ({ checked, onChange, disabled, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    style={{
      width: '44px',
      height: '24px',
      borderRadius: '9999px',
      backgroundColor: checked ? '#2563EB' : '#CBD5E1',
      border: 'none',
      padding: '2px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative',
      transition: 'background-color 0.2s ease',
      flexShrink: 0,
    }}
  >
    <span
      style={{
        display: 'block',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s ease',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.2)',
      }}
    />
  </button>
);

const AdminSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [formState, setFormState] = useState({
    currency: 'USD',
    default_shipping_estimate: '3-5 business days',
    supplier_approval_required: true,
    product_moderation: false,
    rul_thresholds: {
      prioritize_at_or_below: 20,
      prepare_at_or_below: 40,
      monitor_at_or_below: 80,
      normal_above: 80,
    },
    demo_payment_mode: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminSettings();
      const data = response?.data || response || {};

      setFormState({
        currency: data.currency || 'USD',
        default_shipping_estimate:
          data.default_shipping_estimate || '3-5 business days',
        supplier_approval_required:
          typeof data.supplier_approval_required === 'boolean'
            ? data.supplier_approval_required
            : true,
        product_moderation:
          typeof data.product_moderation === 'boolean'
            ? data.product_moderation
            : false,
        rul_thresholds: {
          prioritize_at_or_below:
            Number(data.rul_thresholds?.prioritize_at_or_below) || 20,
          prepare_at_or_below:
            Number(data.rul_thresholds?.prepare_at_or_below) || 40,
          monitor_at_or_below:
            Number(data.rul_thresholds?.monitor_at_or_below) || 80,
          normal_above: Number(data.rul_thresholds?.normal_above) || 80,
        },
        demo_payment_mode:
          typeof data.demo_payment_mode === 'boolean'
            ? data.demo_payment_mode
            : true,
      });
    } catch (err) {
      setError(err?.message || 'Unable to load system settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleThresholdChange = (field, rawValue) => {
    setSaveMessage(null);
    setError(null);
    const parsed = rawValue === '' ? '' : Number(rawValue);

    setFormState((prev) => {
      const nextThresholds = {
        ...prev.rul_thresholds,
        [field]: parsed,
      };
      if (field === 'monitor_at_or_below' && parsed !== '') {
        nextThresholds.normal_above = parsed;
      }
      return {
        ...prev,
        rul_thresholds: nextThresholds,
      };
    });
  };

  const handleSave = async () => {
    if (saving || loading) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    const pVal = Number(formState.rul_thresholds.prioritize_at_or_below);
    const prepVal = Number(formState.rul_thresholds.prepare_at_or_below);
    const monVal = Number(formState.rul_thresholds.monitor_at_or_below);
    const normVal = Number(formState.rul_thresholds.normal_above);

    if (
      !Number.isInteger(pVal) ||
      !Number.isInteger(prepVal) ||
      !Number.isInteger(monVal) ||
      !Number.isInteger(normVal) ||
      pVal <= 0 ||
      !(pVal < prepVal && prepVal < monVal) ||
      normVal !== monVal
    ) {
      setSaving(false);
      setError(
        'Invalid RUL thresholds: must be positive integers with Prioritize < Prepare < Monitor and Normal > equal to Monitor ≤.'
      );
      return;
    }

    try {
      const payload = {
        currency: formState.currency,
        default_shipping_estimate: formState.default_shipping_estimate,
        supplier_approval_required: Boolean(
          formState.supplier_approval_required
        ),
        product_moderation: Boolean(formState.product_moderation),
        rul_thresholds: {
          prioritize_at_or_below: pVal,
          prepare_at_or_below: prepVal,
          monitor_at_or_below: monVal,
          normal_above: normVal,
        },
        demo_payment_mode: Boolean(formState.demo_payment_mode),
      };

      const response = await updateAdminSettings(payload);
      const updated = response?.data || response || payload;

      setFormState({
        currency: updated.currency,
        default_shipping_estimate: updated.default_shipping_estimate,
        supplier_approval_required: updated.supplier_approval_required,
        product_moderation: updated.product_moderation,
        rul_thresholds: { ...updated.rul_thresholds },
        demo_payment_mode: updated.demo_payment_mode,
      });
      setSaveMessage('System settings saved.');
    } catch (err) {
      setError(err?.message || 'Unable to save system settings.');
    } finally {
      setSaving(false);
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
              item.path === '/admin/settings' ||
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
            <span className="current">System Settings</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <button
              type="button"
              className="btn-primary"
              disabled={loading || saving}
              onClick={handleSave}
              style={{
                padding: '7px 18px',
                fontSize: '13px',
                borderRadius: '6px',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

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
              <h1 className="admin-page-title">System Settings</h1>
              <span className="admin-page-subtitle">
                Marketplace &amp; RUL configuration
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="admin-card"
              style={{
                maxWidth: '760px',
                marginBottom: '16px',
                borderColor: '#FECACA',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Save Success Banner */}
          {saveMessage && (
            <div
              className="admin-card"
              style={{
                maxWidth: '760px',
                marginBottom: '16px',
                borderColor: '#BBF7D0',
                backgroundColor: '#F0FDF4',
                color: '#15803D',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              {saveMessage}
            </div>
          )}

          {loading ? (
            <div
              className="admin-card"
              style={{
                maxWidth: '760px',
                padding: '32px',
                textAlign: 'center',
                color: '#64748B',
              }}
            >
              Loading system settings...
            </div>
          ) : (
            <div
              style={{
                maxWidth: '760px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* 1. Currency */}
              <div
                className="admin-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0F172A',
                    }}
                  >
                    Currency
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748B',
                      marginTop: '2px',
                    }}
                  >
                    Marketplace display and checkout currency.
                  </div>
                </div>

                <select
                  aria-label="Currency"
                  value={formState.currency}
                  onChange={(e) => {
                    setSaveMessage(null);
                    setFormState((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }));
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#0F172A',
                    minWidth: '100px',
                  }}
                >
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* 2. Default shipping estimate */}
              <div
                className="admin-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0F172A',
                    }}
                  >
                    Default shipping estimate
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748B',
                      marginTop: '2px',
                    }}
                  >
                    Used when a seller has no custom shipping window.
                  </div>
                </div>

                <select
                  aria-label="Default shipping estimate"
                  value={formState.default_shipping_estimate}
                  onChange={(e) => {
                    setSaveMessage(null);
                    setFormState((prev) => ({
                      ...prev,
                      default_shipping_estimate: e.target.value,
                    }));
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#0F172A',
                    minWidth: '170px',
                  }}
                >
                  {SHIPPING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Supplier approval required */}
              <div
                className="admin-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0F172A',
                    }}
                  >
                    Supplier approval required
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748B',
                      marginTop: '2px',
                    }}
                  >
                    New suppliers remain Pending until approved by an admin.
                  </div>
                </div>

                <ToggleSwitch
                  ariaLabel="Supplier approval required"
                  checked={Boolean(formState.supplier_approval_required)}
                  disabled={saving}
                  onChange={(nextVal) => {
                    setSaveMessage(null);
                    setFormState((prev) => ({
                      ...prev,
                      supplier_approval_required: nextVal,
                    }));
                  }}
                />
              </div>

              {/* 4. Product moderation */}
              <div
                className="admin-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0F172A',
                    }}
                  >
                    Product moderation
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748B',
                      marginTop: '2px',
                    }}
                  >
                    Require admin review before new listings go live.
                  </div>
                </div>

                <ToggleSwitch
                  ariaLabel="Product moderation"
                  checked={Boolean(formState.product_moderation)}
                  disabled={saving}
                  onChange={(nextVal) => {
                    setSaveMessage(null);
                    setFormState((prev) => ({
                      ...prev,
                      product_moderation: nextVal,
                    }));
                  }}
                />
              </div>

              {/* 5. RUL urgency thresholds (cycles) */}
              <div className="admin-card" style={{ padding: '16px 20px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: '12px',
                  }}
                >
                  RUL urgency thresholds (cycles)
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        color: '#64748B',
                        marginBottom: '4px',
                      }}
                    >
                      Prioritize ≤
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formState.rul_thresholds.prioritize_at_or_below}
                      onChange={(e) =>
                        handleThresholdChange(
                          'prioritize_at_or_below',
                          e.target.value
                        )
                      }
                      style={{
                        width: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        color: '#64748B',
                        marginBottom: '4px',
                      }}
                    >
                      Prepare ≤
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formState.rul_thresholds.prepare_at_or_below}
                      onChange={(e) =>
                        handleThresholdChange(
                          'prepare_at_or_below',
                          e.target.value
                        )
                      }
                      style={{
                        width: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        color: '#64748B',
                        marginBottom: '4px',
                      }}
                    >
                      Monitor ≤
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formState.rul_thresholds.monitor_at_or_below}
                      onChange={(e) =>
                        handleThresholdChange(
                          'monitor_at_or_below',
                          e.target.value
                        )
                      }
                      style={{
                        width: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        color: '#64748B',
                        marginBottom: '4px',
                      }}
                    >
                      Normal &gt;
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formState.rul_thresholds.normal_above}
                      onChange={(e) =>
                        handleThresholdChange('normal_above', e.target.value)
                      }
                      style={{
                        width: '100%',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0F172A',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 6. Demo payment mode */}
              <div
                className="admin-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0F172A',
                    }}
                  >
                    Demo payment mode
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748B',
                      marginTop: '2px',
                    }}
                  >
                    Simulate checkout payments without external gateway.
                  </div>
                </div>

                <ToggleSwitch
                  ariaLabel="Demo payment mode"
                  checked={Boolean(formState.demo_payment_mode)}
                  disabled={saving}
                  onChange={(nextVal) => {
                    setSaveMessage(null);
                    setFormState((prev) => ({
                      ...prev,
                      demo_payment_mode: nextVal,
                    }));
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
