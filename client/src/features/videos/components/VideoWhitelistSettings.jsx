import React, { useState, useEffect } from "react";
// 🎯 1. IMPORT YOUR CUSTOM API INSTANCE (Saves you from parsing tokens manually)
import api from "@/axiosApi/axios"; 

const VideoWhitelistSettings = ({ videoId }) => {
    const [domains, setDomains] = useState([]);
    const [newDomain, setNewDomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // Pull current configurations from DB on mount
    useEffect(() => {
        const fetchVideoDetails = async () => {
            const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
            try {
                // 🚀 Uses your configured interceptors automatically
                const response = await api.get(`${apiBaseUrl}/files/${videoId}`);
                setDomains(response.data.allowedDomains || []);
            } catch (err) {
                console.error("Failed to fetch whitelisted domains.");
            }
        };
        if (videoId) fetchVideoDetails();
    }, [videoId]);

    const handleAddDomain = (e) => {
        e.preventDefault();
        const cleanDomain = newDomain
            .trim()
            .toLowerCase()
            .replace(/^(https?:\/\/)?(www\.)?/, "")
            .split("/")[0];
        
        if (cleanDomain && !domains.includes(cleanDomain)) {
            setDomains([...domains, cleanDomain]);
            setNewDomain("");
        }
    };

    const handleRemoveDomain = (domainToRemove) => {
        setDomains(domains.filter((d) => d !== domainToRemove));
    };

    const handleSaveWhitelist = async () => {
        setLoading(true);
        setMessage("");

        const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

        try {
            // 🚀 Swap axios.put out for api.put
            // No custom headers config object needed here—your wrapper manages it seamlessly!
            const response = await api.put(`${apiBaseUrl}/files/${videoId}/whitelist`, { 
                domains: domains 
            });
            
            setDomains(response.data.allowedDomains);
            setMessage("✨ Permissions saved successfully!");
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || "Failed to update permissions.";
            setMessage(`❌ ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#111833] border border-[#273155] p-6 rounded-xl text-[#eef2ff]">
            <h3 className="text-lg font-semibold mb-1">Domain Embedding Restrictions</h3>
            <p className="text-sm text-gray-400 mb-4">
                Restrict playback to specific web origins. Leave this section completely empty to keep video playback strictly private to your platform app.
            </p>

            <form onSubmit={handleAddDomain} className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="e.g., canvas.instructure.com or notion.so"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="flex-1 bg-[#0b1020] border border-[#273155] px-4 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#38497f]"
                />
                <button 
                    type="submit" 
                    className="bg-[#1d2a57] hover:bg-[#25356c] border border-[#273155] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
                >
                    Add Domain
                </button>
            </form>

            <div className="flex flex-wrap gap-2 mb-6">
                {domains.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No whitelisted domains added yet. Platform-only access enabled.</span>
                ) : (
                    domains.map((domain) => (
                        <span 
                            key={domain} 
                            className="bg-[#1d2a57] border border-[#273155] pl-3 pr-2 py-1 rounded-full text-xs font-mono inline-flex items-center gap-2 text-gray-200"
                        >
                            {domain}
                            <button 
                                type="button" 
                                onClick={() => handleRemoveDomain(domain)} 
                                className="text-gray-400 hover:text-red-400 text-sm font-bold focus:outline-none px-0.5"
                            >
                                ×
                            </button>
                        </span>
                    ))
                )}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleSaveWhitelist}
                    disabled={loading}
                    className="bg-[#0a3625] hover:bg-[#114c35] border border-[#145239] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? "Saving Settings..." : "Save Whitelist Access"}
                </button>
                {message && (
                    <span className={`text-sm ${message.startsWith("❌") ? "text-red-400" : "text-emerald-400"}`}>
                        {message}
                    </span>
                )}
            </div>
        </div>
    );
};

export default VideoWhitelistSettings;