import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, deleteDoc, setDoc, serverTimestamp, Timestamp, collection, addDoc } from 'firebase/firestore';

export default function EmailOtpPrompt() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [resending, setResending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const navigate = useNavigate();
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!auth?.currentUser) return;
      try {
        const ref = doc(db, 'emailOtps', auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (!active) return;
        if (snap.exists()) {
          setInfo(snap.data());
        } else {
          setInfo(null);
        }
      } catch (_) {}
    };
    load();
    return () => { active = false; };
  }, []);

  const canResend = useMemo(() => Date.now() >= cooldownUntil, [cooldownUntil]);

  const resend = async () => {
    setError('');
    setNotice('');
    if (!auth?.currentUser?.email) {
      setError('Please sign in again.');
      return;
    }
    if (!canResend) return;
    setResending(true);
    try {
      const u = auth.currentUser;
      const newCode = String(Math.floor(100000 + Math.random() * 900000));
      const ref = doc(db, 'emailOtps', u.uid);
      const expiresAt = Timestamp.fromMillis(Date.now() + 10 * 60 * 1000);
      await setDoc(ref, {
        email: u.email,
        code: newCode,
        createdAt: serverTimestamp(),
        expiresAt,
      }, { merge: true });
      const mail = {
        to: [u.email],
        message: {
          subject: 'Your sign-in code',
          text: `Your sign-in code is ${newCode}. It expires in 10 minutes.`,
          html: `<p>Your sign-in code is <strong>${newCode}</strong>.</p><p>It expires in 10 minutes.</p>`
        }
      };
      // Fire-and-forget email send; do not block UI on slow extension/network
      try { addDoc(collection(db, 'mail'), mail).catch(()=>{}); } catch (_) {}
      const cooldownMs = (isDev ? 5 : 60) * 1000;
      setCooldownUntil(Date.now() + cooldownMs);
      setInfo((prev) => prev ? { ...prev, email: u.email, expiresAt } : { email: u.email, expiresAt });
      setNotice('New code sent. Check your inbox (and spam).');
    } catch (e) {
      setError(e.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const i = setInterval(() => {
      // trigger re-render for countdown
      if (cooldownUntil && Date.now() > cooldownUntil) setCooldownUntil(0);
    }, 500);
    return () => clearInterval(i);
  }, [cooldownUntil]);

  // Live polling of the OTP doc so dev hint stays updated and users can request new code
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      if (!auth?.currentUser) return;
      try {
        const ref = doc(db, 'emailOtps', auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (!active) return;
        if (snap.exists()) setInfo(snap.data());
      } catch (_) {}
    }, 2500);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const verify = async () => {
    setError('');
    if (!auth?.currentUser) {
      setError('Please sign in again.');
      return;
    }
    if (!code || code.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    // Fast path: validate against local state to avoid network delay
    const now = Date.now();
    const expLocal = info?.expiresAt?.toMillis ? info.expiresAt.toMillis() : 0;
    if (info && expLocal && now <= expLocal && String(info.code) === String(code)) {
      setLoading(true);
      // delete in background, don't block navigation
      try {
        const ref = doc(db, 'emailOtps', auth.currentUser.uid);
        deleteDoc(ref).catch(()=>{});
      } catch (_) {}
      navigate('/');
      setLoading(false);
      return;
    }

    // Fallback: fetch once from Firestore
    setLoading(true);
    try {
      const ref = doc(db, 'emailOtps', auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError('Code expired or not found. Request a new code.');
        return;
      }
      const data = snap.data();
      const exp = data?.expiresAt?.toMillis ? data.expiresAt.toMillis() : 0;
      if (!exp || Date.now() > exp) {
        setError('Code has expired. Request a new code.');
        try { await deleteDoc(ref); } catch (_) {}
        return;
      }
      if (String(data.code) !== String(code)) {
        setError('Invalid code.');
        return;
      }
      try { await deleteDoc(ref); } catch (_) {}
      navigate('/');
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const secsLeft = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));

  return (
    <div style={{ maxWidth: 460, margin: '60px auto', padding: 0 }}>
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: 12, padding: 24,
        boxShadow: '0 6px 24px rgba(0,0,0,0.06)', background: '#fff'
      }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Check your email</h2>
        <p style={{ marginTop: 6, color: '#555' }}>
          We sent a 6‑digit code to {info?.email || 'your email address'}.
        </p>

        <label style={{ display: 'block', fontSize: 12, color: '#444', marginTop: 12 }}>Enter code</label>
        <input
          placeholder="6-digit code"
          value={code}
          onChange={(e)=>setCode(e.target.value.replace(/\D/g,''))}
          inputMode="numeric"
          maxLength={6}
          style={{ width: '100%', padding: 14, fontSize: 18, letterSpacing: 4, textAlign: 'center', borderRadius: 8, border: '1px solid #d1d5db' }}
        />

        {error && <div style={{ color: '#b00020', marginTop: 10 }}>{error}</div>}
        {isDev && info?.code && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 8, borderRadius: 6 }}>
            Dev hint: current OTP code is <strong>{String(info.code)}</strong>
          </div>
        )}
        {notice && !error && <div style={{ color: '#065f46', marginTop: 10 }}>{notice}</div>}

        <button onClick={verify} disabled={loading || code.length < 6}
          style={{ width: '100%', padding: 12, marginTop: 12, borderRadius: 8, background: '#111827', color: '#fff', border: 'none' }}>
          {loading ? 'Verifying…' : 'Verify'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: '#2563eb' }}>Use a different account</button>
          <button onClick={resend} disabled={resending || !canResend} style={{ background: 'transparent', border: 'none', color: canResend ? '#2563eb' : '#9ca3af' }}>
            {resending ? 'Sending…' : (canResend ? 'Resend code' : `Resend in ${secsLeft}s`)}
          </button>
        </div>

        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
          Tip: Check your spam folder if you don’t see the email.
        </div>
      </div>
    </div>
  );
}
