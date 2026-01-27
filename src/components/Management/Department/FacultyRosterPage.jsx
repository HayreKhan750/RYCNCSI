import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../../common/Header';
import { Search, Trophy } from 'lucide-react';
import '../Management.css'; // Reusing premium styles

const FacultyRosterPage = () => {
    const { deptName } = useParams();
    const navigate = useNavigate();
    const decodedName = decodeURIComponent(deptName || '');
    const [searchTerm, setSearchTerm] = useState('');

    const { topInstructors } = useSelector(state => state.management);

    // Filter Logic (Same as DepartmentDetail)
    const deptInstructors = useMemo(() => {
        const startList = topInstructors.filter(i => {
            const iDept = (i.department || i.deptName || 'General').toLowerCase().trim();
            const target = decodedName.toLowerCase().trim();
            return iDept === target || iDept.includes(target) || target.includes(iDept); 
        });
        
        // Sort by Rating (Top first)
        return startList.sort((a,b) => (b.rating || 0) - (a.rating || 0));
    }, [topInstructors, decodedName]);

    // Client-side search within the roster
    const filteredList = deptInstructors.filter(i => 
        (i.displayName || i.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="management-container">
            <Header title={`${decodedName} Faculty`} showBack={true} />
            
            <main className="management-main" style={{maxWidth: '1000px'}}>
                <div className="executive-header">
                    <div>
                        <button 
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '8px', padding: 0 }}
                            onClick={() => navigate(`/management/department/${encodeURIComponent(decodedName)}`)}
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="page-title">Complete Faculty Roster</h1>
                        <p className="page-subtitle">{decodedName} Department</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{
                    background: 'var(--bg-elevated)', 
                    padding: '16px', 
                    borderRadius: '16px', 
                    border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    marginBottom: '24px'
                }}>
                    <Search color="var(--text-muted)" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search instructor..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: 'transparent', border: 'none', outline: 'none', 
                            color: 'var(--text-primary)', fontSize: '1rem', width: '100%'
                        }} 
                    />
                </div>

                {/* Roster Grid */}
                <div className="glass-panel" style={{padding: '0', overflow: 'hidden'}}>
                    <div className="roster-table-header" style={{
                        display: 'grid', gridTemplateColumns: '60px 3fr 1fr 1fr', padding: '16px 24px',
                        borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600'
                    }}>
                        <div>RANK</div>
                        <div>INSTRUCTOR</div>
                        <div style={{textAlign:'center'}}>RATING</div>
                        <div style={{textAlign:'right'}}>ENGAGEMENT</div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        {filteredList.map((inst, idx) => {
                            const isTop = idx < 3;
                            return (
                                <div 
                                    key={inst.id || idx} 
                                    className="roster-row"
                                    style={{
                                        display: 'grid', gridTemplateColumns: '60px 3fr 1fr 1fr', 
                                        padding: '20px 24px', alignItems: 'center',
                                        borderBottom: '1px solid var(--border-subtle)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onClick={() => navigate(`/management/instructor/${inst.id}`)}
                                    // Hover effect handled by CSS ideally, but inline for now
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-root)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{display:'flex', alignItems:'center'}}>
                                        {isTop && <Trophy size={16} color={idx===0?'#fbbf24':idx===1?'#94a3b8':'#b45309'} style={{marginRight: 4}} />}
                                        <span style={{
                                            fontWeight: isTop ? '800' : '500', 
                                            color: isTop ? 'var(--text-primary)' : 'var(--text-muted)',
                                            width: '24px', textAlign: 'center'
                                        }}>
                                            {idx + 1}
                                        </span>
                                    </div>
                                    
                                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: isTop ? '2px solid var(--primary)' : '1px solid var(--border-subtle)' }}>
                                            <img 
                                                src={inst.photoURL || `https://ui-avatars.com/api/?name=${inst.displayName || inst.name}&background=random`} 
                                                alt={inst.name} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div>
                                            <h3 style={{margin: 0, fontSize: '1rem', color: 'var(--text-primary)'}}>
                                                {inst.displayName || inst.name}
                                            </h3>
                                            <p style={{margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                                                {inst.email || 'No email'}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{textAlign: 'center'}}>
                                        <span style={{
                                            fontWeight: '700', fontSize: '1.1rem',
                                            color: inst.rating >= 4.5 ? 'var(--success)' : inst.rating >= 4.0 ? '#fbbf24' : 'var(--text-primary)'
                                        }}>
                                            {inst.rating}
                                        </span>
                                    </div>

                                    <div style={{textAlign: 'right'}}>
                                        <span className="premium-badge" style={{background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', boxShadow:'none'}}>
                                            {inst.engagementScore || 'Active'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredList.length === 0 && (
                            <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-muted)'}}>
                                No instructors found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FacultyRosterPage;
