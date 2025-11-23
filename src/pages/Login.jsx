import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { profile } = useAuth();

  const goHome = () => navigate('/');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      goHome();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      goHome();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h2>Login</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleEmailLogin}>
        <div style={{ marginBottom: 8 }}>
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <button disabled={loading} type="submit" style={{ width: '100%', padding: 10 }}>Login</button>
      </form>
      <button disabled={loading} onClick={handleGoogle} style={{ width: '100%', padding: 10, marginTop: 8 }}>Continue with Google</button>
      <div style={{ marginTop: 12 }}>
        <Link to="/signup">Create account</Link>
      </div>
    </div>
  );
}
