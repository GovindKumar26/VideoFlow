// src/features/developer/pages/DeveloperConsole.jsx
import React, { useState } from "react";
import ApiKeyManager from "../components/ApiKeyManager";
import { Key, Webhook, Terminal } from "lucide-react";
import WebhookConfig from "../components/WebhookConfig";

const DeveloperConsole = () => {
    const [activeSubTab, setActiveSubTab] = useState("keys"); // 'keys' or 'webhooks'

    return (
        <div className="w-full max-w-7xl mx-auto p-6 text-foreground">
            {/* Context Header */}
            <div className="mb-8">
                <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-2">
                    System Administration
                </p>
                <h1 className="font-display text-4xl uppercase tracking-tighter mb-2">
                    Developer Infrastructure
                </h1>
                <p className="text-muted-foreground text-sm">
                    Provision API keys, verify event delivery logs, and manage webhook communication handshakes.
                </p>
            </div>

            {/* Sub-tab navigation bar switcher inside the workspace */}
            <div className="flex border-b border-border mb-6 gap-6 text-sm font-medium">
                <button
                    onClick={() => setActiveSubTab("keys")}
                    className={`pb-3 flex items-center gap-2 transition-colors relative ${
                        activeSubTab === "keys" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Key className="h-4 w-4" />
                    <span>API Credentials</span>
                </button>
                <button
                    onClick={() => setActiveSubTab("webhooks")}
                    className={`pb-3 flex items-center gap-2 transition-colors relative ${
                        activeSubTab === "webhooks" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Webhook className="h-4 w-4" />
                    <span>Webhook Pipeline</span>
                </button>
            </div>

            {/* Tab content areas */}
            {activeSubTab === "keys" && (
                <div className="animate-fade-in">
                    <ApiKeyManager />
                </div>
            )}

            {activeSubTab === "webhooks" && (
                <div className="animate-fade-in space-y-6">
                    {/* Placeholder content where we will build the live log consumer framework */}
                   <WebhookConfig />
                </div>
            )}
        </div>
    );
};

export default DeveloperConsole;