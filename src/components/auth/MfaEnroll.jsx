import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { multiFactor, PhoneAuthProvider, PhoneMultiFactorGenerator, RecaptchaVerifier, TotpMultiFactorGenerator } from 'firebase/auth';

export default function MfaEnroll() {
  const [mode, setMode] = useState('phone'); // 'phone' | 'totp'
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  // TOTP state
  const [totpSecret, setTotpSecret] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpLabel, setTotpLabel] = useState('Authenticator');
  const [totpGenerating, setTotpGenerating] = useState(false);
  const [totpEnrolling, setTotpEnrolling] = useState(false);

  const ensureRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'enroll-recaptcha', { size: 'invisible' });
    }
    return recaptchaRef.current;
  };

  const sendSms = async () => {
    setError('');
    setSuccess('');
    if (!auth.currentUser) {
      setError('You must be signed in to enroll MFA.');
      return;
    }
    if (!phone) {
      setError('Enter a phone number including country code, e.g. +251...');
      return;
    }
    setSending(true);
    try {
      const session = await multiFactor(auth.currentUser).getSession();
      const verifier = ensureRecaptcha();
      const provider = new PhoneAuthProvider(auth);
      const vid = await provider.verifyPhoneNumber({ phoneNumber: phone, session }, verifier);
      setVerificationId(vid);
    } catch (e) {
      setError(e.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const verifySms = async () => {
    setError('');
    setSuccess('');
    if (!auth.currentUser) {
      setError('You must be signed in to enroll MFA.');
      return;
    }
    if (!verificationId || code.length < 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setVerifying(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      await multiFactor(auth.currentUser).enroll(assertion, 'Phone');
      setSuccess('Phone number enrolled for 2FA.');
      setTimeout(() => navigate('/'), 800);
    } catch (e) {
      setError(e.message || 'Failed to verify and enroll phone');
    } finally {
      setVerifying(false);
    }
  };

  const generateTotp = async () => {
    setError('');
    setSuccess('');
    if (!auth.currentUser) {
      setError('You must be signed in to enroll MFA.');
      return;
    }
    setTotpGenerating(true);
    try {
      const session = await multiFactor(auth.currentUser).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      setTotpSecret(secret);
      try {
        const url = secret.generateQrCodeUrl(auth.currentUser.email || 'user', 'RateYourCNCS');
        setQrUrl(url);
      } catch (_) {
        setQrUrl('');
      }
    } catch (e) {
      setError(e.message || 'Failed to generate TOTP secret');
    } finally {
      setTotpGenerating(false);
    }
  };

  const enrollTotp = async () => {
    setError('');
    setSuccess('');
    if (!auth.currentUser) {
      setError('You must be signed in to enroll MFA.');
      return;
    }
    if (!totpSecret || !totpCode) {
      setError('Generate a secret and enter the 6-digit code from your app.');
      return;
    }
    setTotpEnrolling(true);
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, totpCode);
      await multiFactor(auth.currentUser).enroll(assertion, totpLabel || 'Authenticator');
      setSuccess('Authenticator app enrolled for 2FA.');
      setTimeout(() => navigate('/'), 800);
    } catch (e) {
      setError(e.message || 'Failed to verify TOTP code and enroll');
    } finally {
      setTotpEnrolling(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
      <h2>Set up Two‑Factor Authentication</h2>
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: '#137333', marginBottom: 8 }}>{success}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setMode('phone')} disabled={mode==='phone'}>Phone (SMS)</button>
        <button onClick={() => setMode('totp')} disabled={mode==='totp'}>Authenticator app (TOTP)</button>
      </div>

      {mode === 'phone' && (
        <div>
          <input
            placeholder="Phone number e.g. +2519..."
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
          <button onClick={sendSms} disabled={sending} style={{ width: '100%', padding: 10, marginTop: 8 }}>
            {sending ? 'Sending…' : 'Send code'}
          </button>

          {verificationId && (
            <div style={{ marginTop: 12 }}>
              <input
                placeholder="Enter 6‑digit code"
                value={code}
                onChange={(e)=>setCode(e.target.value)}
                style={{ width: '100%', padding: 8 }}
              />
              <button onClick={verifySms} disabled={verifying || code.length < 6} style={{ width: '100%', padding: 10, marginTop: 8 }}>
                {verifying ? 'Verifying…' : 'Verify & Enroll'}
              </button>
            </div>
          )}

          <div id="enroll-recaptcha" />
        </div>
      )}

      {mode === 'totp' && (
        <div style={{ marginTop: 8 }}>
          {!totpSecret ? (
            <div>
              <button onClick={generateTotp} disabled={totpGenerating} style={{ width: '100%', padding: 10 }}>
                {totpGenerating ? 'Preparing…' : 'Generate secret'}
              </button>
            </div>
          ) : (
            <div>
              {qrUrl ? (
                <div style={{ margin: '8px 0' }}>
                  <a href={qrUrl} target="_blank" rel="noreferrer">Open QR in new tab</a>
                  <div style={{ fontSize: 12, color: '#555' }}>If QR cannot be scanned, add account manually using the secret below.</div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#555' }}>Scan the QR code generated by your browser or use the secret key shown by your app.</div>
              )}
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#444' }}>Label</label>
                <input value={totpLabel} onChange={(e)=>setTotpLabel(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </div>
              <div style={{ marginTop: 8 }}>
                <input placeholder="Enter 6‑digit code from app" value={totpCode} onChange={(e)=>setTotpCode(e.target.value)} style={{ width: '100%', padding: 8 }} />
                <button onClick={enrollTotp} disabled={totpEnrolling || totpCode.length < 6} style={{ width: '100%', padding: 10, marginTop: 8 }}>
                  {totpEnrolling ? 'Enrolling…' : 'Verify & Enroll'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
