import React from 'react';
import { DoorOpen, Ghost, Heart, Skull, Footprints, AlertTriangle, Book, Trophy, Puzzle, Circle, FileText, ChevronDown, User, Sparkles, Tag } from 'lucide-react';
import { Entity, RoomData, PlayerState, BossState, GameState } from './types';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './data';

// --- ENTITY COMPONENT ---
export const EntityView = React.memo(({ entity, isRevealing, isInventoryItem }: { entity: Entity, isRevealing: boolean, isInventoryItem: boolean }) => {
    const { id, type, x, y, w, h, label, color, icon, revealText, interactable, visibleInNormal, visibleInReveal } = entity;
    
    // Visibility Check
    const isVisible = (visibleInNormal && !isRevealing) || (visibleInReveal && isRevealing) || (visibleInNormal && visibleInReveal);
    
    if (isInventoryItem) return null; // Already picked up
    if (!isVisible) return null;

    // --- STYLING ---
    // Doors get a specific frame look
    if (type === 'door') {
        return (
            <div className="absolute flex flex-col items-center justify-end group transition-transform hover:scale-105"
                 style={{ left: x, top: y, width: w, height: h }}>
                <div className="w-full h-full bg-[#1a1a1a] border-x-4 border-t-4 border-[#4a4a4a] relative shadow-2xl flex items-end justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
                    <DoorOpen className="text-[#666] w-12 h-12 mb-4 relative z-10" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-gray-300 text-[10px] px-2 py-1 rounded border border-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {label}
                    </div>
                </div>
                {interactable && <InteractHint />}
            </div>
        );
    }

    // Items
    if (type === 'item' && id !== 'boss_altar') {
        return (
            <div className="absolute flex flex-col items-center justify-end group"
                 style={{ left: x, top: y, width: w, height: h }}>
                <div className="relative animate-bounce">
                    <div className="absolute inset-0 bg-yellow-400 blur-md opacity-30 animate-pulse" />
                    <Sparkles className="text-yellow-200 w-8 h-8 drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]" />
                </div>
                {label && (
                    <div className="absolute -bottom-6 w-max text-[10px] text-yellow-500 bg-black/80 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {label}
                    </div>
                )}
                {interactable && <InteractHint />}
            </div>
        );
    }
    
    // Boss Altar / Stage Props
    if (id === 'boss_altar') {
         return (
             <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
                 <div className="w-full h-full bg-gradient-to-t from-purple-900/50 to-transparent border-b-2 border-purple-500 flex items-center justify-center">
                     <div className="text-purple-300 text-xs tracking-[0.2em] uppercase font-bold opacity-70">{label}</div>
                 </div>
                 {interactable && <InteractHint />}
             </div>
         );
    }

    if (id === 'curtain_left' || id === 'curtain_right') {
         return (
             <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
                 <div className="w-full h-full bg-red-900/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-b-4 border-yellow-600/30" 
                      style={{ clipPath: id === 'curtain_left' ? 'polygon(0 0, 100% 0, 80% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 20% 100%)' }} />
             </div>
         );
    }

    // NPCs
    if (type === 'npc') {
        return (
            <div className="absolute flex flex-col items-center justify-end"
                 style={{ left: x, top: y, width: w, height: h }}>
                 
                <div className={`relative w-full h-full flex items-center justify-center ${isRevealing ? 'animate-pulse' : ''}`}>
                    {icon === 'ghost' && <Ghost className="w-full h-full text-red-500/50 blur-sm drop-shadow-[0_0_10px_red]" />}
                    {icon === 'flower' && (
                        <div className="relative w-full h-full">
                            <div className="absolute inset-0 bg-purple-900/60 rounded-full blur-md animate-pulse" />
                            <div className="absolute bottom-0 w-full h-2/3 bg-purple-950 rounded-t-xl opacity-80" />
                        </div>
                    )}
                    {icon === 'shout' && <div className="text-red-600 font-black text-6xl opacity-50 font-serif">!</div>}
                    {icon === 'cry' && <div className="text-blue-400 font-black text-4xl opacity-50 font-serif">...</div>}
                    {icon === 'violence' && <div className="text-red-900 font-black text-6xl opacity-50 font-serif">/</div>}
                    {icon === 'hiding' && <div className="text-green-900 font-black text-lg opacity-50 font-serif">( )</div>}
                    
                    {revealText && isRevealing && (
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 bg-black/90 text-red-500 text-sm p-4 border border-red-900 z-50 pointer-events-none text-center shadow-2xl rounded-sm">
                            <p className="font-serif italic leading-relaxed">{revealText}</p>
                            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black border-r border-b border-red-900 rotate-45" />
                        </div>
                    )}
                </div>
                 {interactable && <InteractHint />}
            </div>
        );
    }
    
    // Generic Decorations (Fixed to show Labels)
    return (
        <div className="absolute flex flex-col items-center justify-end group"
            style={{ left: x, top: y, width: w, height: h }}>
            <div className="w-full h-full bg-white/5 border border-white/5 rounded-sm relative hover:bg-white/10 transition-colors">
                {/* Visual Placeholder for decoration if no icon */}
                <div className="absolute inset-0 flex items-center justify-center text-white/10">
                    <Tag size={16} />
                </div>
            </div>
            
            {label && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/70 text-gray-400 text-[10px] px-2 py-0.5 rounded border border-gray-800 whitespace-nowrap backdrop-blur-sm shadow-sm z-10 pointer-events-none">
                    {label}
                </div>
            )}
        </div>
    );
});

const InteractHint = () => (
    <div className="absolute -top-8 bg-white/90 text-black text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none z-40 whitespace-nowrap flex items-center gap-1">
        <span className="w-4 h-4 bg-black text-white rounded flex items-center justify-center text-[8px]">E</span>
        互動
    </div>
);

// --- PLAYER COMPONENT ---
export const PlayerView = ({ player, isFlashlightOn, isMoving }: { player: PlayerState, isFlashlightOn: boolean, isMoving: boolean }) => {
    // REMOVED 'transition-all duration-75' from the outer div to prevent "jumping/skipping"
    // The state updates are smooth enough (60fps), CSS transition fights with JS position updates.
    return (
        <div className="absolute z-20"
            style={{ left: player.x, top: player.y, width: player.w, height: player.h }}>
                <div className={`relative w-full h-full transition-transform duration-200 ${player.facingRight ? '' : 'scale-x-[-1]'}`}>
                    
                    {/* Character Body - Added walking-sway animation class if moving */}
                    <div className={`w-full h-full bg-[#111] rounded-t-3xl overflow-hidden relative shadow-2xl ${isMoving ? 'walking-sway' : ''}`}>
                         {/* Collar */}
                         <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full h-2 bg-white/20" />
                    </div>
                    {/* Head - also affected by sway via parent, but maybe we want it stable? No, swaying head is natural */}
                    <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#e5e5e5] rounded-full border-2 border-gray-400 shadow-md overflow-hidden ${isMoving ? 'walking-sway' : ''}`} style={{ animationDelay: '-0.1s' }}>
                        <div className="w-full h-3 bg-black absolute top-0" /> {/* Hair */}
                    </div>
                    
                    {/* Flashlight Beam */}
                    {isFlashlightOn && (
                        <div className="absolute top-6 left-3/4 w-[600px] h-[300px] -translate-y-1/2 origin-left flashlight-beam z-30" />
                    )}
                </div>
        </div>
    );
};

// --- THOUGHT BUBBLE COMPONENT ---
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

// --- BOSS COMPONENT ---
export const BossView = ({ boss, isRevealing }: { boss: BossState, isRevealing: boolean }) => {
    if (!boss.active || boss.health <= 0) return null;
    return (
        <div className="absolute transition-transform duration-100 boss-pulse z-30"
            style={{ left: boss.x, top: boss.y, width: 120, height: 160 }}>
                <div className={`relative w-full h-full flex items-center justify-center`}>
                    <div className="absolute w-[300%] h-[300%] opacity-30 animate-spin-slow">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-purple-900"><path d="M50 50 Q70 10 90 50 T50 90 T10 50 T50 10" /></svg>
                    </div>
                    <div className={`w-32 h-32 bg-purple-950 rounded-full flex items-center justify-center border-4 border-purple-600 shadow-[0_0_50px_rgba(147,51,234,0.5)] ${boss.stunned ? 'brightness-150 grayscale' : ''}`}>
                            <Skull size={60} className="text-purple-300" />
                    </div>
                    <div className={`absolute w-12 h-12 bg-white rounded-full shadow-[0_0_30px_white] transition-opacity duration-75 flex items-center justify-center`}
                    style={{ opacity: isRevealing ? 1 : 0 }}>
                        <Heart size={24} className="text-red-600 animate-pulse" fill="currentColor" />
                    </div>
                </div>
        </div>
    );
};

// --- UI COMPONENTS ---

const getItemIcon = (name: string) => {
    if (name.includes('畢業')) return <Book size={20} className="text-amber-300" />;
    if (name.includes('獎狀')) return <Trophy size={20} className="text-yellow-400" />;
    if (name.includes('玩具')) return <Puzzle size={20} className="text-blue-400" />;
    if (name.includes('皮帶')) return <Circle size={20} className="text-gray-400" />;
    if (name.includes('日記')) return <FileText size={20} className="text-yellow-100" />;
    return <span className="font-serif font-bold text-xl">{name.charAt(0)}</span>;
};

// Dedicated Inventory Component
const InventoryDisplay = ({ inventory }: { inventory: string[] }) => {
    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
             <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold ml-1">Items Collected</div>
             <div className="flex gap-3">
                {inventory.length === 0 && (
                    <div className="w-12 h-12 border border-dashed border-white/20 rounded flex items-center justify-center bg-black/40">
                        <span className="text-white/20 text-xs">Empty</span>
                    </div>
                )}
                {inventory.map((item, i) => (
                    <div key={i} className="group relative w-12 h-12 bg-gray-900 border border-gray-600 hover:border-amber-500 hover:bg-gray-800 flex items-center justify-center text-white rounded shadow-lg transition-all cursor-help hover:-translate-y-1">
                        {getItemIcon(item)}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-3 py-1.5 bg-black text-xs text-amber-50 border border-amber-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                            {item}
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );
};

export const HUD = ({ roomName, isRevealing, isFlashlightOn, inventory, boss }: { roomName: string, isRevealing: boolean, isFlashlightOn: boolean, inventory: string[], boss: BossState }) => {
    return (
        <>
            {/* Boss Health Bar */}
            {boss.active && boss.health > 0 && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 w-[400px] h-4 bg-gray-900 border border-purple-900 rounded-full overflow-hidden z-50 shadow-2xl">
                    <div className="h-full bg-gradient-to-r from-purple-800 to-purple-500 transition-all duration-300 relative" style={{ width: `${boss.health}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            )}

            {/* Room Name */}
            <div className="fixed top-6 left-6 z-50 select-none">
                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Current Location</div>
                <div className="text-white font-serif text-2xl flex items-center gap-3 drop-shadow-md">
                    <Footprints size={20} className="text-red-500/80" /> {roomName}
                </div>
            </div>
            
            {/* Controls Help */}
            <div className="fixed top-6 right-6 flex flex-col items-end gap-2 z-50 select-none">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isRevealing ? "bg-red-950/80 border-red-500 text-red-100 shadow-[0_0_15px_red]" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">SPACE</span>
                    <span className="text-xs">Reveal</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isFlashlightOn ? "bg-yellow-950/80 border-yellow-500 text-yellow-100 shadow-[0_0_15px_yellow]" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">SHIFT</span>
                    <span className="text-xs">Flashlight</span>
                </div>
            </div>

            <InventoryDisplay inventory={inventory} />
        </>
    );
};

// FIXED POSITION DIALOGUE BOX
export const DialogueBox = ({ text }: { text: string }) => (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[100]">
        <div className="bg-black/90 backdrop-blur-sm border border-gray-600 p-6 shadow-2xl rounded-sm flex gap-6 items-start relative overflow-hidden group">
            {/* Decorative Corner */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-white/20 -translate-x-2 -translate-y-2" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-white/20 translate-x-2 translate-y-2" />
            
            {/* Avatar Placeholder */}
            <div className="w-16 h-16 bg-gray-800 shrink-0 border border-gray-600 flex items-center justify-center">
                 <User className="text-gray-500" size={32} />
            </div>

            <div className="flex-1">
                <div className="mb-2 text-red-500/80 text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Story
                </div>
                <p className="text-lg text-gray-200 font-serif leading-8 tracking-wide">
                    {text}
                </p>
            </div>

            {/* Prompt */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 animate-bounce opacity-50 group-hover:opacity-100 transition-opacity">
                 <div className="w-6 h-6 border border-gray-500 rounded bg-gray-800 text-white text-xs flex items-center justify-center">E</div>
                 <ChevronDown className="text-gray-400" size={16} />
            </div>
        </div>
    </div>
);

// --- MAIN WORLD RENDERER ---
export const WorldRenderer = ({ 
    room, 
    player, 
    boss, 
    isRevealing, 
    isFlashlightOn,
    isCorrupted,
    isDistorting,
    thought,
    isMoving
}: { 
    room: RoomData, 
    player: PlayerState, 
    boss: BossState, 
    isRevealing: boolean, 
    isFlashlightOn: boolean,
    isCorrupted: boolean,
    isDistorting: boolean,
    thought: string | null,
    isMoving: boolean
}) => {
    // Camera Logic
    const cameraX = Math.max(0, Math.min(player.x - SCREEN_WIDTH/2, room.width - SCREEN_WIDTH));
    
    // Filters
    let containerFilter = "";
    if (isRevealing) containerFilter = "invert(1) hue-rotate(180deg) contrast(1.1) brightness(0.8)";
    if (isCorrupted && !isRevealing) containerFilter += " sepia(0.3) contrast(1.2) saturate(1.2)";
    if (isDistorting) containerFilter += " hue-rotate(90deg) contrast(2) brightness(1.5) blur(1px)";

    return (
        <div 
            className={`relative overflow-hidden shadow-2xl transition-all duration-300 border-y-[10px] border-black ${isDistorting ? 'glitch-mode' : ''}`}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        >
            {/* Background Layer with Texture */}
            <div className={`absolute inset-0 transition-all duration-300 wall-texture ${room.backgroundClass}`} style={{ filter: containerFilter }}>
                
                {/* Parallax Container */}
                <div className="absolute top-0 left-0 h-full transition-transform duration-75 ease-linear will-change-transform"
                    style={{ width: room.width, transform: `translate3d(-${cameraX}px, 0, 0)` }}
                >
                    {/* Floor Element (for 2.5D look) */}
                    <div className="absolute bottom-0 left-0 w-full h-[80px] floor-texture z-10" />

                    {/* Entities */}
                    {room.entities.map(ent => (
                        <EntityView 
                            key={ent.id} 
                            entity={ent} 
                            isRevealing={isRevealing} 
                            isInventoryItem={player.inventory.includes(ent.id)} 
                        />
                    ))}

                    {/* Boss */}
                    <BossView boss={boss} isRevealing={isRevealing} />

                    {/* Player */}
                    <PlayerView player={player} isFlashlightOn={isFlashlightOn} isMoving={isMoving} />
                    
                    {/* Floating Thought */}
                    <ThoughtBubble text={thought} x={player.x} y={player.y} />
                </div>
            </div>

            {/* Global Screen Effects */}
            {isRevealing && <div className="noise-overlay" />}
            <div className="scanlines w-full h-full absolute top-0 left-0" />
            <div className="vignette w-full h-full absolute top-0 left-0" />
            
            {/* Intro Text Overlay (Conditional) */}
            {!isRevealing && !isFlashlightOn && !thought && (
                <div className="absolute bottom-2 right-4 text-[10px] text-white/10 font-mono pointer-events-none">
                    MEMORY_FRAGMENT: {room.id}
                </div>
            )}
        </div>
    );
};