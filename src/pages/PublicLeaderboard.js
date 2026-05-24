import React, { useEffect, useState } from 'react';
import { instructorService } from '../services/instructorService';
import TopInstructors from '../components/student/TopInstructors';
import Header from '../components/common/Header';
import GlobalLoader from '../components/common/GlobalLoader';
import { useNavigate } from 'react-router-dom';

export default function PublicLeaderboard() {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            const data = await instructorService.fetchAllInstructors();
            // Sort by average rating descending
            const sorted = [...data].sort((a, b) => {
                const aRating = a.ratingStats?.average || a.avgRating || 0;
                const bRating = b.ratingStats?.average || b.avgRating || 0;
                return bRating - aRating;
            });
            setInstructors(sorted.slice(0, 10)); // Top 10
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) return <GlobalLoader />;

    return (
        <div className="public-leaderboard-page" style={{ 
            minHeight: '100vh', 
            background: '#050505',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
        }}>
            <Header 
                title="Public Leaderboard" 
                showBack={false} 
                showLogout={false}
                onLogoClick={() => navigate('/')}
            />
            
            <main style={{ padding: '120px 24px 60px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <header style={{ marginBottom: 60, textAlign: 'center' }}>
                        <h1 style={{ 
                            fontSize: '3.5rem', 
                            fontWeight: 800, 
                            marginBottom: 16,
                            background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.04em'
                        }}>
                            AcademicPulse Leaderboard
                        </h1>
                        <p style={{ 
                            fontSize: '1.25rem', 
                            color: '#a1a1aa', 
                            maxWidth: 600, 
                            margin: '0 auto',
                            lineHeight: 1.6
                        }}>
                            Discover the highest-rated educators at AAU. Real-time academic intelligence driven by student feedback.
                        </p>
                    </header>

                    <div className="leaderboard-container glass-card" style={{
                        padding: '40px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '32px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <TopInstructors instructors={instructors} />
                    </div>

                    <div style={{ marginTop: 60, textAlign: 'center' }}>
                        <button 
                            onClick={() => navigate('/login')}
                            className="premium-btn"
                            style={{
                                padding: '16px 32px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.5)'
                            }}
                        >
                            Sign in to View All Instructors
                        </button>
                    </div>
                </div>
            </main>

            <style>{`
                .premium-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -10px rgba(59, 130, 246, 0.6);
                }
                .glass-card {
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
            `}</style>
        </div>
    );
}
