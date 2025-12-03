import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchDashboardData, 
  deleteUser as deleteUserAction, 
  approveInstructor as approveInstructorAction, 
  deleteRating as deleteRatingAction, 
  updateRatingStatus as updateRatingStatusAction,
  registerUser as registerUserAction,
  updateUserStatus as updateUserStatusAction,
  updateUserProfile as updateUserProfileAction,
  banUser as banUserAction
} from '../../store/slices/adminSlice';
import { 
  selectAdminStats, 
  selectAdminUsers, 
  selectAdminRatings, 
  selectAdminLogs, 
  selectAdminLoading 
} from '../../store/selectors/adminSelectors';

export function useAdminData() {
  const dispatch = useDispatch();
  
  const stats = useSelector(selectAdminStats);
  const users = useSelector(selectAdminUsers);
  const ratings = useSelector(selectAdminRatings);
  const logs = useSelector(selectAdminLogs);
  const loading = useSelector(selectAdminLoading);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Actions
  const deleteUser = async (uid) => {
    if(!window.confirm("Delete this user permanently?")) return;
    dispatch(deleteUserAction(uid));
  };

  const approveInstructor = async (uid) => {
    dispatch(approveInstructorAction(uid));
  };

  const deleteRating = async (id) => {
    if(!window.confirm("Delete this rating?")) return;
    dispatch(deleteRatingAction(id));
  };

  const updateRatingStatus = async (id, status) => {
    dispatch(updateRatingStatusAction({ id, status }));
  };

  const flagRating = async (id) => {
    dispatch(updateRatingStatusAction({ id, status: 'FLAGGED' }));
  };

  return { 
    loading, 
    stats, 
    users, 
    ratings, 
    logs, 
    deleteUser, 
    approveInstructor, 
    deleteRating, 
    updateRatingStatus, 
    flagRating, 
  registerUser: (data) => dispatch(registerUserAction(data)),
    updateUserStatus: (uid, status, details) => dispatch(updateUserStatusAction({ uid, status, details })),
    updateUserProfile: (uid, data) => dispatch(updateUserProfileAction({ uid, data })),
    banUser: (uid, reason) => dispatch(banUserAction({ uid, reason })),
    refresh: () => dispatch(fetchDashboardData()) 
  };
}
