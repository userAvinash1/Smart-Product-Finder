import React, { useState } from 'react';
import axios from 'axios';
//import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isRegistering ? '/auth/register' : '/auth/login';

    try {
      const response = await axios.post(`http://localhost:5000${endpoint}`, {
        email,
        password
      });

      if (isRegistering) {
        setMessage('✅ Successfully registered! Redirecting...');
        //setTimeout(() => navigate('/'), 1500); // redirect to homepage
      } else {
        setMessage('✅ Login successful! Redirecting...');
        localStorage.setItem('user', JSON.stringify(response.data));
        // 👉 Notify parent App that login is successful
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(response.data);
        }
        //setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      if (isRegistering) {
        if (error.response?.status === 409) {
          setMessage('❌ Email already exists. Try a different one.');
        } else {
          setMessage('❌ Registration failed. Please try again.');
        }
      } else {
        if (error.response?.status === 401) {
          setMessage('❌ No account found. Please register first.');
        } else {
          setMessage('❌ Login failed. Please try again.');
        }
      }
    }
  };

  return (
    <div className="login-container">
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ paddingRight: '40px' }}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#555'
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>

        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        {isRegistering ? 'Already have an account?' : "Don't have an account?"}
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setMessage('');
          }}
          style={{
            marginLeft: '8px',
            padding: '4px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isRegistering ? 'Login' : 'Register'}
        </button>
      </p>

      {message && (
        <p
          style={{
            marginTop: '1rem',
            color: message.startsWith('✅') ? 'green' : 'crimson'
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default Login;
