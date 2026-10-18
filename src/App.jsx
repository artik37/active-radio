import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, Heart, Search, Menu, X, Radio, 
  Volume2, Moon, Sun, User, Loader2
} from "lucide-react";

const PROXY_URL = "https://radio-proxy.ajaydubey162004.workers.dev/?url=";

// Background Images 
const LIGHT_BG = "/1792314985853.jpg"; 
// New prominent, beautiful moon night sky background
//const DARK_BG = "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=2500&auto=format&fit=crop"; 

//const DARK_BG ="https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=2500&auto=format&fit=crop";
//const DARK_BG ="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2500&auto=format&fit=crop](https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2500&auto=format&fit=crop)";

const DARK_BG = "52a94b748e4fa1655c11e4077ad2702c.jpg";
export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
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

  const audioRef = useRef(new Audio());

  // Load Favorites
  useEffect(() => {
    const savedFavs = localStorage.getItem("activeRadioFavs");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Fetch API Stations & Handle Search
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
        
        const valid = data
          .filter(s => s.url_resolved)
          .map(s => ({
            id: s.stationuuid,
            name: s.name,
            country: s.country,
            url: s.url_resolved,
            favicon: s.favicon
          }));
          
        setStations(valid);
      } catch (err) {
        console.error("Failed to fetch stations", err);
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
    } else {
      setCurrentStation(station);
      setBuffering(true);
      
      const secureUrl = station.url.startsWith('http://') 
        ? `${PROXY_URL}${encodeURIComponent(station.url)}` 
        : station.url;
        
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

  // Theming classes
  const themeText = isDarkTheme ? "text-white/90" : "text-black/80";
  const themeSubText = isDarkTheme ? "text-white/60" : "text-black/60";
  const glassPanel = isDarkTheme 
    ? "bg-black/30 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]" 
    : "bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.5)]";

  return (
    <div 
      className="relative min-h-screen overflow-hidden font-sans transition-all duration-1000 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${isDarkTheme ? DARK_BG : LIGHT_BG}")` }}
    >
      {/* Ambient Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${isDarkTheme ? 'bg-black/40' : 'bg-amber-100/10'}`} />

      {/* Invisible Overlay to close panels when clicking outside */}
      {(leftPanelOpen || rightPanelOpen) && (
        <div className="absolute inset-0 z-30" onClick={closePanels}></div>
      )}

      {/* TOP NAVIGATION */}
      <header className={`relative z-10 flex items-center justify-between px-4 py-3 md:px-8 md:py-5 ${glassPanel} rounded-b-3xl mx-2 md:mx-4 mt-0`}>
        <div className="flex gap-2 md:gap-4">
          <button onClick={() => setLeftPanelOpen(true)} className={`p-2 md:p-2.5 rounded-full ${isDarkTheme ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} transition-all`}>
            <Menu size={20} className={themeText} />
          </button>
        </div>
        
        {/* Artistic Stylish Name */}
        <h1 className="text-2xl md:text-4xl font-serif italic tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
          Active Radio
        </h1>
        
        <div className="flex gap-2 md:gap-4 items-center">
          <button onClick={() => setIsDarkTheme(!isDarkTheme)} className={`p-2 md:p-2.5 rounded-full ${isDarkTheme ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} transition-all`}>
            {isDarkTheme ? <Sun size={20} className={themeText} /> : <Moon size={20} className={themeText} />}
          </button>
          <button onClick={() => setRightPanelOpen(true)} className={`p-2 md:p-2.5 rounded-full ${isDarkTheme ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} transition-all`}>
            <User size={20} className={themeText} />
          </button>
        </div>
      </header>

      {/* FLOATING PANELS */}
      
      {/* Left Panel */}
      <aside className={`absolute top-20 md:top-28 left-2 md:left-6 z-40 w-[80vw] max-w-[260px] h-[65vh] ${glassPanel} rounded-[2rem] transform transition-transform duration-500 flex flex-col p-6 shadow-[0_0_20px_rgba(251,191,36,0.15)] ${leftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="flex justify-between items-center mb-8">
          <span className={`font-serif italic text-xl ${themeText}`}>Menu</span>
          <button onClick={() => setLeftPanelOpen(false)} className={themeSubText}><X size={20}/></button>
        </div>
        <nav className="flex flex-col gap-4">
          <button className={`text-left font-medium ${themeText} hover:text-amber-500 transition-colors`}>Discover</button>
          <button className={`text-left font-medium ${themeText} hover:text-amber-500 transition-colors`}>Saved Stations</button>
          <button className={`text-left font-medium ${themeText} hover:text-amber-500 transition-colors`}>Settings</button>
        </nav>
      </aside>

      {/* Right Panel */}
      <aside className={`absolute top-20 md:top-28 right-2 md:right-6 z-40 w-[85vw] max-w-[320px] h-[45vh] ${glassPanel} rounded-[2.5rem] transform transition-transform duration-500 flex flex-col p-6 shadow-[0_0_20px_rgba(251,191,36,0.15)] ${rightPanelOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
         <div className="flex justify-between items-center mb-6">
          <span className={`font-serif italic text-xl ${themeText}`}>Account</span>
          <button onClick={() => setRightPanelOpen(false)} className={themeSubText}><X size={20}/></button>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
           <div className={`w-16 h-16 rounded-full border border-amber-400/50 flex items-center justify-center ${themeText}`}><User size={30}/></div>
           <span className={`font-medium ${themeText}`}>Guest User</span>
           <button className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold shadow-lg hover:scale-105 transition-transform mt-4">Login / Sign Up</button>
           <button className={`text-xs ${themeSubText} hover:text-amber-500 mt-2 transition-colors`}>Buy me a coffee</button>
        </div>
      </aside>

      {/* MAIN STATION GRID */}
      <main className="relative z-10 h-[calc(100vh-160px)] overflow-y-auto no-scrollbar p-4 md:p-8 mt-2 md:mt-4">
        
        {/* Central Search */}
        <div className="flex justify-center mb-8 md:mb-10">
          <div className={`relative w-full max-w-lg ${glassPanel} rounded-full flex items-center px-4 py-2 md:py-3`}>
            <Search className={`ml-2 shrink-0 ${themeSubText}`} size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations, genres..." 
              className={`w-full bg-transparent border-none px-3 py-1 outline-none ${themeText} placeholder:${themeSubText} font-medium text-sm md:text-base`} 
            />
            {isLoading && <Loader2 size={18} className={`animate-spin shrink-0 ${themeSubText}`} />}
          </div>
        </div>

        <h2 className={`text-xl md:text-2xl font-serif italic mb-4 md:mb-6 ml-2 ${themeText} drop-shadow-md`}>
          {searchQuery ? "Search Results" : "Top Signals"}
        </h2>
        
        {/* Smaller Card Grid (Responsive) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 pb-32">
          {stations.length === 0 && !isLoading ? (
             <div className={`col-span-full text-center py-10 ${themeSubText}`}>No stations found.</div>
          ) : (
            stations.map((station) => {
              const isActive = currentStation?.id === station.id;
              
              return (
                <div 
                  key={station.id}
                  onClick={() => handlePlayToggle(station)}
                  className={`${glassPanel} p-3 rounded-2xl cursor-pointer group transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:border-amber-400/30 flex flex-col items-center text-center ${isActive ? 'border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : ''}`}
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-black/20 flex items-center justify-center mb-2 md:mb-3 overflow-hidden shadow-inner relative shrink-0">
                    {station.favicon ? <img src={station.favicon} alt="" onError={(e)=>e.target.style.display='none'} className="w-full h-full object-cover"/> : <Radio size={20} className={themeSubText}/>}
                    
                    {/* Fixed Flicker: Smooth Pulse Overlay */}
                    {isActive && isPlaying && (
                      <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="flex items-end gap-1 h-3">
                          <span className="w-1 bg-amber-400 animate-[bounce_0.8s_infinite_100ms] h-2 rounded-t-sm"></span>
                          <span className="w-1 bg-amber-400 animate-[bounce_0.8s_infinite_300ms] h-3 rounded-t-sm"></span>
                          <span className="w-1 bg-amber-400 animate-[bounce_0.8s_infinite_200ms] h-1.5 rounded-t-sm"></span>
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className={`font-bold text-[11px] md:text-xs truncate w-full ${isActive ? 'text-amber-400' : themeText}`}>{station.name}</h3>
                  <p className={`text-[9px] md:text-[10px] ${themeSubText} truncate w-full mt-0.5`}>{station.country || "Web"}</p>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* FLOATING BOTTOM PLAYER */}
      {currentStation && (
        <div className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl ${glassPanel} rounded-[2rem] px-4 py-3 md:px-6 md:py-4 flex items-center justify-between shadow-[0_15px_40px_rgba(0,0,0,0.4)] border-amber-400/20`}>
          
          <div className="flex items-center gap-3 w-[45%] md:w-1/3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/20 border border-white/10 flex items-center justify-center hidden sm:flex shrink-0">
                <Radio size={18} className={themeText} />
             </div>
             <div className="truncate w-full">
                <h4 className={`text-xs md:text-sm font-bold truncate ${themeText}`}>{currentStation.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isPlaying && !buffering && (
                    <div className="flex items-end gap-[2px] h-2">
                      <span className="w-0.5 bg-amber-400 animate-[bounce_0.8s_infinite_100ms] h-1.5 rounded-t-sm"></span>
                      <span className="w-0.5 bg-amber-400 animate-[bounce_0.8s_infinite_300ms] h-2 rounded-t-sm"></span>
                      <span className="w-0.5 bg-amber-400 animate-[bounce_0.8s_infinite_200ms] h-1 rounded-t-sm"></span>
                    </div>
                  )}
                  <p className={`text-[9px] md:text-[10px] font-mono uppercase tracking-widest ${themeSubText}`}>
                    {buffering ? "Connecting" : "Live"}
                  </p>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6 w-auto md:w-1/3 shrink-0">
             <button onClick={() => toggleFavorite(currentStation, {stopPropagation:()=>{}})} className="hidden sm:block">
               <Heart size={20} className={favorites.find(f => f.id === currentStation.id) ? "fill-amber-500 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" : themeSubText} />
             </button>
             <button 
                onClick={() => handlePlayToggle(currentStation)}
                className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-black flex items-center justify-center hover:scale-105 transition shadow-[0_0_20px_rgba(251,191,36,0.4)] shrink-0 cursor-pointer"
              >
                {buffering ? <Loader2 size={20} className="animate-spin" /> : isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
              </button>
          </div>

          <div className="flex items-center justify-end w-[25%] md:w-1/3 gap-2">
             <Volume2 size={16} className={`${themeSubText} hidden sm:block`} />
             <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-16 md:w-20 h-1 bg-black/20 accent-amber-500 rounded-full hidden sm:block cursor-pointer" />
             <button onClick={() => toggleFavorite(currentStation, {stopPropagation:()=>{}})} className="sm:hidden ml-auto">
               <Heart size={18} className={favorites.find(f => f.id === currentStation.id) ? "fill-amber-500 text-amber-500" : themeSubText} />
             </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}