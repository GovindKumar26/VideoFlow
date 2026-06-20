// src/features/videos/components/EmbedModal.jsx

/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import api from "@/axiosApi/axios"; 

const EmbedModal = ({ videoId }) => {
    const [activeTab, setActiveTab] = useState("general"); // 'general' or 'secured'
    const [studentEmail, setStudentEmail] = useState("");
    const [compiledEmbedCode, setCompiledEmbedCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // Standard public fallback snippet
    const buildGeneralEmbed = () => {
        setErrorMsg("");
        const code = `<div style="position:relative; width:100%; padding-top:56.25%; background:#000; border-radius:12px; overflow:hidden;">
    <iframe src="${apiBaseUrl}/files/${videoId}/embed" loading="lazy" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
</div>`;
        setCompiledEmbedCode(code);
    };

    // Fire generation when hitting the standard embed tab
    useEffect(() => {
        if (activeTab === "general") {
            buildGeneralEmbed();
        } else {
            setCompiledEmbedCode("");
            setStudentEmail("");
        }
    }, [activeTab, videoId]);

    const handleGenerateSecuredEmbed = async (e) => {
        e.preventDefault();
        if (!studentEmail.trim()) return;
        setLoading(true);
        setErrorMsg("");

        try {
            // 🚀 Call your backend signing endpoint safely utilizing credentials cookies
            const response = await api.get(`${apiBaseUrl}/files/${videoId}/sign-embed`, {
                params: { email: studentEmail.trim() },
                withCredentials: true
            });
            
            const { signature } = response.data;
            const encodedEmail = encodeURIComponent(studentEmail.trim().toLowerCase());

            // Compile the individualized iframe script payload
            const code = `<div style="position:relative; width:100%; padding-top:56.25%; background:#000; border-radius:12px; overflow:hidden;">
    <iframe 
        src="${apiBaseUrl}/files/${videoId}/embed?viewer=${encodedEmail}&sig=${signature}" 
        loading="lazy" 
        style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" 
        allow="autoplay; encrypted-media; picture-in-picture" 
        allowfullscreen>
    </iframe>
</div>`;
            
            setCompiledEmbedCode(code);
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.message || "Failed to compile secured signature token.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto bg-[#111833] border border-[#273155] rounded-xl p-6 text-[#eef2ff]">
            <h3 className="text-xl font-bold mb-2">Embed Video Stream</h3>
            <p className="text-xs text-gray-400 mb-6">Configure clean, secure embedded HTML5 canvas elements ready for external deployment pipelines.</p>
            
            {/* Tab Toggles */}
            <div className="flex border-b border-[#273155] mb-5 gap-4">
                <button
                    onClick={() => setActiveTab("general")}
                    className={`pb-2 text-sm font-medium transition-all ${activeTab === "general" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-gray-200"}`}
                >
                    Standard Embed
                </button>
                <button
                    onClick={() => setActiveTab("secured")}
                    className={`pb-2 text-sm font-medium transition-all ${activeTab === "secured" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-gray-400 hover:text-gray-200"}`}
                >
                    🔒 High-Ticket Secured Embed
                </button>
            </div>

            {/* Tab View Panels */}
            {activeTab === "secured" && (
                <form onSubmit={handleGenerateSecuredEmbed} className="bg-[#0b1020] border border-[#273155] p-4 rounded-lg mb-5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono mb-1">Target Cohort Student Registration</h4>
                    <p className="text-xs text-gray-400 mb-3">Locks this code snapshot to a single student's identity via hash cryptography signatures.</p>
                    
                    <div className="flex gap-2">
                        <input
                            type="email"
                            required
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="student-identifier@university.edu"
                            className="flex-1 bg-[#111833] border border-[#273155] px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-gray-600"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-700 hover:bg-emerald-600 px-4 py-2 rounded-lg text-xs font-semibold text-white tracking-wide uppercase transition-all disabled:opacity-40"
                        >
                            {loading ? "Signing..." : "Sign Key"}
                        </button>
                    </div>
                    {errorMsg && <p className="text-xs text-red-400 mt-2 font-medium">{errorMsg}</p>}
                </form>
            )}

            {/* Snippet Output Container Box */}
            {compiledEmbedCode && (
                <div>
                    <span className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">Generated Deployment Snippet</span>
                    <textarea
                        readOnly
                        value={compiledEmbedCode}
                        className="w-full h-32 bg-[#0b1020] border border-[#273155] text-gray-300 font-mono text-xs p-3 rounded-lg focus:outline-none select-all resize-none mb-3"
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(compiledEmbedCode);
                            alert("Snippet copied to your system clipboard! Ready to paste into Notion.");
                        }}
                        className={`w-full font-medium py-2.5 rounded-lg text-sm transition-all text-white shadow-md active:scale-[0.99] ${activeTab === 'secured' ? 'bg-emerald-800 hover:bg-emerald-700' : 'bg-blue-700 hover:bg-blue-600'}`}
                    >
                        📋 Copy Embedding Code Snippet
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmbedModal;