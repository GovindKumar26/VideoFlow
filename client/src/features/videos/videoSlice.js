import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/axiosApi/axios";

//  1. THE UPLOAD THUNK
export const uploadFile = createAsyncThunk(
  'videos/upload', 
  async ({ formData, onProgress }, thunkAPI) => {
    try {
      const response = await api.post('/upload/stream', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

//  2. THE FETCH ALL VIDEOS THUNK
export const fetchVideos = createAsyncThunk(
  "videos/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/files"); 
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

//  3. FETCH SINGLE VIDEO BY ID THUNK
export const fetchVideoById = createAsyncThunk(
  "videos/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/files/${id}`);
      return response.data.file || response.data; // Handles optional data wrapper layers safely
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

//  4. UPDATE VIDEO DETAILS THUNK
export const updateVideoDetails = createAsyncThunk(
  "videos/update",
  async ({ id, title }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/files/${id}`, { originalName: title });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

//  5. DELETE VIDEO THUNK
export const deleteVideo = createAsyncThunk(
  "videos/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/files/${id}`);
      return id; // Return the deleted ID to update our local array state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


export const fetchDashboardStats = createAsyncThunk(
  "videos/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/files/analytics/summary");
      return response.data; // Expects layout shape: { totalVideos, storageGb, totalViews, bandwidthGb }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to load summary analytics statistics.");
    }
  }
);

//  THE CENTRAL VIDEOS SLICE CONFIGURATION
const videoSlice = createSlice({
  name: "videos",
  initialState: {
    list: [],            // For the dashboard gallery grid
    currentVideo: null,  // For the individual video details page
    loading: false,
    dashboardStats: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All Videos Lifecycle
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.files || action.payload || []; 
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Single Video By ID Lifecycle
      .addCase(fetchVideoById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentVideo = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVideo = action.payload;
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Details Lifecycle
      .addCase(updateVideoDetails.fulfilled, (state, action) => {
        state.currentVideo = action.payload;
        // Also update the title inline inside the main list array cache if present
        const index = state.list.findIndex((v) => v._id === action.payload._id);
        if (index !== -1) state.list[index] = action.payload;
      })

      // Delete Video Lifecycle
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.list = state.list.filter((v) => v._id !== action.payload);
        state.currentVideo = null;
      })

      // Upload File Lifecycle
      .addCase(uploadFile.pending, (state) => {
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.list.unshift(action.payload); 
      })
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload; // 🎯 Merges metrics directly into client context storage cache
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Binds exception string back to your alert dashboard banner
      });
  },
});

export default videoSlice.reducer;