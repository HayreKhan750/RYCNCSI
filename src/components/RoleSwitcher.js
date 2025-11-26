import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import ConfirmationModal from './ConfirmationModal';

export default function RoleSwitcher({ style, className }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [pendingRole, setPendingRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRoleChange = (e) => {
    setPendingRole(e.target.value);
    setIsModalOpen(true);
  };

  const confirmSwitch = () => {
    if (pendingRole && user) {
      dispatch(setUser({ ...user, role: pendingRole }));
    }
    setIsModalOpen(false);
    setPendingRole(null);
  };

  const cancelSwitch = () => {
    setIsModalOpen(false);
    setPendingRole(null);
  };

  return (
    <>
      <div className={className} style={style}>
        <select 
            value={user?.role || 'student'} 
            onChange={handleRoleChange}
            style={{
                padding: '6px 12px', 
                borderRadius: '8px', 
                border: '1px solid rgba(128,128,128,0.3)', 
                background: 'rgba(255,255,255,0.05)', 
                color: 'inherit', 
                cursor:'pointer',
                outline: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
            }}
            title="Switch User Role"
        >
            <option value="student" style={{color:'black'}}>Student View</option>
            <option value="instructor" style={{color:'black'}}>Instructor View</option>
            <option value="admin" style={{color:'black'}}>Admin View</option>
        </select>
      </div>

      <ConfirmationModal 
        isOpen={isModalOpen}
        title="Switch Role?"
        message={`Are you sure you want to switch your view to "${pendingRole}"? This will change your interface immediately.`}
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
        confirmText="Yes, Switch"
        type="info"
      />
    </>
  );
}
