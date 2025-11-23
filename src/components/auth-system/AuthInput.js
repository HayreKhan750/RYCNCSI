import React from 'react';

export default function AuthInput({ label, type = 'text', value, onChange, required, ...props }) {
  return (
    <div className="auth-input-group">
      <input
        className="auth-input"
        type={type}
        placeholder=" "
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
      <label className="auth-label">{label}</label>
    </div>
  );
}
