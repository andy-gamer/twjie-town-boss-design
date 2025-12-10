
import React, { useState } from 'react';
import { Book, Trophy, Puzzle, Circle, FileText, ChevronDown, User, MapPin, AlertTriangle, Battery, Zap, Hammer, EyeOff, Heart, Info, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import { BossState, PlayerState } from '../types';
import { MAX_BATTERY, MAX_STAMINA } from '../data';

// --- ICONS & INVENTORY ---
const getItemIcon = (name: string) => {
    if (name.includes('畢業')) return <Book size={20} className="text-amber-300" />;
    if (name.includes('獎狀')) return <Trophy size={20} className="text-yellow-400" />;
    if (name.includes('玩具')) return <Puzzle size={20} className="text-blue-400" />;
    if (name.includes('皮帶')) return <Circle size={20} className="text-gray-400" />;
    if (name.includes('日記')) return <FileText size={20} className="text-yellow-100" />;
    return <span className="font-serif font-bold text-xl">{name.charAt(0)}</span>;
};

const InventoryDisplay = ({ inventory }: { inventory: string[] }) => {
    return (
        <div className="absolute bottom-6 left-6 z-50 flex flex-col gap-2">
             <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold ml-1">物品欄</div>
             <div className="flex gap-3 flex-wrap max-w-[400px]">
                {inventory.length === 0 && (
                    <div className="w-12 h-12 border border-dashed border-white/20 rounded flex items-center justify-center bg-black/40">
                        <span className="text-white/20 text-xs">空</span>
                    </div>
                )}
                {inventory.map((item, i) => (
                    <div key={i} className="group relative w-12 h-12 bg-gray-900 border border-gray-600 hover:border-amber-500 hover:bg-gray-800 flex items-center justify-center text-white rounded shadow-lg transition-all cursor-help hover:-translate-y-1">
                        {getItemIcon(item)}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-3 py-1.5 bg-black text-xs text-amber-50 border border-amber-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                            {item}
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
};

// --- HUD ---
export const HUD = ({ 
    roomName, 
    isRevealing, 
    isHighBeam, 
    inventory, 
    boss, 
    objective,
    battery,
    stamina,
    player
}: { 
    roomName: string, 
    isRevealing: boolean, 
    isHighBeam: boolean, 
    inventory: string[], 
    boss: BossState, 
    objective: string,
    battery: number,
    stamina: number,
    player: PlayerState
}) => {
    const [isGuideOpen, setIsGuideOpen] = useState(false); // Default closed

    return (
        <>
            {/* Objective Banner - Smaller */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center w-full pointer-events-none">
                <div className="bg-black/40 backdrop-blur-sm px-8 py-1 border-b border-red-900/30 text-red-100 font-serif tracking-widest shadow-sm text-center">
                    <span className="text-sm opacity-80">{objective}</span>
                </div>
            </div>

            {/* Boss Hints Panel (Collapsible) */}
            {boss.active && (
                <div className="absolute top-16 right-0 z-50 pointer-events-auto flex items-start">
                    <button 
                        onClick={() => setIsGuideOpen(!isGuideOpen)}
                        className="bg-black/60 text-purple-300 p-2 rounded-l-lg border-y border-l border-purple-500/30 hover:bg-purple-900/40 transition-colors"
                        title="戰鬥指南"
                    >
                        {isGuideOpen ? <ChevronRight size={16} /> : <Info size={16} />}
                    </button>
                    
                    {isGuideOpen && (
                        <div className="bg-black/80 border-l border-b border-purple-500/30 p-3 rounded-bl-xl backdrop-blur-sm max-w-[200px] shadow-lg mr-6">
                            <ul className="text-[10px] text-gray-300 space-y-2 leading-tight font-serif tracking-wide">
                                <li className="flex gap-2 items-start">
                                    <span className="text-red-500 font-bold">●</span>
                                    <span>BOSS靠<strong>聽覺</strong>。蹲下(Shift)可潛行。</span>
                                </li>
                                <li className="flex gap-2 items-start">
                                    <span className="text-yellow-400 font-bold">●</span>
                                    <span><strong>光照</strong>(F)使其變慢，但會被發現。</span>
                                </li>
                                <li className="flex gap-2 items-start">
                                    <span className="text-orange-400 font-bold">●</span>
                                    <span><strong>強力光束</strong>(Space)造成傷害。</span>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Bars (Compact) */}
            <div className="absolute top-16 left-6 z-50 flex flex-col gap-1 pointer-events-none opacity-80 hover:opacity-100 transition-opacity">
                {/* Health */}
                <div className="flex items-center gap-2">
                    <Heart size={12} className={`text-red-500 ${player.health < 30 ? 'animate-bounce' : ''}`} fill="currentColor" />
                    <div className="w-24 h-2 bg-gray-900 rounded-full overflow-hidden border border-red-900/30 relative">
                        <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${player.health}%` }} />
                    </div>
                </div>

                {/* Battery */}
                <div className="flex items-center gap-2">
                    <Battery size={12} className={`${battery < 20 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`} />
                    <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-600/50">
                        <div className="h-full bg-yellow-400" style={{ width: `${(battery / MAX_BATTERY) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* Boss Health Bar */}
            {boss.active && boss.health > 0 && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[300px] h-3 bg-gray-900 border border-green-900 rounded-full overflow-hidden z-50 shadow-lg">
                    <div className="h-full bg-gradient-to-r from-green-900 to-green-700 transition-all duration-300 relative" style={{ width: `${boss.health}%` }}></div>
                </div>
            )}

            {/* Room Name */}
            <div className="absolute top-6 left-6 z-50 select-none">
                <div className="text-white/30 text-[10px] uppercase tracking-widest">位置</div>
                <div className="text-white font-serif text-lg flex items-center gap-2 drop-shadow-md">
                    <MapPin size={14} className="text-red-500/80" /> {roomName}
                </div>
            </div>
            
            {/* Controls Help (Updated) */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1.5 z-50 select-none opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 px-2 py-1 rounded border bg-black/40 border-white/10 text-white/40">
                    <span className="text-[10px] font-bold">W/S</span>
                    <span className="text-[10px]">調整燈光角度</span>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded border transition-all ${player.flashlightOn ? "bg-yellow-950/40 border-yellow-500/50 text-yellow-100" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">F</span>
                    <span className="text-[10px]">手電筒</span>
                </div>
                 <div className={`flex items-center gap-2 px-2 py-1 rounded border transition-all ${isHighBeam ? "bg-orange-900/40 border-orange-500/50 text-orange-100" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">Space</span>
                    <span className="text-[10px]">強力光束</span>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded border transition-all ${player.isCrouching ? "bg-blue-900/40 border-blue-500/50 text-blue-100" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">Shift</span>
                    <span className="text-[10px]">潛伏(蹲下)</span>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded border transition-all ${isRevealing ? "bg-purple-900/40 border-purple-500/50 text-purple-100" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">Q</span>
                    <span className="text-[10px]">看取</span>
                </div>
            </div>

            <InventoryDisplay inventory={inventory} />
        </>
    );
};

export const DialogueBox = ({ text, position }: { text: string, position: {x: number, y: number} }) => (
    <div className="absolute z-[100] transition-all duration-75 ease-out pointer-events-none"
         style={{ left: position.x, top: position.y - 40, transform: 'translateX(-50%) translateY(-100%)' }}>
         
        <div className="relative w-[300px] bg-black/90 backdrop-blur-md border border-gray-500 p-5 rounded-xl shadow-2xl flex flex-col gap-2 animation-pop-in pointer-events-auto">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                 <div className="w-10 h-10 bg-gray-800 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                    <User className="text-white w-6 h-6" />
                 </div>
            </div>
            <p className="text-sm text-gray-100 font-serif leading-6 mt-2 text-center">
                {text}
            </p>
            <div className="self-end flex items-center gap-1 opacity-70">
                 <div className="w-5 h-5 bg-gray-700 rounded text-white text-[10px] flex items-center justify-center">E</div>
                 <div className="w-10 h-5 bg-gray-700 rounded text-white text-[10px] flex items-center justify-center">Enter</div>
                 <ChevronDown className="text-gray-400 animate-bounce" size={14} />
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90 drop-shadow-sm"></div>
        </div>
    </div>
);

export const ThoughtBubble = ({ text, x, y }: { text: string | null, x: number, y: number }) => {
    if (!text) return null;
    return (
        <div 
            className="absolute z-50 thought-fade-in pointer-events-none"
            style={{ left: x + 20, top: y - 50 }}
        >
            <div className="bg-black/80 backdrop-blur-md border border-gray-600 px-4 py-3 rounded-lg text-gray-200 text-sm shadow-2xl relative max-w-[220px] text-left font-serif leading-relaxed">
                {text}
                <div className="absolute top-full left-4 border-8 border-transparent border-t-gray-600"></div>
            </div>
        </div>
    );
};
