import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { getMultiFactorResolver, PhoneAuthProvider, RecaptchaVerifier, PhoneMultiFactorGenerator, TotpMultiFactorGenerator } from 'firebase/auth';
import { useMfa } from '../../contexts/MfaContext';

export default function MfaPrompt() {
  const { resolver, setResolver } = useMfa();
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const recaptchaRef = useRef(null);
  const [error, setError] = useState('');

  const factors = useMemo(() => (resolver ? resolver.hints || [] : []), [resolver]);

  useEffect(() => {
    if (!resolver) {
      navigate('/login');
    }
  }, [resolver, navigate]);

  const ensureRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'mfa-recaptcha', { size: 'invisible' });
    }
    return recaptchaRef.current;
  };

  const sendCode = async () => {
    if (!resolver) return;
    setError('');
    setSending(true);
    try {
      const hint = factors[selectedIndex];
      if (hint?.factorId === 'phone') {
        const verifier = ensureRecaptcha();
        const phoneInfoOptions = { multiFactorHint: hint, session: resolver.session };
        const provider = new PhoneAuthProvider(auth);
        const vid = await provider.verifyPhoneNumber(phoneInfoOptions, verifier);
        setVerificationId(vid);
      } else if (hint?.factorId === 'totp') {
        // TOTP does not require sending a code; the app generates it. Just reveal input.
        setVerificationId('totp');
      }
    } catch (e) {
      setError(e.message || 'Failed to send code');
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (!resolver) return;
    setError('');
    setVerifying(true);
    try {
      const hint = factors[selectedIndex];
      if (hint?.factorId === 'phone') {
        const cred = PhoneAuthProvider.credential(verificationId, code);
        const assertion = PhoneMultiFactorGenerator.assertion(cred);
        await resolver.resolveSignIn(assertion);
        setResolver(null);
        navigate('/');
        return;
      } else if (hint?.factorId === 'totp') {
        const assertion = TotpMultiFactorGenerator.assertion(code);
        await resolver.resolveSignIn(assertion);
        setResolver(null);
        navigate('/');
        return;
      }
      // For non-phone factors, navigate to enrollment or specialized prompt as needed
      setError('Unsupported factor type on this screen.');
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h2>Two‑Factor Verification</h2>
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}

      {!resolver ? (
        <div>Preparing…</div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <label>Choose a factor:</label>
            <select value={selectedIndex} onChange={(e)=>setSelectedIndex(Number(e.target.value))} style={{ width: '100%', padding: 8 }}>
              {factors.map((f, i) => (
                <option key={i} value={i}>
                  {f.factorId === 'phone' ? `Phone: ${f.phoneNumber}` : f.factorId}
                </option>
              ))}
            </select>
          </div>

          {factors[selectedIndex]?.factorId === 'phone' && (
            <div style={{ marginTop: 8 }}>
              <button onClick={sendCode} disabled={sending} style={{ width: '100%', padding: 10 }}>
                {sending ? 'Sending…' : 'Send code'}
              </button>
              {verificationId && (
                <div style={{ marginTop: 12 }}>
                  <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Enter 6‑digit code" style={{ width: '100%', padding: 8 }} />
                  <button onClick={verify} disabled={verifying || code.length < 6} style={{ width: '100%', padding: 10, marginTop: 8 }}>
                    {verifying ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              )}
              <div id="mfa-recaptcha" />
            </div>
          )}

          {factors[selectedIndex]?.factorId === 'totp' && (
            <div style={{ marginTop: 8 }}>
              <button onClick={sendCode} disabled={sending} style={{ width: '100%', padding: 10 }}>
                {sending ? 'Preparing…' : 'Use authenticator code'}
              </button>
              {verificationId && (
                <div style={{ marginTop: 12 }}>
                  <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Enter 6‑digit code from app" style={{ width: '100%', padding: 8 }} />
                  <button onClick={verify} disabled={verifying || code.length < 6} style={{ width: '100%', padding: 10, marginTop: 8 }}>
                    {verifying ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              )}
            </div>
          )}

          {factors.length === 0 && (
            <div style={{ marginTop: 8, fontSize: 14 }}>
              No MFA factors found. <a href="/mfa-enroll">Enroll now</a>.
            </div>
          )}
        </>
      )}
    </div>
  );
}
