import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Async thunks for persistence
export const persistAuth = createAsyncThunk(
  'auth/persistAuth',
  async (userData) => {
    try {
      await AsyncStorage.setItem('AUTH_USER', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error persisting auth:', error);
      return userData;
    }
  }
);

export const loadAuth = createAsyncThunk(
  'auth/loadAuth',
  async () => {
    try {
      const userData = await AsyncStorage.getItem('AUTH_USER');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error loading auth:', error);
      return null;
    }
  }
);

export const clearAuth = createAsyncThunk(
  'auth/clearAuth',
  async () => {
    try {
      await AsyncStorage.removeItem('AUTH_USER');
      return null;
    } catch (error) {
      console.error('Error clearing auth:', error);
      return null;
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  profileUrl: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setProfileUrl: (state, action) => {
      state.profileUrl = action.payload;
      // Update the profile URL in the user object as well
      if (state.user) {
        state.user.profileUrl = action.payload;
      }
    },
    updateUserName: (state, action) => {
      if (state.user) {
        state.user.name = action.payload;
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.profileUrl = null;
    },
  },
  extraReducers: (builder) => {
    // Handle loading auth state
    builder.addCase(loadAuth.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadAuth.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.profileUrl = action.payload.profileUrl || null;
      }
      state.loading = false;
    });
    builder.addCase(loadAuth.rejected, (state) => {
      state.loading = false;
    });

    // Handle persisting auth state
    builder.addCase(persistAuth.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.profileUrl = action.payload.profileUrl || null;
    });

    // Handle clearing auth state
    builder.addCase(clearAuth.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.profileUrl = null;
    });
  },
});

export const { setUser, setProfileUrl, updateUserName, logout } = authSlice.actions;
export default authSlice.reducer;
