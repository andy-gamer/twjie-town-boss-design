import React from 'react';
import { Book, Trophy, Puzzle, Circle, FileText, ChevronDown, User, MapPin, AlertTriangle, Battery, Zap } from 'lucide-react';
import { BossState } from '../types';
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
             <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold ml-1">Items</div>
             <div className="flex gap-3">
                {inventory.length === 0 && (
                    <div className="w-12 h-12 border border-dashed border-white/20 rounded flex items-center justify-center bg-black/40">
                        <span className="text-white/20 text-xs">Empty</span>
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
    isFlashlightOn, 
    inventory, 
    boss, 
    objective,
    battery,
    stamina
}: { 
    roomName: string, 
    isRevealing: boolean, 
    isFlashlightOn: boolean, 
    inventory: string[], 
    boss: BossState, 
    objective: string,
    battery: number,
    stamina: number
}) => {
    return (
        <>
            {/* Objective Banner */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center w-full pointer-events-none">
                <div className="bg-gradient-to-r from-transparent via-black/80 to-transparent px-12 py-3 border-y border-red-900/30 text-red-100 font-serif tracking-[0.15em] shadow-[0_5px_20px_rgba(0,0,0,0.5)] text-center transform scale-105">
                    <div className="text-[10px] text-red-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-center gap-2">
                        <AlertTriangle size={10} /> Current Objective <AlertTriangle size={10} />
                    </div>
                    <span className="drop-shadow-[0_0_5px_rgba(255,0,0,0.5)] text-lg">{objective}</span>
                </div>
            </div>

            {/* Stats Bars (Battery & Stamina) */}
            <div className="absolute top-24 left-6 z-50 flex flex-col gap-2 pointer-events-none">
                {/* Battery */}
                <div className="flex items-center gap-2">
                    <Battery size={16} className={`${battery < 20 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`} />
                    <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div className="h-full bg-yellow-400 transition-all duration-200" style={{ width: `${(battery / MAX_BATTERY) * 100}%` }} />
                    </div>
                </div>
                {/* Stamina */}
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-blue-400" />
                    <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                        <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${(stamina / MAX_STAMINA) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* Boss Health Bar */}
            {boss.active && boss.health > 0 && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[400px] h-4 bg-gray-900 border border-purple-900 rounded-full overflow-hidden z-50 shadow-2xl">
                    <div className="h-full bg-gradient-to-r from-purple-800 to-purple-500 transition-all duration-300 relative" style={{ width: `${boss.health}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            )}

            {/* Room Name */}
            <div className="absolute top-6 left-6 z-50 select-none">
                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Location</div>
                <div className="text-white font-serif text-2xl flex items-center gap-3 drop-shadow-md">
                    <MapPin size={20} className="text-red-500/80" /> {roomName}
                </div>
            </div>
            
            {/* Controls Help */}
            <div className="absolute top-6 right-6 flex flex-col items-end gap-2 z-50 select-none">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isRevealing ? "bg-red-950/80 border-red-500 text-red-100 shadow-[0_0_15px_red]" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">Q</span>
                    <span className="text-xs">Reveal</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isFlashlightOn ? "bg-yellow-950/80 border-yellow-500 text-yellow-100 shadow-[0_0_15px_yellow]" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">F</span>
                    <span className="text-xs">Light</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/40 border-white/10 text-white/40">
                    <span className="text-[10px] font-bold">SHIFT</span>
                    <span className="text-xs">Sprint</span>
                </div>
            </div>

            <InventoryDisplay inventory={inventory} />
        </>
    );
};

// --- DIALOGUE ---
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
                 <ChevronDown className="text-gray-400 animate-bounce" size={14} />
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90 drop-shadow-sm"></div>
        </div>
    </div>
);

// --- THOUGHT BUBBLE ---
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