import React, { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import { 
  Play, Pause, Heart, Search, Menu, X, Radio, 
  Volume2, User, Loader2
} from "lucide-react";

const PROXY_URL = "https://radio-proxy.ajaydubey162004.workers.dev/?url=";

// ==========================================
// 📻 CUSTOM LOCAL STATIONS
// Add any station here that the global API is missing.
// ==========================================
const CUSTOM_STATIONS = [
  {
    id: "custom-vividh-bharati",
    name: "Vividh Bharati (Custom)",
    country: "India",
    url: "https://air.pc.cdn.bitgravity.com/air/live/pbaudio001/master.m3u8",
    favicon: "https://upload.wikimedia.org/wikipedia/en/thumb/9/91/All_India_Radio_logo.svg/220px-All_India_Radio_logo.svg.png"
  },
  {
    id: "custom-air-fm-gold",
    name: "AIR FM Gold",
    country: "India",
    url: "https://air.pc.cdn.bitgravity.com/air/live/pbaudio002/master.m3u8",
    favicon: ""
  }
];
// ==========================================

export default function App() {
  const [stations, setStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // UI Panels State
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
  // Audio State
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [favorites, setFavorites] = useState([]);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const savedFavs = localStorage.getItem("activeRadioFavs");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Fetch API Stations + Combine with Custom Stations
  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      try {
        let url = `https://de1.api.radio-browser.info/json/stations/search?limit=60&order=clickcount&reverse=true`;
        if (searchQuery.trim() !== "") {
          url += `&name=${encodeURIComponent(searchQuery.trim())}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        
        const apiStations = data
          .filter(s => s.url_resolved)
          .map(s => ({
            id: s.stationuuid,
            name: s.name,
            country: s.country,
            url: s.url_resolved,
            favicon: s.favicon
          }));

        // Filter custom stations based on search query
        const matchedCustom = CUSTOM_STATIONS.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          searchQuery.trim() === ""
        );
          
        // Merge and remove duplicates by URL
        const combined = [...matchedCustom, ...apiStations];
        const uniqueStations = Array.from(new Map(combined.map(item => [item.url, item])).values());

        setStations(uniqueStations);
      } catch (err) {
        console.error("Failed to fetch stations", err);
        setStations(CUSTOM_STATIONS);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchStations();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handlePlayToggle = (station) => {
    if (currentStation?.id === station.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setCurrentStation(station);
    setBuffering(true);
    setIsPlaying(false);
    
    const secureUrl = station.url.startsWith('http://') 
      ? `${PROXY_URL}${encodeURIComponent(station.url)}` 
      : station.url;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (secureUrl.includes('.m3u8') || secureUrl.includes('m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(secureUrl);
        hls.attachMedia(audioRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          audioRef.current.play().then(() => {
            setBuffering(false);
            setIsPlaying(true);
          }).catch(err => {
            console.error("Playback failed:", err);
            setBuffering(false);
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("HLS Error:", data);
            setBuffering(false);
            setIsPlaying(false);
          }
        });
      } else if (audioRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        audioRef.current.src = secureUrl;
        audioRef.current.play().then(() => {
          setBuffering(false);
          setIsPlaying(true);
        }).catch(e => { console.error(e); setBuffering(false); });
      }
    } else {
      audioRef.current.src = secureUrl;
      audioRef.current.play().then(() => {
        setBuffering(false);
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback failed:", err);
        setBuffering(false);
        setIsPlaying(false);
      });
    }
  };

  const toggleFavorite = (station, e) => {
    e.stopPropagation();
    const updated = favorites.find(f => f.id === station.id) 
      ? favorites.filter(f => f.id !== station.id)
      : [...favorites, station];
    setFavorites(updated);
    localStorage.setItem("activeRadioFavs", JSON.stringify(updated));
  };

  const closePanels = () => {
    setLeftPanelOpen(false);
    setRightPanelOpen(false);
  };

  const themeText = "animated-color";
  const themeSubText = "text-sky-800/60"; 
  const glassPanel = "bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)]";

  return (
    <div className="relative min-h-screen overflow-hidden font-sans transition-all duration-1000 animated-bg selection:bg-amber-400 selection:text-white">
      
      {/* Retro Noise Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIi8+PC9zdmc+')]"></div>

      <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />

      {(leftPanelOpen || rightPanelOpen) && (
        <div className="absolute inset-0 z-30" onClick={closePanels}></div>
      )}

      {/* TOP NAVIGATION */}
      <header className={`relative z-10 flex items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm w-full`}>
        <div className="flex gap-2 md:gap-4">
          <button onClick={() => setLeftPanelOpen(true)} className="p-2 md:p-2.5 rounded-full bg-white/30 hover:bg-white/60 transition-all shadow-sm border border-white/40">
            <Menu size={20} className={themeText} />
          </button>
        </div>
        
        <h1 className={`text-2xl md:text-3xl font-serif tracking-widest drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] flex items-center gap-2 ${themeText}`}>
          {/* Swapped the Disc icon out for a pulsing Radio icon */}
          <Radio className={`animate-pulse opacity-80 ${themeText}`} size={24} />
          Active Radio
        </h1>
        
        <div className="flex gap-2 md:gap-4 items-center">
          <button onClick={() => setRightPanelOpen(true)} className="p-2 md:p-2.5 rounded-full bg-white/30 hover:bg-white/60 transition-all shadow-sm border border-white/40">
            <User size={20} className={themeText} />
          </button>
        </div>
      </header>

      {/* FLOATING PANELS */}
      <aside className={`absolute top-20 left-0 z-40 w-[80vw] max-w-[260px] h-[70vh] ${glassPanel} rounded-r-[2rem] transform transition-transform duration-500 flex flex-col p-6 shadow-2xl ${leftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="flex justify-between items-center mb-8">
          <span className={`font-serif text-xl font-bold ${themeText}`}>Menu</span>
          <button onClick={() => setLeftPanelOpen(false)} className={themeSubText}><X size={20}/></button>
        </div>
        <nav className="flex flex-col gap-4">
          <button className={`text-left font-medium ${themeText} hover:opacity-70 transition-colors`}>Discover Frequencies</button>
          <button className={`text-left font-medium ${themeText} hover:opacity-70 transition-colors`}>Saved Stations</button>
          <button className={`text-left font-medium ${themeText} hover:opacity-70 transition-colors`}>Settings</button>
        </nav>
      </aside>

      <aside className={`absolute top-20 right-0 z-40 w-[85vw] max-w-[320px] h-[50vh] ${glassPanel} rounded-l-[2rem] transform transition-transform duration-500 flex flex-col p-6 shadow-2xl ${rightPanelOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
         <div className="flex justify-between items-center mb-6">
          <span className={`font-serif text-xl font-bold ${themeText}`}>Account</span>
          <button onClick={() => setRightPanelOpen(false)} className={themeSubText}><X size={20}/></button>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
           <div className={`w-16 h-16 rounded-full border border-white/50 flex items-center justify-center bg-white/50 ${themeText}`}><User size={30}/></div>
           <span className={`font-medium ${themeText}`}>Guest User</span>
           <button className="px-6 py-2 rounded-full animated-button-bg text-white font-bold shadow-md hover:opacity-90 transition-opacity mt-4">Login / Sign Up</button>
        </div>
      </aside>

      {/* MAIN STATION GRID */}
      <main className="relative z-10 h-[calc(100vh-160px)] overflow-y-auto no-scrollbar p-4 md:p-8 mt-2">
        
        {/* Central Search */}
        <div className="flex justify-center mb-8 md:mb-10">
          <div className={`relative w-full max-w-lg ${glassPanel} bg-white/40 rounded-full flex items-center px-4 py-2 md:py-3 shadow-sm`}>
            <Search className={`ml-2 shrink-0 ${themeSubText}`} size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station or frequency (e.g., 93.5)..." 
              spellCheck="false" // Fixed the red squiggly line here
              className={`w-full bg-transparent border-none px-3 py-1 outline-none ${themeText} placeholder:${themeSubText} font-medium text-sm md:text-base`} 
            />
            {isLoading && <Loader2 size={18} className={`animate-spin shrink-0 ${themeSubText}`} />}
          </div>
        </div>

        <h2 className={`text-xl md:text-2xl font-serif mb-4 md:mb-6 ml-2 ${themeText} font-bold`}>
          {searchQuery ? "Global Results" : "Top Signals"}
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6 pb-32">
          {stations.length === 0 && !isLoading ? (
             <div className={`col-span-full text-center py-10 ${themeSubText}`}>No signals detected.</div>
          ) : (
            stations.map((station) => {
              const isActive = currentStation?.id === station.id;
              
              return (
                <div 
                  key={station.id}
                  onClick={() => handlePlayToggle(station)}
                  className={`${glassPanel} p-4 rounded-2xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center text-center ${isActive ? 'ring-2 ring-white/80 bg-white/40' : 'bg-white/10 hover:bg-white/30'}`}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/50 flex items-center justify-center mb-3 md:mb-4 overflow-hidden shadow-inner border border-white/60 relative shrink-0">
                    {station.favicon ? <img src={station.favicon} alt="" onError={(e)=>e.target.style.display='none'} className="w-full h-full object-cover"/> : <Radio size={24} className={themeSubText}/>}
                    
                    {isActive && isPlaying && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex items-end gap-[2px] h-4">
                          <span className="w-1 animated-button-bg animate-[bounce_0.8s_infinite_100ms] h-2"></span>
                          <span className="w-1 animated-button-bg animate-[bounce_0.8s_infinite_300ms] h-4"></span>
                          <span className="w-1 animated-button-bg animate-[bounce_0.8s_infinite_200ms] h-2.5"></span>
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className={`font-bold text-[12px] md:text-sm truncate w-full font-serif ${themeText}`}>{station.name}</h3>
                  <p className={`text-[10px] md:text-xs ${themeSubText} truncate w-full mt-1 font-mono uppercase tracking-wider`}>{station.country || "Web"}</p>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* FLOATING BOTTOM PLAYER */}
      {currentStation && (
        <div className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl ${glassPanel} bg-white/50 rounded-[2rem] px-5 py-3 md:px-6 md:py-4 flex items-center justify-between shadow-2xl border border-white/60`}>
          
          <div className="flex items-center gap-3 w-[45%] md:w-1/3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/60 border border-white/40 flex items-center justify-center hidden sm:flex shrink-0 overflow-hidden">
                {currentStation.favicon ? <img src={currentStation.favicon} alt="" onError={(e)=>e.target.style.display='none'} className="w-full h-full object-cover"/> : <Radio size={18} className={themeText} />}
             </div>
             <div className="truncate w-full">
                <h4 className={`text-xs md:text-sm font-bold truncate font-serif ${themeText}`}>{currentStation.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {isPlaying && !buffering && (
                    <div className="flex items-end gap-[2px] h-2">
                      <span className="w-0.5 animated-button-bg animate-[bounce_0.8s_infinite_100ms] h-1.5 rounded-t-sm"></span>
                      <span className="w-0.5 animated-button-bg animate-[bounce_0.8s_infinite_300ms] h-2.5 rounded-t-sm"></span>
                      <span className="w-0.5 animated-button-bg animate-[bounce_0.8s_infinite_200ms] h-1.5 rounded-t-sm"></span>
                    </div>
                  )}
                  <p className={`text-[9px] md:text-[10px] font-mono uppercase tracking-widest font-bold ${themeSubText}`}>
                    {buffering ? "Tuning..." : "Live"}
                  </p>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-8 w-auto md:w-1/3 shrink-0">
             <button onClick={() => toggleFavorite(currentStation, {stopPropagation:()=>{}})} className="hidden sm:block hover:scale-110 transition-transform">
               <Heart size={20} className={favorites.find(f => f.id === currentStation.id) ? `${themeText} fill-current` : themeSubText} />
             </button>
             <button 
                onClick={() => handlePlayToggle(currentStation)}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full animated-button-bg text-white flex items-center justify-center hover:opacity-90 transition shadow-lg shrink-0 cursor-pointer"
              >
                {buffering ? <Loader2 size={22} className="animate-spin text-white" /> : isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </button>
          </div>

          <div className="flex items-center justify-end w-[25%] md:w-1/3 gap-3">
             <Volume2 size={18} className={`${themeText} hidden sm:block`} />
             <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 md:w-20 h-1 bg-white/40 accent-current rounded-full hidden sm:block cursor-pointer animated-color" />
             <button onClick={() => toggleFavorite(currentStation, {stopPropagation:()=>{}})} className="sm:hidden ml-auto">
               <Heart size={20} className={favorites.find(f => f.id === currentStation.id) ? `${themeText} fill-current` : themeSubText} />
             </button>
          </div>
        </div>
      )}

      {/* Global Styles for Animations and Scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bgTransition {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes colorTransition {
          0% { color: #0284c7; }   /* sky-600 */
          50% { color: #d97706; }  /* amber-600 */
          100% { color: #0284c7; } 
        }
        @keyframes buttonBgTransition {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Background gradient */
        .animated-bg {
          background: linear-gradient(-45deg, #e0f2fe, #fef3c7, #bae6fd, #fde68a);
          background-size: 400% 400%;
          animation: bgTransition 15s ease infinite;
        }
        
        /* Dynamic text/icon color syncing with background */
        .animated-color {
          animation: colorTransition 15s ease infinite;
        }
        
        /* Dynamic background for buttons syncing with main background */
        .animated-button-bg {
          background: linear-gradient(-45deg, #0284c7, #d97706, #0369a1, #b45309);
          background-size: 400% 400%;
          animation: buttonBgTransition 15s ease infinite;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}