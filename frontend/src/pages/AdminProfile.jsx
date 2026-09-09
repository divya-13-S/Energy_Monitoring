import React, { useState, useEffect } from 'react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiKey,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiRotateCcw,
  FiLock,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiLayers,
  FiRefreshCw,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, changePassword } from '../services/profileService';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminProfile.css';

const AdminProfile = () => {
  const { user: authUser, login: updateAuthUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    building_name: '',
    department_name: '',
    status: 'Active',
    last_login: null,
    created_at: null,
  });

  const [personalForm, setPersonalForm] = useState({
    name: '',
    phone: '',
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      if (data) {
        setProfileData(data);
        setPersonalForm({
          name: data.name || '',
          phone: data.phone || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to retrieve profile information from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePwdChange = (e) => {
    const { name, value } = e.target;
    setPwdForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetPersonal = () => {
    setPersonalForm({
      name: profileData.name || '',
      phone: profileData.phone || '',
    });
    setSuccessMsg('Form reset to saved profile details.');
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updated = await updateProfile(personalForm);
      setProfileData(updated);
      setSuccessMsg('Personal profile details updated successfully.');

      // Update AuthContext & localStorage user details
      if (authUser) {
        const token = localStorage.getItem('energy_auth_token');
        updateAuthUser({ ...authUser, name: updated.name, phone: updated.phone }, token);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Failed to update personal profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (pwdForm.newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    setChangingPwd(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await changePassword(pwdForm);
      setSuccessMsg('Account password changed successfully.');
      setPwdForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('Error changing password:', err);
      setErrorMsg(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPwd(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="profile-container">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="profile-toast toast-success">
          <FiCheckCircle className="toast-icon" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="profile-toast toast-error">
          <FiAlertCircle className="toast-icon" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="profile-header">
        <div className="profile-header-title">
          <h1>
            <FiUser className="title-icon" /> Account Profile & Security
          </h1>
          <p>Manage your account credentials, contact information, and security preferences.</p>
        </div>
        <button
          className="btn-refresh-profile"
          onClick={loadUserProfile}
          disabled={loading}
          title="Reload profile from database"
        >
          <FiRefreshCw className={loading ? 'spin-icon' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="profile-loading-card">
          <div className="spinner"></div>
          <p>Loading account profile from MySQL database...</p>
        </div>
      ) : error ? (
        <ErrorState
          title={
            error.includes('401') || error.toLowerCase().includes('authorization') || error.toLowerCase().includes('token')
              ? 'Authentication Required'
              : 'Error Loading User Profile'
          }
          message={error}
          onRetry={loadUserProfile}
        />
      ) : (
        <div className="profile-content-grid">
          {/* Overview Hero Card */}
          <div className="profile-hero-card">
            <div className="hero-avatar">
              <span>{getInitials(profileData.name)}</span>
            </div>
            <div className="hero-info">
              <h2>{profileData.name}</h2>
              <p className="hero-email">
                <FiMail /> {profileData.email}
              </p>
              <div className="hero-badges">
                <span className="badge-role">{profileData.role || 'Administrator'}</span>
                <span className={`badge-status ${profileData.status === 'Active' ? 'active' : 'inactive'}`}>
                  {profileData.status || 'Active'} Account
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Account Scope & System Details (Read-Only) */}
          <div className="profile-card">
            <div className="card-header">
              <FiShield className="card-icon security" />
              <div>
                <h2>1. Role & Access Scope Information</h2>
                <p>System assigned role, facility scope, and account audit metadata (Read-Only)</p>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">
                    <FiShield className="icon-sm" /> System Role
                  </span>
                  <span className="info-value highlight">{profileData.role || 'Administrator'}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    <FiMapPin className="icon-sm" /> Building Scope
                  </span>
                  <span className="info-value">
                    {profileData.role === 'Administrator'
                      ? 'All Campus Facilities'
                      : profileData.building_name || 'Assigned Facility'}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    <FiLayers className="icon-sm" /> Department / Unit
                  </span>
                  <span className="info-value">
                    {profileData.role === 'Administrator'
                      ? 'Institutional Wide'
                      : profileData.department_name || 'Assigned Department'}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    <FiCheckCircle className="icon-sm" /> Account Status
                  </span>
                  <span className="info-value text-success">{profileData.status || 'Active'}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    <FiClock className="icon-sm" /> Last Login Timestamp
                  </span>
                  <span className="info-value">{formatDateTime(profileData.last_login)}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    <FiCalendar className="icon-sm" /> Account Created Date
                  </span>
                  <span className="info-value">{formatDateTime(profileData.created_at)}</span>
                </div>
              </div>
              <small className="help-text note-box">
                <FiLock className="icon-sm" /> Role assignments, facility scope, and account status can only be modified by a System Administrator via User Management.
              </small>
            </div>
          </div>

          {/* Section 2: Edit Personal Information */}
          <div className="profile-card">
            <div className="card-header">
              <FiUser className="card-icon personal" />
              <div>
                <h2>2. Edit Personal Details</h2>
                <p>Update your display name and contact details</p>
              </div>
            </div>
            <form onSubmit={handleSavePersonal} className="card-body">
              <div className="form-group">
                <label>Full Name *</label>
                <div className="input-icon-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={personalForm.name}
                    onChange={handlePersonalChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address (Account Username)</label>
                <div className="input-icon-wrapper read-only">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    readOnly
                  />
                </div>
                <small className="help-text">Email address serves as your system login identifier and is managed by Administration.</small>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-icon-wrapper">
                  <FiPhone className="input-icon" />
                  <input
                    type="text"
                    name="phone"
                    value={personalForm.phone}
                    onChange={handlePersonalChange}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>

              <div className="card-footer-buttons">
                <button
                  type="button"
                  className="btn-cancel-profile"
                  onClick={handleResetPersonal}
                  disabled={savingProfile}
                >
                  <FiRotateCcw />
                  <span>Reset</span>
                </button>
                <button type="submit" className="btn-save-profile" disabled={savingProfile}>
                  <FiSave />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: Change Password */}
          <div className="profile-card full-width">
            <div className="card-header">
              <FiKey className="card-icon key" />
              <div>
                <h2>3. Security & Password Management</h2>
                <p>Update your account authentication password securely</p>
              </div>
            </div>
            <form onSubmit={handleChangePassword} className="card-body">
              <div className="form-row">
                <div className="form-group third">
                  <label>Current Password *</label>
                  <div className="input-icon-wrapper">
                    <FiLock className="input-icon" />
                    <input
                      type="password"
                      name="currentPassword"
                      value={pwdForm.currentPassword}
                      onChange={handlePwdChange}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                </div>

                <div className="form-group third">
                  <label>New Password *</label>
                  <div className="input-icon-wrapper">
                    <FiKey className="input-icon" />
                    <input
                      type="password"
                      name="newPassword"
                      value={pwdForm.newPassword}
                      onChange={handlePwdChange}
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                </div>

                <div className="form-group third">
                  <label>Confirm New Password *</label>
                  <div className="input-icon-wrapper">
                    <FiKey className="input-icon" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={pwdForm.confirmPassword}
                      onChange={handlePwdChange}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="card-footer-buttons">
                <button type="submit" className="btn-save-profile btn-key" disabled={changingPwd}>
                  <FiKey />
                  <span>{changingPwd ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
