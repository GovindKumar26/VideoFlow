import { useState } from "react";

function AudienceToggle() {
  // 1. Keeping track of the active audience ("creators" or "developers")
  const [audience, setAudience] = useState("creators");

  return (
    <div className="bg-white/5 rounded-full p-1 hidden sm:flex items-center gap-1 border border-white/10">
      
      {/* Creators Button */}
      <button
        onClick={() => setAudience("creators")} // Fixed: Added quotes around "creators"
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          audience === "creators" // Fixed: Changed 'mode' to 'audience'
            ? "bg-white text-black"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        Creators
      </button>

      {/* Developers Button */}
      <button
        onClick={() => setAudience("developers")} // Fixed: Added quotes around "developers"
        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          audience === "developers" // Fixed: Added dynamic styling for developers too!
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