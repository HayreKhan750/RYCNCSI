import React from 'react';

export default function AuthInput({ label, type = 'text', value, onChange, required, ...props }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="auth-input-group">
      <input
        className="auth-input"
        type={inputType}
        placeholder=" "
        value={value}
        onChange={onChange}
        required={required}
        style={isPassword ? { paddingRight: 40 } : {}}
        {...props}
      />
      <label className="auth-label">{label}</label>
      
      {isPassword && (
        <span 
          className="auth-toggle-password"
          onClick={() => setShowPassword(!showPassword)}
          title={showPassword ? "Hide Password" : "Show Password"}
        >
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </span>
      )}
    </div>
  );
}
