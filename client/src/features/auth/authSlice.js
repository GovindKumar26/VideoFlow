import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/axiosApi/axios";

export const changePasswordThunk = createAsyncThunk(
    "auth/changePassword",
    async ({ currentPassword, newPassword }, { rejectWithValue }) => {
        try {
            const response = await api.post("/auth/change-password", { currentPassword, newPassword });
            return response.data; // { message: "Password updated successfully." }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to update password.");
        }
    }
);

// Inside your createSlice extraReducers:
// .addCase(changePasswordThunk.pending, (state) => { state.loading = true; state.error = null; })
// .addCase(changePasswordThunk.fulfilled, (state) => { state.loading = false; state.error = null; })
// .addCase(changePasswordThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

export const updateProfileSettings = createAsyncThunk(
    "auth/updateProfileSettings",
    async ({ name, username }, { rejectWithValue }) => {
        try {
            // Hits your secure PATCH endpoint we outlined in the previous step
            const response = await api.patch("/auth/settings", { name, username });
            return response.data; // Expects layout: { message: "...", user: { ... } }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to update profile values.");
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials) => {
        const { email, password } = credentials;
        const response = await api.post('auth/login', { email, password });
        return response.data;
    }
)

export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, { rejectWithValue }) => {
        try {

            const response = await api.post("/auth/logout");
            return response.data; // e.g., { message: "Logged out successfully" }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Logout failed execution.");
        }
    }
);

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
            .addCase(logoutUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                //  THE COMPREHENSIVE PURGE: Reset all auth indicators cleanly to initial states
                state.user = null;
                state.isAuthenticated = false;
                state.isLoading = false;

            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.isLoading = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(updateProfileSettings.pending, (state) => {
                state.isLoading = true;
                
            })
            .addCase(updateProfileSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                
                state.user = action.payload.user || action.payload;
            })
            .addCase(updateProfileSettings.rejected, (state, action) => {
                state.isLoading = false;
                // Binds the "username already taken" or backend validator messages back to your alert banner
                
            })
            .addCase(changePasswordThunk.pending, (state) => { state.isLoading = true;  })
            .addCase(changePasswordThunk.fulfilled, (state) => { state.isLoading = false; })
            .addCase(changePasswordThunk.rejected, (state) => { state.isLoading = false;  })
    }
})

export default authSlice.reducer;
export const { logout } = authSlice.actions;