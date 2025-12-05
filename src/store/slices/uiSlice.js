import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'light',
    sidebarOpen: false,
    globalLoading: false,
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    openFoulModal: (state, action) => {
        state.foulModalOpen = true;
        state.foulViolations = action.payload || [];
    },
    closeFoulModal: (state) => {
        state.foulModalOpen = false;
        state.foulViolations = [];
    }
  },
});

export const { toggleTheme, toggleSidebar, setGlobalLoading, openFoulModal, closeFoulModal } = uiSlice.actions;
export default uiSlice.reducer;
