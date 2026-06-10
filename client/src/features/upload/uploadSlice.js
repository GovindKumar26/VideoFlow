import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/axiosApi/axios";

export const uploadFile = createAsyncThunk(
  'upload/file', 
  async ({ formData, onProgress }, thunkAPI) => {
    try {
      const response = await api.post('/upload/stream', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // 🎯 Catch the native browser upload stream bytes in real time
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          
          // Trigger the page's local state updater function
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);