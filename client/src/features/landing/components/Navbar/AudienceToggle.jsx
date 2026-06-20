// 🎯 src/components/layout/AudienceToggle.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 🪡 Import the navigation hook

function AudienceToggle() {
  const [audience, setAudience] = useState("creators");
  const navigate = useNavigate(); // Initialize the engine

  const handleAudienceChange = (targetAudience) => {
    setAudience(targetAudience);
    
    if (targetAudience === "developers") {
      // 🚀 Jump directly to your documentation support workspace page
      navigate("/docs");
    } else {
      // If they click back to creators, slide them back to the main landing page root
      navigate("/");
    }
  };

  return (
    <div className="bg-white/5 rounded-full p-1 hidden sm:flex items-center gap-1 border border-white/10">
      
      {/* Creators Button */}
      <button
        onClick={() => handleAudienceChange("creators")}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          audience === "creators"
            ? "bg-white text-black"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        Creators
      </button>

      {/* Developers Button */}
      <button
        onClick={() => handleAudienceChange("developers")}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          audience === "developers"
            ? "bg-white text-black"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        Developers
      </button>

    </div>
  );
}

export default AudienceToggle;