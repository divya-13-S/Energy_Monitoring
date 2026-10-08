import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Input from '../../components/common/Input/Input';
import Select from '../../components/common/Select/Select';
import Button from '../../components/common/Button/Button';
import { FiUserCheck, FiAlertCircle, FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(ROLES.ADMINISTRATOR);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axiosInstance.post('/auth/login', {
        email: email.trim(),
        password,
        role,
      });

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;
        login(userData, userData.token);
        
        const roleHome = userData.role === ROLES.HOD ? '/hod/dashboard'
          : userData.role === ROLES.ELECTRICIAN ? '/electrician/dashboard'
          : '/admin/dashboard';
        const from = location.state?.from?.pathname || roleHome;
        navigate(from, { replace: true });
        return;
      } else {
        setErrorMessage(response.data?.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      const apiMessage = err.response?.data?.message || err.message || 'Invalid email or password. Please try again.';
      setErrorMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (role === ROLES.ADMINISTRATOR) return 'Sign In as Administrator';
    if (role === ROLES.HOD) return 'Sign In as HOD';
    if (role === ROLES.ELECTRICIAN) return 'Sign In as Electrician';
    return 'Sign In';
  };

  return (
    <div className="login-card-content">
      <div className="login-header">
        <h2 className="login-title">Sign In to Smart Grid</h2>
        <p className="login-subtitle">
          Select your institutional role and enter your credentials
        </p>
      </div>

      {errorMessage && (
        <div className="login-error-alert" role="alert">
          <FiAlertCircle className="login-error-icon" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
        <Select
          label="Institutional Role"
          value={role}
          onChange={handleRoleChange}
          isDisabled={loading}
          options={[
            { label: 'Administrator', value: ROLES.ADMINISTRATOR },
            { label: 'Department Staff (HOD)', value: ROLES.HOD },
            { label: 'Electrician / Maintenance Staff', value: ROLES.ELECTRICIAN },
          ]}
        />

        <Input
          label="Institutional Email"
          type="email"
          name="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@institution.edu"
          icon={FiMail}
          isDisabled={loading}
          isRequired
          autoComplete="username"
        />

        <div className="password-input-container">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            icon={FiLock}
            isDisabled={loading}
            isRequired
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="password-toggle-btn"
          >
            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>

        <Button
          variant="primary"
          fullWidth
          type="submit"
          isLoading={loading}
          isDisabled={loading}
          icon={FiUserCheck}
          className="login-submit-btn"
        >
          {getButtonText()}
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;
