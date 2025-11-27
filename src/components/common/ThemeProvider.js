import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { initializeTheme } from '../../store/slices/themeSlice';

const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);

  useEffect(() => {
    dispatch(initializeTheme());
  }, [dispatch]);

  // Also ensure it updates if mode changes externally or via other means
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return <>{children}</>;
};

export default ThemeProvider;
