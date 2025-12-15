import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ManagementDashboard = lazy(() => import('./ManagementDashboard'));
// Future components will be imported here
// const DepartmentAnalytics = lazy(() => import('./DepartmentAnalytics'));

const ManagementEntry = () => {
  return (
    <div className="management-entry">
      <Suspense fallback={<div className="p-8 text-center">Loading Management Portal...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagementDashboard />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default ManagementEntry;
