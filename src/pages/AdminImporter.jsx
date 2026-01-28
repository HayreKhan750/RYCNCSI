import React, { useState, useCallback } from 'react';
import { db } from '../firebase';
import { writeBatch, doc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileJson, CheckCircle, AlertCircle, ArrowLeft, Database, Loader2, Users, RefreshCw } from 'lucide-react';
import './AdminImporter.css';

// Utility: Slug generator for IDs
const slug = (s) => s.toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const splitInstructors = (s) => s.split(/&|,|\s+and\s+|\s+And\s+/g).map(t => t.trim()).filter(Boolean);

export default function AdminImporter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('instructors'); // 'instructors' | 'students'
  
  // Instructor State
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);

  // Student State
  const [studentStatus, setStudentStatus] = useState('idle');
  const [studentStats, setStudentStats] = useState({ total: 0, migrated: 0 });

  // --- File Handling (Instructors) ---
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setStatus('error');
      setMessage('Invalid file type. Please upload a JSON file.');
      return;
    }
    setFile(file);
    setStatus('parsing');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        analyzeData(json);
      } catch (err) {
        setStatus('error');
        setMessage('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
  };

  // --- Instructor Analysis ---
  const analyzeData = (rawData) => {
    if (!Array.isArray(rawData)) {
      setStatus('error');
      setMessage('Invalid JSON structure. Expected an array.');
      return;
    }

    const instructorsMap = new Map();
    const depts = new Set();
    let courseCount = 0;

    rawData.forEach(entry => {
      const deptName = entry.Dept || 'General';
      depts.add(deptName);
      const courseTitle = entry["Course Title"];
      const courseNo = entry["Course No"];
      const year = entry.Year;
      const emailObj = entry.Email;

      const names = splitInstructors(entry.Instructors || '');
      
      names.forEach(name => {
        let email = null;
        if (names.length === 1 && emailObj) {
           email = emailObj.toLowerCase().trim();
        }
        const id = email || slug(name);

        if (!instructorsMap.has(id)) {
           instructorsMap.set(id, {
             id,
             name,
             email,
             department: deptName,
             role: 'instructor',
             // Standardized Fields
             bio: `Instructor in ${deptName}`,
             isRegistered: false, // Default for catalog
             profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
             courses: [],
             meta: {
               createdAt: new Date().toISOString()
             }
           });
        }

        const inst = instructorsMap.get(id);
        const existingCourse = inst.courses.find(c => c.code === courseNo && c.title === courseTitle);
        
        if (!existingCourse) {
          // Optimize: Only include dept if it differs from instructor's main dept
          const courseData = {
            title: courseTitle,
            code: courseNo,
            year: year
          };
          if (deptName !== inst.department) {
            courseData.dept = deptName;
          }

          inst.courses.push(courseData);
          courseCount++;
        }
        if (!inst.email && email) inst.email = email;
      });
    });

    setPreview({
      instructors: Array.from(instructorsMap.values()),
      stats: {
        instructors: instructorsMap.size,
        departments: depts.size,
        courses: courseCount
      }
    });
    setStatus('ready');
    setMessage('File analyzed successfully. Ready to migrate.');
  };

  // --- Instructor Migration ---
  const handleMigrateInstructors = async () => {
    if (!preview) return;
    setStatus('migrating');
    setLogs([]);
    
    try {
      const batchSize = 400;
      const chunks = [];
      const data = preview.instructors;
      for (let i = 0; i < data.length; i += batchSize) {
        chunks.push(data.slice(i, i + batchSize));
      }

      let processed = 0;
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(inst => {
          const instRef = doc(db, 'instructors', inst.id);
          batch.set(instRef, {
             ...inst,
             updatedAt: serverTimestamp(),
             source: 'json-migration-v3.1'
          });
        });

        await batch.commit();
        processed += chunk.length;
        setLogs(prev => [`Migrated batch of ${chunk.length} instructors...`, ...prev]);
      }
      
      setStatus('done');
      setMessage(`Successfully migrated ${processed} instructors!`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(`Migration failed: ${err.message}`);
    }
  };

  // --- Student Sync Logic ---
  const handleSyncStudents = async () => {
    setStudentStatus('migrating');
    setLogs([]);
    
    try {
      // 1. Fetch all users with role 'student'
      setLogs(prev => [`Fetching students from 'users' collection...`, ...prev]);
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setStudentStatus('done');
        setMessage('No student accounts found to sync.');
        return;
      }

      setLogs(prev => [`Found ${snap.size} students. Starting sync...`, ...prev]);

      // 2. Batch write to 'students' collection
      const batches = [];
      let currentBatch = writeBatch(db);
      let count = 0;

      snap.docs.forEach((userDoc) => {
        const d = userDoc.data();
        const studentRef = doc(db, 'students', userDoc.id);
        
        // Ensure standard schema for Students
        const studentData = {
          id: userDoc.id,
          name: d.displayName || d.name || 'Unknown Student',
          email: d.email,
          department: d.department || d.Dept || 'General',
          role: 'student',
          bio: d.bio || 'Student',
          profilePictureUrl: d.photoURL || d.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.displayName || 'Student')}`,
          isRegistered: true, // They come from users, so they are registered
          updatedAt: serverTimestamp(),
          source: 'user-sync-v1'
        };

        currentBatch.set(studentRef, studentData);
        count++;

        if (count % 400 === 0) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
        }
      });

      if (count % 400 !== 0) batches.push(currentBatch);

      await Promise.all(batches.map(b => b.commit()));

      setStudentStats({ total: snap.size, migrated: count });
      setStudentStatus('done');
      setMessage(`Successfully synced ${count} students to separate collection.`);
      setLogs(prev => [`Sync complete. ${count} students moved.`, ...prev]);

    } catch (err) {
       console.error(err);
       setStudentStatus('error');
       setMessage(`Sync failed: ${err.message}`);
    }
  };

  return (
    <div className="migration-container">
      <div className="migration-content">
        {/* Header */}
        <div className="migration-header">
           <div className="header-left">
             <button onClick={() => navigate('/admin')} className="back-btn">
               <ArrowLeft size={24} />
             </button>
             <div className="title-section">
               <h1>Data Migration Center</h1>
               <p>Optimize and restructure database collections</p>
             </div>
           </div>
           
           <div className="tab-group">
             <button 
               onClick={() => setActiveTab('instructors')}
               className={`tab-btn instructors ${activeTab === 'instructors' ? 'active' : ''}`}
             >
               Instructors
             </button>
             <button 
               onClick={() => setActiveTab('students')}
               className={`tab-btn students ${activeTab === 'students' ? 'active' : ''}`}
             >
               Students
             </button>
           </div>
        </div>

        {/* INSTRUCTORS TAB */}
        {activeTab === 'instructors' && (
          <div className="migration-grid">
            <div className="upload-card">
                <div 
                  className={`drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <input type="file" id="file-upload" style={{display: 'none'}} accept=".json" onChange={handleChange} />
                  
                  <AnimatePresence mode="wait">
                      {file ? (
                        <motion.div 
                          key="file-loaded"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="drop-content"
                        >
                            <FileJson className="file-icon" />
                            <div>
                              <h3 className="upload-title">{file.name}</h3>
                              <p className="upload-subtitle">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setStatus('idle'); }}
                              className="remove-file"
                            >
                              Remove File
                            </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="upload-prompt"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="drop-content"
                        >
                            <Upload className="upload-icon" />
                            <div>
                              <h3 className="upload-title">Drop JSON File Here</h3>
                              <p className="upload-subtitle">Migrates to '/instructors'</p>
                            </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>

                <div className="control-bar">
                  <div className={`status-indicator ${status === 'ready' ? 'ready' : status === 'done' ? 'success' : status === 'error' ? 'error' : ''}`}>
                      {status === 'migrating' && <Loader2 className="animate-spin" size={20} />}
                      {status === 'done' && <CheckCircle size={20} />}
                      {status === 'error' && <AlertCircle size={20} />}
                      <span>
                          {status === 'idle' ? 'Waiting for file...' : 
                            status === 'parsing' ? 'Analyzing...' :
                            status === 'ready' ? 'Ready to Migrate' :
                            status === 'migrating' ? 'Migration in progress...' :
                            message}
                      </span>
                  </div>
                  <button
                    onClick={handleMigrateInstructors}
                    disabled={status !== 'ready'}
                    className="migrate-btn"
                  >
                    Start Migration
                  </button>
                </div>
            </div>

            <div className="info-sidebar">
                <div className="preview-card">
                  <h2 className="preview-title">Preview Stats</h2>
                  {preview ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        <StatRow label="Instructors" value={preview.stats.instructors} color="violet" />
                        <StatRow label="Departments" value={preview.stats.departments} color="pink" />
                        <StatRow label="Schema v3.1" value="Optimized" color="emerald" />
                    </div>
                  ) : (
                    <div style={{textAlign: 'center', padding: '2rem 0', color: '#64748b'}}>
                      Upload to preview
                    </div>
                  )}
                </div>
                {logs.length > 0 && <LogsPanel logs={logs} done={status === 'done'} />}
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
           <div className="migration-grid">
              <div className="upload-card">
                 <div className="drop-zone" style={{ cursor: 'default', borderStyle: 'solid' }}>
                    <div className="drop-content">
                       <Users className="upload-icon" style={{color: '#10b981'}} />
                       <div>
                         <h3 className="upload-title">Student Collection Sync</h3>
                         <p className="upload-subtitle">
                           Scan 'users' collection and move students to dedicated '/students' collection.
                           <br/>Ensures "bio", "isRegistered", "profilePictureUrl" schema compliance.
                         </p>
                       </div>
                    </div>
                 </div>

                 <div className="control-bar">
                    <div className={`status-indicator ${studentStatus === 'done' ? 'success' : studentStatus === 'error' ? 'error' : ''}`}>
                       {studentStatus === 'migrating' && <Loader2 className="animate-spin" size={20} />}
                       {studentStatus === 'done' && <CheckCircle size={20} />}
                       <span>{message || 'Ready to Sync'}</span>
                    </div>

                    <button
                      onClick={handleSyncStudents}
                      disabled={studentStatus === 'migrating'}
                      className="migrate-btn"
                      style={{background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'}}
                    >
                      <RefreshCw size={18} style={{marginRight: 8}} />
                      Sync Students
                    </button>
                 </div>
              </div>

              <div className="info-sidebar">
                 <div className="preview-card">
                     <h2 className="preview-title">Sync Stats</h2>
                     <StatRow label="Total Found" value={studentStats.total} color="violet" />
                     <StatRow label="Migrated" value={studentStats.migrated} color="emerald" />
                 </div>
                 {logs.length > 0 && <LogsPanel logs={logs} done={studentStatus === 'done'} />}
              </div>
           </div>
        )}

      </div>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${color}`}>{value}</span>
    </div>
  );
}

function LogsPanel({ logs, done }) {
  return (
    <div className="logs-container">
        {logs.map((log, i) => (
          <div key={i} className="log-entry">{">"} {log}</div>
        ))}
        {done && <div className="log-success">{">"} OPERATION COMPLETE</div>}
    </div>
  );
}
