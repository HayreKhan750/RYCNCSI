import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: getInitialTheme(),
  },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
      
      // Apply class to body immediately for smoother transition
      if (state.mode === 'dark') {
          document.body.classList.add('dark-mode');
          document.body.classList.remove('light-mode');
      } else {
          document.body.classList.add('light-mode');
          document.body.classList.remove('dark-mode');
      }
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
      
      if (state.mode === 'dark') {
          document.body.classList.add('dark-mode');
          document.body.classList.remove('light-mode');
      } else {
          document.body.classList.add('light-mode');
          document.body.classList.remove('dark-mode');
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
