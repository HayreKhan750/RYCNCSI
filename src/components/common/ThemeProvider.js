import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { initializeTheme } from '../../store/slices/themeSlice';

const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);

  useEffect(() => {
    dispatch(initializeTheme());
  }, [dispatch]);

  useEffect(() => {
    // Sync theme to DOM immediately when mode changes
    document.documentElement.setAttribute('data-theme', mode);
    // Also update body class for legacy CSS support if needed
    if (mode === 'dark') {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
    } else {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
    }
  }, [mode]);

  return <>{children}</>;
};

export default ThemeProvider;
