import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { pushRoute, popRoute, saveScrollPosition, selectPreviousRoute, selectScrollPosition } from '../store/slices/navigationSlice';

export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const previousRoute = useSelector(selectPreviousRoute);
  const savedScrollPosition = useSelector((state) => selectScrollPosition(state, location.pathname));

  // 1. Track Route Changes & Restore Scroll
  useEffect(() => {
    // Save current path to history when location changes is handled by pushRoute called explicitly on navigation actions
    // But we need to handle browser back button or direct URL entry
    
    // Restore scroll if we have it
    if (savedScrollPosition > 0) {
        window.scrollTo({ top: savedScrollPosition, behavior: 'smooth' });
    } else {
        window.scrollTo(0, 0);
    }
  }, [location.pathname, savedScrollPosition]);

  // 2. Smart Navigate Function (Use this instead of useNavigate)
  const smartNavigate = useCallback((path, options = {}) => {
    // Save current scroll before leaving
    dispatch(saveScrollPosition({ path: location.pathname, position: window.scrollY }));
    
    // Push to history
    dispatch(pushRoute({ path: location.pathname }));
    
    navigate(path, options);
  }, [dispatch, location.pathname, navigate]);

  // 3. Smart Back Function
  // 3. Smart Back Function
  const goBack = useCallback(() => {
    // Standard browser back behavior
    if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
    } else {
        // Fallback if no history (e.g. opened link in new tab)
        navigate('/dashboard'); 
    }
  }, [navigate]);

  return { smartNavigate, goBack };
};
