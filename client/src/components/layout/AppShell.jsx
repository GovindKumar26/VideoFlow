import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Terminal, X, ShieldAlert, Radio, Code2 } from "lucide-react"; // 🎯 Added ShieldAlert
import { useState } from "react";
import { useSocketNotifications } from "@/hooks/useSocketNotifications";

import {
    LayoutDashboard,
    Upload,
    Film,
    Settings,
    LogOut,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "@/features/auth/authSlice";
import NotificationDropdown from "./NotificationDropdown";

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
        label: "Record",
        path: "/record",
        icon: Radio // or Video icon from lucide-react
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
    {
        label: "Dev Console",
        path: "/developer",
        icon: Terminal,
    },
    {
        label: "Documentation",
        path: "/docs",
        icon: Code2,
    },
];

function AppShell({ children }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

   const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

    // 📡 Pass the login state flag directly to activate the connection lanes
    useSocketNotifications(isAuthenticated);

    const authState = useSelector((state) => state.auth);

    // 🎯 Checks if 'role' is directly on the root state. If not, checks state.user.role!
    const currentRole = authState?.role || authState?.user?.role;
    const currentName = authState?.name || authState?.user?.name || "Admin";

    // 🎯 Securely establishes your layout verification flag
    const isAdminUser = currentRole === "admin";

    const handleClick = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate("/auth/signin");
        } catch (error) {
            console.error("Session teardown error:", error);
            navigate("/auth/signin");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Desktop Sidebar */}
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

                {/* Desktop Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            location.pathname === item.path ||
                            (item.path === "/videos" && location.pathname.startsWith("/videos"));

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

                    {/* 🚨 Desktop Admin Portal Section */}
                    {isAdminUser && (
                        <div className="pt-4 mt-4 border-t border-border space-y-1">
                            <span className="px-4 text-[10px] font-mono font-semibold uppercase text-muted-foreground tracking-wider block mb-2">
                                System Operations
                            </span>
                            <Link
                                to="/admin/dlq"
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium transition-colors ${location.pathname === "/admin/dlq"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/10 font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                                    }`}
                            >
                                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                                <span>DLQ Management</span>
                            </Link>
                        </div>
                    )}
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

                    

                    <div className="flex items-center gap-4">
        {/* 🔔 Live Action Panel Bell Dropdown Asset */}
        <NotificationDropdown />

        {/* User Profile Bubble Bubble */}
        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary uppercase select-none">
            {currentName.charAt(0)}
        </div>
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

                        {/* Mobile Drawer */}
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
                                    const isActive = location.pathname === item.path;

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
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

                                {/* 🚨 Mobile Admin Portal Section */}
                                {isAdminUser && (
                                    <div className="pt-4 mt-4 border-t border-border space-y-1">
                                        <span className="px-4 text-[10px] font-mono font-semibold uppercase text-muted-foreground tracking-wider block mb-2">
                                            System Operations
                                        </span>
                                        <Link
                                            to="/admin/dlq"
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium transition-colors ${location.pathname === "/admin/dlq"
                                                ? "bg-red-500/10 text-red-400 border border-red-500/10 font-semibold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                                                }`}
                                        >
                                            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                                            <span>DLQ Management</span>
                                        </Link>
                                    </div>
                                )}
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