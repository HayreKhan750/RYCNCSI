import React, { useState } from 'react';
import PremiumModal from '../common/PremiumModal';

export default function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);
  const [adminName, setAdminName] = useState('Admin User');
  const [modal, setModal] = useState({ open: false, title: '', message: '', type: 'success' });
  
  const handleSave = async () => {
    try {
      await import('../../services/adminService').then(m => m.adminService.updateSystemSettings({
          maintenanceMode,
          allowRegistrations,
          adminProfile: {
             displayName: adminName
             // notification settings...
          }
      }));

      setModal({
          open: true,
          title: 'Settings Saved',
          message: 'System configuration has been updated successfully and logged.',
          type: 'success'
      });
    } catch (e) {
      setModal({
          open: true,
          title: 'Save Failed',
          message: e.message,
          type: 'danger'
      });
    }
  };

  return (
    <div className="adm-glass" style={{padding: 30, maxWidth: 800, margin: '0 auto'}}>
      <h3 style={{marginBottom: 20}}>System Settings</h3>
      
      <div className="adm-grid" style={{gridTemplateColumns: '1fr 1fr', gap: 30}}>
          <div>
              <h4 style={{marginBottom: 15, opacity: 0.8}}>General Configuration</h4>
              
              <div style={{marginBottom: 20, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.2)', padding:15, borderRadius:8}}>
                  <div>
                      <div style={{fontWeight:600}}>Maintenance Mode</div>
                      <div style={{fontSize:'0.8rem', opacity:0.6}}>Disable access for all non-admin users</div>
                  </div>
                  <label className="switch">
                      <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
                      <span className="slider round"></span>
                  </label>
              </div>

              <div style={{marginBottom: 20, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.2)', padding:15, borderRadius:8}}>
                  <div>
                      <div style={{fontWeight:600}}>Allow Public Registrations</div>
                      <div style={{fontSize:'0.8rem', opacity:0.6}}>If disabled, only admins can add users</div>
                  </div>
                  <label className="switch">
                      <input type="checkbox" checked={allowRegistrations} onChange={(e) => setAllowRegistrations(e.target.checked)} />
                      <span className="slider round"></span>
                  </label>
              </div>
          </div>

          <div>
              <h4 style={{marginBottom: 15, opacity: 0.8}}>Admin Profile</h4>
              
              <div className="adm-form-group">
                  <label style={{display:'block', marginBottom: 8, fontSize:'0.9rem', opacity:0.8}}>Display Name</label>
                  <input 
                    type="text" 
                    value={adminName} 
                    onChange={(e) => setAdminName(e.target.value)} 
                    className="adm-input" 
                  />
              </div>

              <div className="adm-form-group" style={{marginTop: 15}}>
                  <label style={{display:'block', marginBottom: 8, fontSize:'0.9rem', opacity:0.8}}>Email Notifications</label>
                  <select 
                    className="adm-select"
                  >
                    <option>All Alerts</option>
                    <option>Critical Only</option>
                    <option>None</option>
                  </select>
              </div>
          </div>
      </div>

      <div style={{marginTop: 30, textAlign: 'right'}}>
          <button className="adm-btn primary" onClick={handleSave} style={{padding: '12px 30px'}}>Save Changes</button>
      </div>

      <style>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          -webkit-transition: .4s;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #2196F3;
        }
        input:focus + .slider {
          box-shadow: 0 0 1px #2196F3;
        }
        input:checked + .slider:before {
          -webkit-transform: translateX(26px);
          -ms-transform: translateX(26px);
          transform: translateX(26px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>

      <PremiumModal 
          isOpen={modal.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={modal.title}
          message={modal.message}
          type={modal.type}
      />
    </div>
  );
}
