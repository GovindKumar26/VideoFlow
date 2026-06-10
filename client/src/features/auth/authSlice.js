import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/axiosApi/axios";
import { Satellite } from "lucide-react";


export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials) => {
        const { email, password } = credentials;
        const response = await api.post('auth/login', { email, password });
        return response.data;
    }
)

export const getCurrentUser = createAsyncThunk(
    'auth/me',
    async () => {
        const response = await api.get('auth/me');
        return response.data;
    }
)

export const signUp = createAsyncThunk(
    'auth/signUp',
    async (credentials) => {
        const { email, password } = credentials;
        const response = await api.post('auth/register', { email, password });
        return response.data;
    }
)

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        isAuthenticated: false,
        isLoading: true,
    },

    reducers: {
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        }
    },

    extraReducers: (builder) => {
        builder.addCase(loginUser.fulfilled, (state, action) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.isLoading = false;
        })
            .addCase(signUp.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addCase(getCurrentUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(signUp.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getCurrentUser.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.isLoading = false;
            })
            .addCase(loginUser.rejected, (state) => {
                state.isLoading = false;
            })

            .addCase(signUp.rejected, (state) => {
                state.isLoading = false;
            })
    }
})

export default authSlice.reducer;
export const { logout } = authSlice.actions;