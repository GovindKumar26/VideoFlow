import AppShell from "@/components/layout/AppShell";
import { useState } from "react";

function Settings() {
    const [displayName, setDisplayName] = useState("Govind Kumar");
    const [username, setUsername] = useState("govind");
    const [email, setEmail] = useState("govind@example.com");

    const [notifications, setNotifications] = useState(true);

    const handleSave = () => {
        alert("Settings saved");
    };

    return (
        <AppShell>
            <div className="px-8 py-10 max-w-5xl">
                {/* Header */}
                <div className="mb-10">
                    <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
                        Account
                    </p>

                    <h1 className="font-display text-5xl uppercase tracking-tighter">
                        Settings
                    </h1>

                    <p className="text-muted-foreground mt-3">
                        Manage your profile, account, and preferences.
                    </p>
                </div>

                {/* Profile */}
                <section className="rounded-xl border border-border bg-card p-6 mb-6">
                    <h2 className="font-display text-2xl uppercase mb-6">
                        Profile
                    </h2>

                    <div className="grid gap-5">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                                Display Name
                            </label>

                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-border bg-background"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                                Username
                            </label>

                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-border bg-background"
                            />
                        </div>
                    </div>
                </section>

                {/* Account */}
                <section className="rounded-xl border border-border bg-card p-6 mb-6">
                    <h2 className="font-display text-2xl uppercase mb-6">
                        Account
                    </h2>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                            Email Address
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border border-border bg-background"
                        />
                    </div>

                    <button className="mt-6 px-4 py-2 rounded-lg border border-border hover:bg-white/[0.03]">
                        Change Password
                    </button>
                </section>

                {/* Preferences */}
                <section className="rounded-xl border border-border bg-card p-6 mb-8">
                    <h2 className="font-display text-2xl uppercase mb-6">
                        Preferences
                    </h2>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">
                                Email Notifications
                            </p>

                            <p className="text-sm text-muted-foreground">
                                Receive updates about uploads and processing.
                            </p>
                        </div>

                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`relative w-14 h-8 rounded-full transition-colors ${notifications ? "bg-primary" : "bg-white/10"
                                }`}
                        >
                            <span
                                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${notifications ? "translate-x-6" : ""
                                    }`}
                            />
                        </button>
                    </div>
                </section>

                {/* Save */}
                <button
                    onClick={handleSave}
                    className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                    Save Changes
                </button>
            </div>

        </AppShell>
    );
}

export default Settings;