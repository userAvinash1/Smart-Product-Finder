import React, { useState } from 'react';
// import axios from 'axios';
import axios from "./api/axiosInstance";
import './Login.css';
// const API_BASE = process.env.REACT_APP_API_URL;

function Login({ onLoginSuccess }) {
  // const [isRegistering, setIsRegistering] = useState(false);
  

  const [name, setName] = useState('');   // Added

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [mode, setMode] = useState("login"); // login | register | forgot | otp | reset

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegistering = mode === "register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isRegistering ? '/auth/register' : '/auth/login';

    try {
      const response = await axios.post(endpoint,
        isRegistering
          ? {
              name,
              email,
              password
            }
          : {
              email,
              password
            }
      );

      if (isRegistering) {
        setMessage('Successfully registered! Redirecting...');

        // Automatically switch to Login page

        setTimeout(() => {
          // setIsRegistering(false);
          setMode("login");
          setMessage('');
          setName('');
          setEmail('');
          setPassword('');
        }, 1500);

        //setTimeout(() => navigate('/'), 1500); // redirect to homepage
      } else {
        setMessage('Login successful! Redirecting...');
        // localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Notify parent App that login is successful
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(response.data.user);
        }

      }
    } catch (error) {
      if (isRegistering) {
        if (error.response?.status === 409) {
          setMessage('❌ Email already exists. Try a different one.');
        } else {
          setMessage('❌ Registration failed. Please try again.');
        }
      }

       else {
          if (error.response?.status === 404) {
            setMessage('❌ No account found. Please register first.');
          } else if (error.response?.status === 401) {
            setMessage('❌ Incorrect password.');
          } else {
            setMessage('❌ Login failed. Please try again.');
          }
       }
    }
    finally {
        setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      setLoading(false);
      setMessage("❌ Please enter your email.");
      return;
    }

    try {
      await axios.post(
        "/auth/forgot-password",
        { email }
      );

      setMessage("✅ OTP sent successfully.");

      // Move to OTP screen
      setMode("otp");

    } catch (error) {

      if (error.response?.status === 404) {
        setMessage("❌ No account found with this email.");
      } else {
        setMessage("❌ Failed to send OTP.");
      }

    }
    finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "/auth/verify-otp",
        {
          email,
          otp
        }
      );

      setMessage("✅ " + response.data.message);

      // Move to Reset Password screen
      setMode("reset");

    } catch (error) {

      if (error.response?.status === 401) {
        setMessage("❌ Invalid OTP.");
      } else if (error.response?.status === 404) {
        setMessage("❌ OTP not found.");
      } else if (error.response?.status === 410) {
        setMessage("❌ OTP expired. Please request a new one.");
      } else {
        setMessage("❌ OTP verification failed.");
      }

    }
    finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {

      await axios.post(
        "/auth/reset-password",
        {
          email,
          password: newPassword
        }
      );

      setMessage("✅ Password reset successful.");

      // Return to Login after 2 seconds
      setTimeout(() => {

        setMode("login");

        setEmail("");
        setPassword("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage("");

      }, 2000);

    } catch (error) {

      if (error.response?.status === 403) {
        setMessage("❌ Please verify OTP first.");
      } else if (error.response?.status === 410) {
        setMessage("❌ OTP expired.");
      } else {
        setMessage("❌ Password reset failed.");
      }
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      
      <h2>
        {mode === "login" && "Login"}
        {mode === "register" && "Register"}
        {mode === "forgot" && "Forgot Password"}
        {mode === "otp" && "Verify OTP"}
        {mode === "reset" && "Reset Password"}
      </h2>

      
      <form
        onSubmit={
          mode === "forgot"
            ? handleSendOTP
            : mode === "otp"
            ? handleVerifyOTP
            : mode === "reset"
            ? handleResetPassword
            : handleSubmit
        }
      >
        {/* Register */}
        {mode === "register" && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {/* Email (Login/Register/Forgot/OTP) */}
        {(mode === "login" ||
          mode === "register" ||
          mode === "forgot" ||
          mode === "otp") && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        {/* Password (Login/Register) */}
        {(mode === "login" || mode === "register") && (
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "40px" }}
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "18px",
                color: "#555",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        )}

        {/* OTP */}
        {mode === "otp" && (
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            required
            onChange={(e) => setOtp(e.target.value)}
          />
        )}

        {/* Reset Password */}
        {mode === "reset" && (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              required
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </>
        )}

        <button
            type="submit"
            disabled={loading}
        >
          
          {loading
          ? (
              mode === "login" ? "Logging in..." :
              mode === "register" ? "Registering..." :
              mode === "forgot" ? "Sending OTP..." :
              mode === "otp" ? "Verifying..." :
              "Resetting..."
            )
          : (
            <>
              {mode === "login" && "Login"}
              {mode === "register" && "Register"}
              {mode === "forgot" && "Send OTP"}
              {mode === "otp" && "Verify OTP"}
              {mode === "reset" && "Reset Password"}
            </>
          )}
        </button>
      </form>

      {mode === "login" && (
        <p
          style={{
            color: "#007bff",
            cursor: "pointer",
            marginTop: "10px",
            marginBottom: "10px"
          }}
          onClick={() => {
            setMode("forgot");
            setMessage("");
            setPassword("");
          }}
        >
          Forgot Password?
        </p>
      )}

      {(mode === "login" || mode === "register") && (
        <p style={{ marginTop: '1rem' }}>
          {mode === "register"
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setMode(isRegistering ? "login" : "register");
              setMessage("");
              setName("");
              setEmail("");
              setPassword("");
              setOtp("");
              setNewPassword("");
              setConfirmPassword("");
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
            {mode === "register" ? "Login" : "Register"}
          </button>
        </p>
      )}

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