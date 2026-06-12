import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import {
    LayoutDashboard,
    Upload,
    Film,
    Settings,
    LogOut,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout, logoutUser } from "@/features/auth/authSlice";

const navItems = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Upload",
        path: "/upload",
        icon: Upload,
    },
    {
        label: "Videos",
        path: "/videos",
        icon: Film,
    },
    {
        label: "Settings",
        path: "/settings",
        icon: Settings,
    },
];



function AppShell({ children }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleClick = async () => {
        try {
            // 1. Fire the async handshake and unwrap its promise lifecycle resolution profile
            await dispatch(logoutUser()).unwrap();

            // 2. Redirect the browser location state cleanly back to the root sign-in page
            navigate("/auth/signin");
        } catch (error) {
            console.error("Session teardown error:", error);
            // Fallback redirection logic even on rejection
            navigate("/auth/signin");
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 border-r border-border flex-col">
                {/* Logo */}
                <div className="px-6 py-5 border-b border-border">
                    <Link
                        to="/dashboard"
                        className="font-display text-2xl tracking-tighter uppercase text-primary"
                    >
                        Videoflow
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        const isActive =
                            location.pathname === item.path ||
                            (item.path === "/videos" &&
                                location.pathname.startsWith("/videos"));

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-border">
                    <button onClick={handleClick} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Topbar */}
                <header className="h-16 border-b border-border flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">

                        <button
                            className="md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                            Creator Studio
                        </p>

                    </div>

                    <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                        G
                    </div>
                </header>

                {/* Page Content */}

                {sidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />

                        {/* Drawer */}
                        <aside className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-50 md:hidden flex flex-col">

                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <span className="font-display text-2xl tracking-tighter uppercase text-primary">
                                    Videoflow
                                </span>

                                <button onClick={() => setSidebarOpen(false)}>
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <nav className="flex-1 p-4 space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </aside>
                    </>
                )}
                <main>{children}</main>
            </div>
        </div>
    );
}

export default AppShell;