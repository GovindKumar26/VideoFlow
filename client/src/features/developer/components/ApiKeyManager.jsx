// src/features/developer/components/ApiKeyManager.jsx

/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";
import api from "@/axiosApi/axios"; // Utilizing your custom authenticated axios setup instance

const ApiKeyManager = () => {
    const [keys, setKeys] = useState([]);
    const [keyName, setKeyName] = useState("");
    const [generatedKey, setGeneratedKey] = useState(null); // Holds the single-exposure clear-text key
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");

    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // 🎯 1. Fetch all active masked keys for the authenticated developer
    const fetchKeys = async () => {
        try {
            setFetching(true);
            const response = await api.get(`${apiBaseUrl}/developer/api-keys`, { withCredentials: true });
            setKeys(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load API keys.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    // 🎯 2. Dispatch a token generation work order
    const handleCreateKey = async (e) => {
        e.preventDefault();
        if (!keyName.trim()) return;
        setLoading(true);
        setError("");

        try {
            const response = await api.post(
                `${apiBaseUrl}/developer/api-keys`,
                { name: keyName.trim() },
                { withCredentials: true }
            );
            
            // Set the cleartext key response object to trigger our single-exposure UI layout box
            setGeneratedKey(response.data);
            setKeyName("");
            fetchKeys(); // Refresh database table rows
        } catch (err) {
            setError(err.response?.data?.message || "Failed to generate API token.");
        } finally {
            setLoading(false);
        }
    };

    // 🎯 3. Revoke / Terminate a token key signature
    const handleRevokeKey = async (keyId) => {
        if (!window.confirm("Are you absolutely sure you want to revoke this token key? Any system integration using it will immediately drop connections.")) return;

        try {
            await api.delete(`${apiBaseUrl}/developer/api-keys/${keyId}`, { withCredentials: true });
            fetchKeys(); // Re-index list
        } catch (err) {
            alert(err.response?.data?.message || "Failed to revoke API key.");
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-[#0b1020] text-[#eef2ff] min-h-screen">
            {/* Header Block */}
            <div className="mb-8 border-b border-[#273155] pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Developer API Credentials</h1>
                <p className="text-sm text-gray-400 mt-1">Authenticate your application pipelines programmatically using secure, high-entropy tokens.</p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-950/40 border border-red-900 rounded-lg text-xs text-red-400 font-medium">
                    ⚠️ {error}
                </div>
            )}

            {/* Step 1: Token Creation Box */}
            <form onSubmit={handleCreateKey} className="bg-[#111833] border border-[#273155] rounded-xl p-5 mb-8 shadow-xl">
                <h3 className="text-sm font-semibold mb-1 text-blue-400 font-mono uppercase tracking-wider">Generate Fresh API Key</h3>
                <p className="text-xs text-gray-400 mb-4">Give your programmatic access token a descriptive identifier (e.g., "Production Ingest Server").</p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        required
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        placeholder="e.g., AWS S3 Worker Trigger Pipeline"
                        className="flex-1 bg-[#0b1020] border border-[#273155] px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-500 font-semibold px-5 py-2 rounded-lg text-xs tracking-wide uppercase transition-all disabled:opacity-40 shadow-md whitespace-nowrap"
                    >
                        {loading ? "Computing Key..." : "Provision Token"}
                    </button>
                </div>
            </form>

            {/* Step 2: Explosive "Reveal Once" Modal / UI Layer */}
            {generatedKey && (
                <div className="mb-8 bg-gradient-to-r from-amber-950/30 to-yellow-950/20 border-2 border-amber-500/40 rounded-xl p-5 shadow-2xl animate-fade-in">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2">
                        <span>🔒 CRITICAL: Copy Your Secret Token Key Parameter Now</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                        For institutional safety regulations, this string hash will **never be shown to you again**. If you close this page or refresh your browser, you must generate a brand new key to replace it.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 bg-[#0b1020] p-3 rounded-lg border border-amber-600/30 font-mono text-xs text-amber-300 select-all mb-4 break-all">
                        {generatedKey.apiKey}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(generatedKey.apiKey);
                                alert("API Key string token safely copied to clipboard!");
                            }}
                            className="bg-amber-600 hover:bg-amber-500 text-[#0b1020] font-bold px-4 py-2 rounded-md text-xs transition-all shadow-md"
                        >
                            📋 Copy String Token
                        </button>
                        <button
                            onClick={() => setGeneratedKey(null)}
                            className="border border-[#273155] hover:bg-[#111833] text-gray-400 px-4 py-2 rounded-md text-xs transition-all"
                        >
                            I Have Saved This Token Safely
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Keys Overview List Grid / Table */}
            <div className="bg-[#111833] border border-[#273155] rounded-xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-[#273155] bg-[#161f42]/40">
                    <h3 className="text-sm font-semibold font-mono text-gray-300 uppercase tracking-wider">Active Authorized Keysets</h3>
                </div>

                {fetching ? (
                    <div className="p-8 text-center text-xs text-gray-500 font-mono">Indexing database registry keys...</div>
                ) : keys.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500 font-mono">No API configurations initialized. Your system integration pipelines are currently dormant.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-[#273155] text-gray-400 uppercase font-mono bg-[#0b1020]/30">
                                    <th className="p-4">Key Identifier / Name</th>
                                    <th className="p-4">Token Mask Mapping</th>
                                    <th className="p-4">Created Date</th>
                                    <th className="p-4">Last Connection Check</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#273155]/60 font-mono">
                                {keys.map((key) => (
                                    <tr key={key._id} className="hover:bg-[#161f42]/20 transition-all">
                                        <td className="p-4 font-sans font-medium text-gray-200">{key.name}</td>
                                        <td className="p-4 text-blue-400/80">VF_API_KEY_••••__{key.truncatedKey}</td>
                                        <td className="p-4 text-gray-400">{new Date(key.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-emerald-400/80">
                                            {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never Active"}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleRevokeKey(key._id)}
                                                className="bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-400 px-3 py-1 rounded-md text-[11px] transition-all"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiKeyManager;