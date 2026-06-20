/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars, react-hooks/exhaustive-deps */

// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Loader2, AlertCircle, Save, Key } from "lucide-react";
// import { updateProfileSettings } from "@/features/auth/authSlice";
// import AppShell from "@/components/layout/AppShell";

// function Settings() {
//   const dispatch = useDispatch();

//   // 1. Pull current user context metadata straight out of Redux
//   const { user, loading, error } = useSelector((state) => state.auth);

//   // 2. Local element state buffers for form fields
//   const [displayName, setDisplayName] = useState("");
//   const [username, setUsername] = useState("");
//   const [email, setEmail] = useState("");
//   const [notifications, setNotifications] = useState(true);
//   const [saveSuccess, setSaveSuccess] = useState(false);

//   // 3. Hydrate state buffers the second user data arrives from the socket
//   useEffect(() => {
//     if (user) {
//       setDisplayName(user.name || "");
//       setUsername(user.username || "");
//       setEmail(user.email || "");
//     }
//   }, [user]);

//   const handleSave = async (e) => {
//     e.preventDefault();
//     setSaveSuccess(false);

//     try {
//       // Dispatch update action payload bundle to backend
//       await dispatch(
//         updateProfileSettings({
//           name: displayName.trim(),
//           username: username.trim().toLowerCase(),
//         })
//       ).unwrap();

//       setSaveSuccess(true);
//       setTimeout(() => setSaveSuccess(false), 4000); // Clear alert box flash automatically
//     } catch (err) {
//       console.error("Profile synchronization crash:", err);
//     }
//   };

//   return (
//     <AppShell>
//       <div className="px-8 py-10 max-w-4xl mx-auto">
        
//         {/* Page Identity Header */}
//         <div className="mb-10">
//           <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
//             Account Management
//           </p>
//           <h1 className="font-display text-5xl uppercase tracking-tighter">
//             Settings
//           </h1>
//           <p className="text-muted-foreground mt-3">
//             Manage your profile identity, email coordinates, and platform preferences.
//           </p>
//         </div>

//         {/* Dynamic Notification Message Rows */}
//         {error && (
//           <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-3 animate-fade-in">
//             <AlertCircle className="h-5 w-5 shrink-0" />
//             <span>Update Rejected: {error}</span>
//           </div>
//         )}

//         {saveSuccess && (
//           <div className="mb-6 p-4 rounded-lg border border-green-500/20 bg-green-500/5 text-green-400 text-sm flex items-center gap-3">
//             <span>✓ Configuration profiles committed successfully to cloud database.</span>
//           </div>
//         )}

//         <form onSubmit={handleSave} className="space-y-6">
          
//           {/* Section A: Profile Customization Fields */}
//           <section className="rounded-xl border border-border bg-card p-6">
//             <h2 className="font-display text-2xl uppercase mb-6 tracking-tight">
//               Profile Details
//             </h2>

//             <div className="grid gap-6 md:grid-cols-2">
//               <div>
//                 <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
//                   Display Name
//                 </label>
//                 <input
//                   type="text"
//                   value={displayName}
//                   onChange={(e) => setDisplayName(e.target.value)}
//                   placeholder="e.g. Govind Kumar"
//                   className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
//                 />
//               </div>

//               <div>
//                 <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
//                   Username Custom Handle
//                 </label>
//                 <div className="relative flex items-center">
//                   <span className="absolute left-4 text-sm font-mono text-muted-foreground select-none">@</span>
//                   <input
//                     type="text"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))} // Auto-strip spacing indicators
//                     placeholder="govind"
//                     className="w-full h-11 pl-8 pr-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors font-mono"
//                   />
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* Section B: Security & Core Credentials */}
//           <section className="rounded-xl border border-border bg-card p-6">
//             <h2 className="font-display text-2xl uppercase mb-6 tracking-tight">
//               Account Security
//             </h2>

//             <div className="max-w-md">
//               <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
//                 Registered Email Address
//               </label>
//               <input
//                 type="email"
//                 disabled // 🛡️ Protect user accounts from malicious email interception hijacking swaps
//                 value={email}
//                 className="w-full h-11 px-4 rounded-lg border border-border bg-background/40 text-muted-foreground text-sm cursor-not-allowed select-none"
//               />
//               <p className="text-[11px] text-muted-foreground mt-2">
//                 Your email address serves as your secure account anchor and cannot be modified directly.
//               </p>
//             </div>

//             <div className="border-t border-border mt-6 pt-6">
//               <button 
//                 type="button"
//                 className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-white/[0.03] text-sm font-medium transition-colors"
//               >
//                 <Key className="h-4 w-4" />
//                 Change Password
//               </button>
//             </div>
//           </section>

//           {/* Section C: Functional Preference Switches */}
//           <section className="rounded-xl border border-border bg-card p-6">
//             <h2 className="font-display text-2xl uppercase mb-6 tracking-tight">
//               Preferences
//             </h2>

//             <div className="flex items-center justify-between gap-6">
//               <div className="flex-1">
//                 <p className="font-medium text-sm text-foreground">
//                   Email Stream Notifications
//                 </p>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   Receive real-time processing dispatches the exact second FFmpeg transcoding loops conclude.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={() => setNotifications(!notifications)}
//                 className={`relative w-14 h-8 rounded-full shrink-0 transition-colors duration-200 focus:outline-none ${
//                   notifications ? "bg-primary" : "bg-white/10"
//                 }`}
//               >
//                 <span
//                   className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
//                     notifications ? "translate-x-6" : ""
//                   }`}
//                 />
//               </button>
//             </div>
//           </section>

//           {/* Action Execution Footer */}
//           <div className="pt-2">
//             <button
//               type="submit"
//               disabled={loading}
//               className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium text-sm"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                   <span>Committing Changes...</span>
//                 </>
//               ) : (
//                 <>
//                   <Save className="h-4 w-4" />
//                   <span>Save Changes</span>
//                 </>
//               )}
//             </button>
//           </div>

//         </form>
//       </div>
//     </AppShell>
//   );
// }

// export default Settings;





import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, AlertCircle, Save, Key, X } from "lucide-react";
import { updateProfileSettings, changePasswordThunk } from "@/features/auth/authSlice";
import AppShell from "@/components/layout/AppShell";

function Settings() {
  const dispatch = useDispatch();

  // 1. Pull global authentication stream contexts from Redux cache layer
  const { user, loading, error } = useSelector((state) => state.auth);

  // 2. Main Profile Layout Form Fields
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // 3. 🔑 Local UI States for the Change Password Overlay Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 4. Hydrate input state string buffers the second user metadata resolves
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Handle Profile Mutation Form Commit (Name & Username updates)
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);

    try {
      await dispatch(
        updateProfileSettings({
          name: displayName.trim(),
          username: username.trim().toLowerCase(),
        })
      ).unwrap();

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000); 
    } catch (err) {
      console.error("Profile synchronization crash:", err);
    }
  };

  // Handle Security Password Change Form Commit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    // Defensive sanity checks
    if (newPassword.length < 6) {
      setPasswordError("New password parameter must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password inputs do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      
      // Fire the direct payload bundle down to Express via our Redux slice thunk
      await dispatch(
        changePasswordThunk({ currentPassword, newPassword })
      ).unwrap();

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Autoclose modal loop following user confirmation feedback
      setTimeout(() => {
        setIsModalOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err) {
      // Catches bcrypt mismatch 400 status errors straight from our controller
      setPasswordError(err || "Failed to update security credentials.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="px-8 py-10 max-w-4xl mx-auto relative">
        
        {/* Page Identity Header */}
        <div className="mb-10">
          <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
            Account Management
          </p>
          <h1 className="font-display text-5xl uppercase tracking-tighter">
            Settings
          </h1>
          <p className="text-muted-foreground mt-3">
            Manage your profile identity, email coordinates, and platform preferences.
          </p>
        </div>

        {/* Profile Modification Network Banner Status Indicators */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-3 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Update Rejected: {error}</span>
          </div>
        )}

        {profileSuccess && (
          <div className="mb-6 p-4 rounded-lg border border-green-500/20 bg-green-500/5 text-green-400 text-sm flex items-center gap-3">
            <span>✓ Configuration profiles committed successfully to cloud database.</span>
          </div>
        )}

        {/* 📋 PROFILE FORM DETAILS */}
        <form onSubmit={handleProfileSave} className="space-y-6">
          
          {/* Section A: Profile Customization Fields */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl uppercase mb-6 tracking-tight">
              Profile Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Govind Kumar"
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Username Custom Handle
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-sm font-mono text-muted-foreground select-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))} 
                    placeholder="govind"
                    className="w-full h-11 pl-8 pr-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section B: Security & Core Credentials */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl uppercase mb-6 tracking-tight">
              Account Security
            </h2>

            <div className="max-w-md">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Registered Email Address
              </label>
              <input
                type="email"
                disabled 
                value={email}
                className="w-full h-11 px-4 rounded-lg border border-border bg-background/40 text-muted-foreground text-sm cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-muted-foreground mt-2">
                Your email address serves as your secure account anchor and cannot be modified directly.
              </p>
            </div>

            <div className="border-t border-border mt-6 pt-6">
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)} // 🚀 Pops open the secure overlay view
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-white/[0.03] text-sm font-medium transition-colors"
              >
                <Key className="h-4 w-4" />
                Change Password
              </button>
            </div>
          </section>

          {/* Section C: Functional Preference Switches */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl uppercase mb-6 tracking-tight">
              Preferences
            </h2>

            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">
                  Email Stream Notifications
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive real-time processing dispatches the exact second FFmpeg transcoding loops conclude.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`relative w-14 h-8 rounded-full shrink-0 transition-colors duration-200 focus:outline-none ${
                  notifications ? "bg-primary" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    notifications ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Core Profile Saving Form Footer Submit Trigger */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Committing Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ─────────────── 🔐 BLUR MODAL OVERLAY SHEET CONTAINER ─────────────── */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-150 text-foreground">
              
              {/* Close Button Cross */}
              <button 
                type="button"
                onClick={() => { setIsModalOpen(false); setPasswordError(""); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="font-display text-xl uppercase mb-1 flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" /> Update Password
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Modify your secure application credentials footprint.</p>

              {/* Password Exception Status Indicators */}
              {passwordError && (
                <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-lg border border-green-500/20 bg-green-500/5 text-green-400 text-xs">
                  ✓ Credentials modified successfully! Closing security panel context...
                </div>
              )}

              {/* Password Processing Form Input Context */}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                    Current Password
                  </label>
                  <input 
                    type="password" 
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                    New Password
                  </label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-border mt-6">
                  <button 
                    type="button"
                    onClick={() => { setIsModalOpen(false); setPasswordError(""); }}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={passwordLoading || passwordSuccess}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2 disabled:opacity-40"
                  >
                    {passwordLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span>Save Password</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

export default Settings;