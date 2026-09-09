import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiFilter,
  FiX,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiEdit,
  FiTrash2,
  FiKey,
  FiUserCheck,
  FiUserX,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
} from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import {
  getUsers,
  getUserSummary,
  createUser,
  updateUser,
  toggleUserStatus,
  resetPassword,
} from '../services/userService';

import EmptyState from '../components/common/EmptyState/EmptyState';
import ErrorState from '../components/common/ErrorState/ErrorState';
import './AdminUsers.css';

// Institution Building and Department mappings matching MySQL database structure
const BUILDINGS_LIST = [
  { id: '1', name: 'IB Block', code: 'IB-BLOCK' },
  { id: '2', name: 'AS Block', code: 'AS-BLOCK' },
  { id: '3', name: 'Mechanical Block', code: 'MECH-BLOCK' },
  { id: '4', name: 'Sunflower Block', code: 'SUNFLOWER-BLOCK' },
  { id: '5', name: 'Research Park', code: 'RESEARCH-PARK' },
  { id: '6', name: 'Library', code: 'LIBRARY-BLOCK' },
  { id: '7', name: 'Girls Hostel', code: 'GH-BLOCK' },
  { id: '8', name: 'Boys Hostel', code: 'BH-BLOCK' },
];

const DEPARTMENTS_BY_BUILDING = {
  '1': [
    { id: '1', name: 'EEE Department', code: 'EEE' },
    { id: '2', name: 'ECE Department', code: 'ECE' },
  ],
  '2': [
    { id: '3', name: 'Textile Technology', code: 'TEXTILE' },
    { id: '4', name: 'Fashion Technology', code: 'FASHION' },
    { id: '5', name: 'Physics & Chemistry Labs', code: 'SCI-LABS' },
  ],
  '3': [
    { id: '6', name: 'Mechanical Workshop', code: 'MECH-SHOP' },
    { id: '7', name: 'Mechatronics Lab', code: 'MECHATRONICS' },
  ],
  '4': [
    { id: '8', name: 'Computer Science & Engg', code: 'CSE' },
    { id: '9', name: 'Information Technology', code: 'IT' },
    { id: '10', name: 'AI & Data Science', code: 'AIDS' },
  ],
  '5': [
    { id: '11', name: 'Incubation Center', code: 'INCUBATION' },
    { id: '12', name: 'Robotics Research Lab', code: 'ROBOTICS' },
    { id: '13', name: 'VLSI Design Center', code: 'VLSI' },
  ],
  '6': [
    { id: '14', name: 'Central Digital Library', code: 'DIGITAL-LIB' },
    { id: '15', name: 'Server & IT Center', code: 'DATA-CENTER' },
  ],
  '7': [
    { id: '16', name: 'Lotus Block', code: 'Lotus' },
    { id: '17', name: 'Jasmine Block', code: 'Jasmine' },
  ],
  '8': [
    { id: '18', name: 'Emerald Block', code: 'Emerald' },
    { id: '19', name: 'Sapphire Block', code: 'Sapphire' },
    { id: '20', name: 'Ruby Block', code: 'Ruby' },
  ],
};

const ALL_DEPARTMENTS = Object.values(DEPARTMENTS_BY_BUILDING).flat();

const ROLES_LIST = [
  'Administrator',
  'Department Staff (HOD)',
  'Electrician / Maintenance Staff',
];

const AdminUsers = () => {
  const { user: currentUser } = useAuth();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState({ total: 0, totalPages: 1, limit: 10, page: 1 });

  // Data & Loading State
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    admins: 0,
    hods: 0,
    electricians: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add / Edit Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Department Staff (HOD)',
    building_id: '',
    department_id: '',
    password: '',
    status: 'Active',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View Details Modal State
  const [selectedViewUser, setSelectedViewUser] = useState(null);

  // Password Reset Modal State
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);

  // Confirm Status Modal State
  const [confirmStatusUser, setConfirmStatusUser] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Available departments in filters dependent on building
  const filterDepartments =
    selectedBuilding === 'all'
      ? ALL_DEPARTMENTS
      : DEPARTMENTS_BY_BUILDING[selectedBuilding] || [];

  // Available departments in Add/Edit form dependent on selected building
  const formDepartments =
    userForm.building_id
      ? DEPARTMENTS_BY_BUILDING[userForm.building_id] || []
      : [];

  // Fetch Users & Summary
  const fetchUsersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        search: searchTerm,
        role: selectedRole,
        buildingId: selectedBuilding,
        departmentId: selectedDepartment,
        status: selectedStatus,
      };

      const [usersRes, summaryRes] = await Promise.all([
        getUsers(filters, { page: currentPage, limit: 10 }),
        getUserSummary(),
      ]);

      const fetchedUsers = usersRes.data || [];
      setUsers(fetchedUsers);

      const metaPagination = usersRes.meta?.pagination || usersRes.pagination || {
        total: fetchedUsers.length,
        page: currentPage,
        limit: 10,
        totalPages: 1,
      };
      setPaginationInfo(metaPagination);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to connect to MySQL database. Please verify backend server.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedRole, selectedBuilding, selectedDepartment, selectedStatus, currentPage]);

  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  // Open Add User Modal
  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'Department Staff (HOD)',
      building_id: '4', // Sunflower Block default for HOD
      department_id: '8', // CSE default
      password: '',
      status: 'Active',
    });
    setFormError('');
    setShowUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditModal = (u, e) => {
    if (e) e.stopPropagation();
    setEditingUserId(u.id);
    setUserForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      building_id: u.building_id ? String(u.building_id) : '',
      department_id: u.department_id ? String(u.department_id) : '',
      password: '',
      status: u.status,
    });
    setFormError('');
    setShowUserModal(true);
  };

  // Handle Form Role Change (clears building/dept for Administrator)
  const handleFormRoleChange = (e) => {
    const newRole = e.target.value;
    if (newRole === 'Administrator') {
      setUserForm(prev => ({ ...prev, role: newRole, building_id: '', department_id: '' }));
    } else if (newRole === 'Department Staff (HOD)') {
      setUserForm(prev => ({
        ...prev,
        role: newRole,
        building_id: prev.building_id || '4',
        department_id: prev.department_id || '8',
      }));
    } else {
      setUserForm(prev => ({ ...prev, role: newRole }));
    }
  };

  // Handle Form Building Change (resets department)
  const handleFormBuildingChange = (e) => {
    const bId = e.target.value;
    const depts = DEPARTMENTS_BY_BUILDING[bId] || [];
    setUserForm(prev => ({
      ...prev,
      building_id: bId,
      department_id: depts.length > 0 ? depts[0].id : '',
    }));
  };

  // Save User (Create or Edit)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!userForm.name || !userForm.email || !userForm.role) {
      setFormError('Name, email, and role are required fields.');
      return;
    }

    if (!editingUserId && !userForm.password) {
      setFormError('Password is required when creating a new user.');
      return;
    }

    if (userForm.role === 'Department Staff (HOD)' && (!userForm.building_id || !userForm.department_id)) {
      setFormError('Building and Department assignments are required for HOD role.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUserId) {
        await updateUser(editingUserId, userForm);
      } else {
        await createUser(userForm);
      }
      setShowUserModal(false);
      fetchUsersData();
    } catch (err) {
      console.error('Error saving user:', err);
      setFormError(err.message || 'Failed to save user account.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Toggle (Activate / Deactivate)
  const handleConfirmStatusToggle = async () => {
    if (!confirmStatusUser) return;
    setTogglingStatus(true);
    try {
      const newStatus = confirmStatusUser.status === 'Active' ? 'Inactive' : 'Active';
      await toggleUserStatus(confirmStatusUser.id, newStatus);
      setConfirmStatusUser(null);
      fetchUsersData();
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert(err.message || 'Failed to update account status.');
    } finally {
      setTogglingStatus(false);
    }
  };

  // Password Reset
  const handleExecuteResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    setResettingPwd(true);
    try {
      await resetPassword(resetPasswordUser.id, newPassword);
      alert(`Password for ${resetPasswordUser.name} has been reset successfully.`);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err) {
      console.error('Error resetting password:', err);
      alert(err.message || 'Failed to reset password.');
    } finally {
      setResettingPwd(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedBuilding('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  // Format Date
  const formatDateTime = (ts) => {
    if (!ts) return 'Never';
    const date = new Date(ts);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Role Badge Helper
  const getRoleBadgeClass = (role) => {
    if (role === 'Administrator') return 'role-pill admin';
    if (role === 'Department Staff (HOD)' || role === 'HOD') return 'role-pill hod';
    return 'role-pill electrician';
  };

  const startIndex = (paginationInfo.page - 1) * paginationInfo.limit + 1;
  const endIndex = Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total);

  return (
    <div className="users-container">
      {/* 1. Header Section */}
      <div className="users-header-section">
        <div className="users-title-row">
          <FiUsers className="users-header-icon" />
          <div>
            <h1 className="users-page-title">User Management</h1>
            <p className="users-page-subtitle">
              Manage system accounts, user roles, facility access scope, and account statuses across the campus.
            </p>
          </div>
        </div>

        <div className="users-header-actions">
          <button className="btn-add-user" onClick={handleOpenAddModal}>
            <FiUserPlus /> Add User
          </button>
          <button className="btn-header-action" onClick={fetchUsersData} title="Refresh Users List">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Cards Grid */}
      <div className="users-summary-grid">
        <div className="user-kpi-card total">
          <div className="kpi-icon-box total">
            <FiUsers />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.totalUsers.toLocaleString()}</span>
            <span className="kpi-title-text">Total System Users</span>
          </div>
        </div>

        <div className="user-kpi-card admin">
          <div className="kpi-icon-box admin">
            <FiShield />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.admins.toLocaleString()}</span>
            <span className="kpi-title-text">Administrators</span>
          </div>
        </div>

        <div className="user-kpi-card hod">
          <div className="kpi-icon-box hod">
            <FiUsers />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.hods.toLocaleString()}</span>
            <span className="kpi-title-text">HOD / Staff</span>
          </div>
        </div>

        <div className="user-kpi-card electrician">
          <div className="kpi-icon-box electrician">
            <FiUsers />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.electricians.toLocaleString()}</span>
            <span className="kpi-title-text">Electricians</span>
          </div>
        </div>

        <div className="user-kpi-card active">
          <div className="kpi-icon-box active">
            <FiCheckCircle />
          </div>
          <div className="kpi-content">
            <span className="kpi-number">{summary.activeUsers.toLocaleString()}</span>
            <span className="kpi-title-text">Active Accounts</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Section */}
      <div className="users-filter-card">
        <div className="filter-card-header">
          <h3>
            <FiFilter /> Account Search & Filters
          </h3>
        </div>

        <div className="filters-form-grid">
          <div className="filter-row">
            {/* Search Input */}
            <div className="filter-field">
              <label>Search Name / Email</label>
              <div className="search-input-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  className="filter-select filter-input-search"
                  placeholder="Search user by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="filter-field">
              <label>User Role</label>
              <select
                className="filter-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                {ROLES_LIST.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Building Filter */}
            <div className="filter-field">
              <label>Building Block</label>
              <select
                className="filter-select"
                value={selectedBuilding}
                onChange={(e) => {
                  setSelectedBuilding(e.target.value);
                  setSelectedDepartment('all');
                }}
              >
                <option value="all">All Buildings</option>
                {BUILDINGS_LIST.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="filter-field">
              <label>Department / Unit</label>
              <select
                className="filter-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {filterDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-field">
              <label>Account Status</label>
              <select
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="filter-buttons-row">
            <button className="btn-apply-filters" onClick={() => setCurrentPage(1)}>
              <FiFilter /> Apply Filters
            </button>
            <button className="btn-reset-filters" onClick={handleResetFilters}>
              <FiX /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* 4. Users Data Table Card */}
      <div className="users-table-card">
        <div className="users-table-header">
          <h3>
            <FiUsers /> System Accounts ({paginationInfo.total.toLocaleString()})
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <FiRefreshCw className="animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#2563eb' }} />
            <p style={{ fontWeight: 600 }}>Loading user accounts from MySQL database...</p>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsersData} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try changing your filters or search term."
          />
        ) : (
          <>
            <div className="table-responsive-wrapper">
              <table className="alerts-main-table">
                <thead>
                  <tr>
                    <th>User & Email</th>
                    <th>Role</th>
                    <th>Building Scope</th>
                    <th>Department / Unit</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedViewUser(u)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="col-user-info">
                          <span className="user-name-text">{u.name}</span>
                          <span className="user-email-sub">{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={getRoleBadgeClass(u.role)}>{u.role}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          {u.building_name || (u.role === 'Administrator' ? 'All Campus' : 'N/A')}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#475569' }}>
                          {u.department_name || (u.role === 'Administrator' ? 'Institution-wide' : 'N/A')}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${u.status === 'Active' ? 'user-active' : 'user-inactive'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="col-datetime">{formatDateTime(u.last_login)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="table-action-group">
                          <button
                            className="btn-table-action"
                            title="View Details"
                            onClick={() => setSelectedViewUser(u)}
                          >
                            <FiEye /> View
                          </button>

                          <button
                            className="btn-table-action edit"
                            title="Edit User"
                            onClick={(e) => handleOpenEditModal(u, e)}
                          >
                            <FiEdit /> Edit
                          </button>

                          <button
                            className={`btn-table-action ${u.status === 'Active' ? 'toggle' : 'activate'}`}
                            title={u.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                            onClick={() => setConfirmStatusUser(u)}
                          >
                            {u.status === 'Active' ? <FiUserX /> : <FiUserCheck />}
                            {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>

                          <button
                            className="btn-table-action key"
                            title="Reset Password"
                            onClick={() => setResetPasswordUser(u)}
                          >
                            <FiKey /> Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="alerts-pagination-bar">
              <span className="pagination-text">
                Showing {startIndex}–{endIndex} of {paginationInfo.total.toLocaleString()} users
              </span>
              <div className="pagination-buttons">
                <button
                  className="btn-pagination"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <FiChevronLeft /> Previous
                </button>
                <button
                  className="btn-pagination"
                  disabled={currentPage >= paginationInfo.totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, paginationInfo.totalPages))}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. Add / Edit User Modal */}
      {showUserModal && (
        <div className="alerts-modal-backdrop" onClick={() => setShowUserModal(false)}>
          <div className="alerts-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <h3>
                <FiUsers style={{ color: '#2563eb' }} />
                {editingUserId ? 'Edit User Account' : 'Add New User Account'}
              </h3>
              <button className="btn-close-modal" onClick={() => setShowUserModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="alerts-modal-body">
                {formError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}

                <div className="modal-grid-2col">
                  <div className="filter-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      className="filter-select"
                      required
                      placeholder="e.g. Dr. Alexander Pierce"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    />
                  </div>

                  <div className="filter-field">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="filter-select"
                      required
                      placeholder="e.g. a.pierce@institution.edu"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    />
                  </div>

                  <div className="filter-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="filter-select"
                      placeholder="e.g. +91 98765 43210"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="filter-field">
                    <label>User Role *</label>
                    <select
                      className="filter-select"
                      value={userForm.role}
                      onChange={handleFormRoleChange}
                    >
                      {ROLES_LIST.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Scope Assignment Section */}
                <div>
                  <div className="modal-section-title">FACILITY ACCESS SCOPE</div>

                  {userForm.role === 'Administrator' ? (
                    <div className="scope-disabled-hint">
                      Administrators have full campus-wide access scope across all buildings and departments.
                    </div>
                  ) : (
                    <div className="modal-grid-2col">
                      <div className="filter-field">
                        <label>Assigned Building *</label>
                        <select
                          className="filter-select"
                          value={userForm.building_id}
                          onChange={handleFormBuildingChange}
                          required={userForm.role === 'Department Staff (HOD)'}
                        >
                          <option value="">Select Building</option>
                          {BUILDINGS_LIST.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-field">
                        <label>Assigned Department / Unit *</label>
                        <select
                          className="filter-select"
                          value={userForm.department_id}
                          onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                          required={userForm.role === 'Department Staff (HOD)'}
                        >
                          <option value="">Select Department</option>
                          {formDepartments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Password & Account Status */}
                <div className="modal-grid-2col">
                  {!editingUserId && (
                    <div className="filter-field">
                      <label>Initial Password *</label>
                      <input
                        type="password"
                        className="filter-select"
                        required
                        placeholder="Minimum 6 characters"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="filter-field">
                    <label>Account Status</label>
                    <select
                      className="filter-select"
                      value={userForm.status}
                      onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="alerts-modal-footer">
                <button type="button" className="btn-reset-filters" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-apply-filters" disabled={submitting}>
                  {submitting ? 'Saving User...' : editingUserId ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View User Details Modal */}
      {selectedViewUser && (
        <div className="alerts-modal-backdrop" onClick={() => setSelectedViewUser(null)}>
          <div className="alerts-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <h3>
                <FiUsers style={{ color: '#2563eb' }} /> User Account Detail
              </h3>
              <button className="btn-close-modal" onClick={() => setSelectedViewUser(null)}>
                <FiX />
              </button>
            </div>

            <div className="alerts-modal-body">
              {/* SECTION 1: USER INFORMATION */}
              <div>
                <div className="modal-section-title">USER INFORMATION</div>
                <div className="modal-grid-2col">
                  <div className="modal-info-item">
                    <span className="info-item-label">Full Name</span>
                    <span className="info-item-value">{selectedViewUser.name}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Email Address</span>
                    <span className="info-item-value">{selectedViewUser.email}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Phone Number</span>
                    <span className="info-item-value">{selectedViewUser.phone || 'N/A'}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Assigned Role</span>
                    <span className="info-item-value">
                      <span className={getRoleBadgeClass(selectedViewUser.role)}>{selectedViewUser.role}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: ACCESS SCOPE */}
              <div>
                <div className="modal-section-title">ACCESS SCOPE</div>
                <div className="modal-grid-2col">
                  <div className="modal-info-item">
                    <span className="info-item-label">Building Scope</span>
                    <span className="info-item-value">{selectedViewUser.building_name || (selectedViewUser.role === 'Administrator' ? 'All Campus Buildings' : 'N/A')}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Department / Unit Scope</span>
                    <span className="info-item-value">{selectedViewUser.department_name || (selectedViewUser.role === 'Administrator' ? 'Institution-wide' : 'N/A')}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ACCOUNT LOGS */}
              <div>
                <div className="modal-section-title">ACCOUNT STATUS & ACTIVITY</div>
                <div className="modal-grid-2col">
                  <div className="modal-info-item">
                    <span className="info-item-label">Account Status</span>
                    <span className="info-item-value">
                      <span className={`status-pill ${selectedViewUser.status === 'Active' ? 'user-active' : 'user-inactive'}`}>
                        {selectedViewUser.status}
                      </span>
                    </span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Last Successful Login</span>
                    <span className="info-item-value">{formatDateTime(selectedViewUser.last_login)}</span>
                  </div>

                  <div className="modal-info-item">
                    <span className="info-item-label">Account Created</span>
                    <span className="info-item-value">{formatDateTime(selectedViewUser.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="alerts-modal-footer">
              <button className="btn-reset-filters" onClick={() => setSelectedViewUser(null)}>
                Close
              </button>
              <button className="btn-header-action" onClick={(e) => handleOpenEditModal(selectedViewUser, e)}>
                <FiEdit /> Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Reset Password Modal */}
      {resetPasswordUser && (
        <div className="alerts-modal-backdrop" onClick={() => setResetPasswordUser(null)}>
          <div className="alerts-modal-container" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <h3>
                <FiKey style={{ color: '#d97706' }} /> Reset Password
              </h3>
              <button className="btn-close-modal" onClick={() => setResetPasswordUser(null)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleExecuteResetPassword}>
              <div className="alerts-modal-body">
                <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
                  Reset password for user account <strong>{resetPasswordUser.name}</strong> (<code>{resetPasswordUser.email}</code>).
                </p>

                <div className="filter-field">
                  <label>New Password *</label>
                  <input
                    type="password"
                    className="filter-select"
                    required
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="alerts-modal-footer">
                <button type="button" className="btn-reset-filters" onClick={() => setResetPasswordUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-apply-filters" disabled={resettingPwd}>
                  {resettingPwd ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Deactivate / Activate Confirmation Modal */}
      {confirmStatusUser && (
        <div className="alerts-modal-backdrop" onClick={() => setConfirmStatusUser(null)}>
          <div className="alerts-modal-container" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="alerts-modal-header">
              <h3>
                {confirmStatusUser.status === 'Active' ? <FiUserX style={{ color: '#dc2626' }} /> : <FiUserCheck style={{ color: '#16a34a' }} />}
                {confirmStatusUser.status === 'Active' ? 'Deactivate User Account?' : 'Activate User Account?'}
              </h3>
              <button className="btn-close-modal" onClick={() => setConfirmStatusUser(null)}>
                <FiX />
              </button>
            </div>

            <div className="alerts-modal-body">
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0 }}>
                {confirmStatusUser.status === 'Active'
                  ? `Are you sure you want to deactivate the account for "${confirmStatusUser.name}"? The user will no longer be able to log in, but all historical records will remain intact.`
                  : `Are you sure you want to reactivate the account for "${confirmStatusUser.name}"? The user will be able to log in again.`}
              </p>
            </div>

            <div className="alerts-modal-footer">
              <button className="btn-reset-filters" onClick={() => setConfirmStatusUser(null)}>
                Cancel
              </button>
              <button
                className={confirmStatusUser.status === 'Active' ? 'btn-header-action' : 'btn-apply-filters'}
                style={confirmStatusUser.status === 'Active' ? { background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' } : {}}
                onClick={handleConfirmStatusToggle}
                disabled={togglingStatus}
              >
                {togglingStatus ? 'Updating Status...' : confirmStatusUser.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
