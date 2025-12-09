import React from 'react';
import { DoorOpen, Ghost, Heart, Skull, Footprints, AlertTriangle, Book, Trophy, Puzzle, Circle, FileText, ChevronDown, User, Sparkles, Tag, Lock, MapPin, AlertOctagon } from 'lucide-react';
import { Entity, RoomData, PlayerState, BossState, GameState } from './types';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './data';

// --- ENTITY COMPONENT ---
export const EntityView = React.memo(({ entity, isRevealing, isInventoryItem, isLocked }: { entity: Entity, isRevealing: boolean, isInventoryItem: boolean, isLocked?: boolean }) => {
    const { id, type, x, y, w, h, label, color, icon, revealText, interactable, visibleInNormal, visibleInReveal } = entity;
    
    // Visibility Check
    const isVisible = (visibleInNormal && !isRevealing) || (visibleInReveal && isRevealing) || (visibleInNormal && visibleInReveal);
    
    if (isInventoryItem) return null; // Already picked up
    if (!isVisible) return null;

    // --- STYLING ---
    // Doors
    if (type === 'door') {
        return (
            <div className="absolute flex flex-col items-center justify-end group transition-transform hover:scale-105"
                 style={{ left: x, top: y, width: w, height: h }}>
                <div className="w-full h-full bg-[#1a1a1a] border-x-4 border-t-4 border-[#4a4a4a] relative shadow-2xl flex items-end justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
                    
                    {isLocked ? (
                        <>
                            {/* Vines for Locked Door */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                <svg className="w-full h-full stroke-black fill-none stroke-[3]" viewBox="0 0 100 200" preserveAspectRatio="none">
                                    <path d="M0 200 Q20 150 10 100 T30 50" />
                                    <path d="M100 200 Q80 150 90 100 T70 50" />
                                    <path d="M20 200 Q50 100 80 200" />
                                    <path d="M0 50 Q50 150 100 50" />
                                </svg>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <AlertOctagon className="text-red-900 w-12 h-12 opacity-80 animate-pulse" />
                                </div>
                            </div>
                            <div className="absolute top-2 w-full text-center text-[10px] text-red-900 font-bold bg-black/80 py-1 z-30 tracking-widest">LOCKED</div>
                        </>
                    ) : (
                        <>
                            <DoorOpen className="text-[#666] w-12 h-12 mb-4 relative z-10" />
                            <div className="absolute top-2 w-full text-center text-[10px] text-gray-500 bg-black/50 py-1">{label}</div>
                        </>
                    )}
                </div>
                {interactable && !isLocked && <InteractHint />}
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
                    <div className="absolute -top-8 w-max text-xs text-yellow-200 bg-black/80 px-2 py-1 rounded border border-yellow-900 shadow-lg z-20">
                        {label}
                    </div>
                )}
                {interactable && <InteractHint />}
            </div>
        );
    }
    
    // Boss Altar
    if (id === 'boss_altar') {
         return (
             <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
                 <div className="w-full h-full bg-gradient-to-t from-purple-900/50 to-transparent border-b-2 border-purple-500 flex items-center justify-center relative">
                     <div className="text-purple-300 text-xs tracking-[0.2em] uppercase font-bold opacity-70 mt-auto mb-2">{label}</div>
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(88,28,135,0.5))] pointer-events-none" />
                 </div>
                 {interactable && <InteractHint />}
             </div>
         );
    }

    // Curtains
    if (id === 'curtain_left' || id === 'curtain_right') {
         return (
             <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
                 <div className="w-full h-full bg-red-950 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] border-b-4 border-yellow-900/30" 
                      style={{ clipPath: id === 'curtain_left' ? 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 15% 100%)' }} />
             </div>
         );
    }

    // BOUND JIAHAO (Major Visual Upgrade)
    if (id === 'jiahao_bound') {
        return (
             <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
                {/* Spotlight from above */}
                <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[200px] h-[400px] bg-gradient-to-b from-purple-500/20 via-transparent to-transparent pointer-events-none blur-xl" />
                
                <div className="relative w-full h-full flex flex-col items-center justify-end">
                     {/* Pulsing Aura */}
                     <div className="absolute inset-0 bg-purple-600/20 blur-2xl animate-pulse rounded-full" />

                     {/* Complex Vines Background */}
                     <div className="absolute bottom-0 w-64 h-64 opacity-90 pointer-events-none -translate-x-6">
                        <svg viewBox="0 0 100 100" className="w-full h-full stroke-purple-950 stroke-[1.5] fill-none drop-shadow-2xl overflow-visible">
                             <defs>
                                <linearGradient id="vineGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                    <stop offset="0%" stopColor="#3b0764" />
                                    <stop offset="100%" stopColor="#6b21a8" />
                                </linearGradient>
                             </defs>
                             <path d="M50 100 Q20 60 50 30 T50 0" className="stroke-[url(#vineGrad)] animate-pulse" />
                             <path d="M40 100 Q10 70 30 20" className="stroke-[url(#vineGrad)]" />
                             <path d="M60 100 Q90 70 70 20" className="stroke-[url(#vineGrad)]" />
                             <path d="M50 50 Q80 50 80 80" className="stroke-[#4c1d95]" />
                             <path d="M50 50 Q20 50 20 80" className="stroke-[#4c1d95]" />
                        </svg>
                     </div>
                     
                     {/* Character Figure - Silhouette Style */}
                     <div className="relative z-10 w-24 h-40 bg-black rounded-t-full flex items-center justify-center border-x border-t border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.4)] overflow-hidden">
                         {/* Glowing Eyes */}
                         <div className="absolute top-10 left-8 w-2 h-2 bg-purple-200 rounded-full blur-[1px] animate-ping" style={{animationDuration: '4s'}} />
                         <div className="absolute top-10 right-8 w-2 h-2 bg-purple-200 rounded-full blur-[1px] animate-ping" style={{animationDuration: '4.5s'}} />
                         
                         <User className="text-purple-900 opacity-80 w-16 h-16 translate-y-4" />
                         
                         {/* Chains/Vines overlay on body */}
                         <div className="absolute top-1/2 left-0 w-full h-1 bg-purple-500/50 rotate-12 blur-[0.5px]" />
                         <div className="absolute top-2/3 left-0 w-full h-1 bg-purple-500/50 -rotate-12 blur-[0.5px]" />
                         <div className="absolute bottom-4 left-0 w-full h-8 bg-gradient-to-t from-purple-900 to-transparent opacity-80" />
                     </div>
                     
                     {/* Lock Icon */}
                     <div className="absolute -top-6 animate-bounce">
                        <Lock size={20} className="text-purple-300 drop-shadow-[0_0_10px_purple]" />
                     </div>

                     {/* Label */}
                     <div className="absolute -top-16 bg-black/80 px-3 py-1.5 rounded-md text-xs text-purple-200 border border-purple-800 shadow-[0_0_15px_purple] font-bold tracking-wider z-20">
                         {label}
                     </div>
                </div>
                {interactable && <InteractHint />}
             </div>
        );
    }

    // NPCs
    if (type === 'npc') {
        const isIntroShadow = id === 'shadow_boy_intro';
        return (
            <div className={`absolute flex flex-col items-center justify-end transition-opacity duration-1000 ${isIntroShadow ? 'transition-all duration-700' : ''}`}
                 style={{ left: x, top: y, width: w, height: h }}>
                 
                <div className={`relative w-full h-full flex items-center justify-center ${isRevealing ? 'animate-pulse' : ''}`}>
                    {icon === 'ghost' && <Ghost className="w-full h-full text-red-500/50 blur-sm drop-shadow-[0_0_10px_red]" />}
                    {icon === 'shout' && <div className="text-red-600 font-black text-6xl opacity-50 font-serif">!</div>}
                    {icon === 'cry' && <div className="text-blue-400 font-black text-4xl opacity-50 font-serif">...</div>}
                    {icon === 'violence' && <div className="text-red-900 font-black text-6xl opacity-50 font-serif">/</div>}
                    {icon === 'hiding' && <div className="text-green-900 font-black text-lg opacity-50 font-serif">( )</div>}
                    
                    {revealText && isRevealing && (
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 bg-black/90 text-red-500 text-sm p-4 border border-red-900 z-50 pointer-events-none text-center shadow-2xl rounded-sm">
                            <p className="font-serif italic leading-relaxed">{revealText}</p>
                        </div>
                    )}
                </div>
                 {interactable && <InteractHint />}
            </div>
        );
    }
    
    // Decorations (Enhanced)
    return (
        <div className="absolute flex flex-col items-center justify-end group opacity-70 hover:opacity-100 transition-opacity"
            style={{ left: x, top: y, width: w, height: h }}>
            {/* Simple visual representation based on color if provided, else generic */}
            <div className="w-full h-full border-b-2 border-white/5 relative flex items-center justify-center"
                 style={{ backgroundColor: color ? `${color}20` : 'rgba(255,255,255,0.02)' }}>
                 {/* Visual Hint it's a prop */}
                 <div className="absolute bottom-0 w-full h-1 bg-black/50 blur-sm" />
            </div>
            
            {/* Label only appears on hover for decorations to reduce clutter */}
            {label && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/60 text-gray-400 text-[10px] px-2 py-1 rounded border border-gray-800 whitespace-nowrap backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {label}
                </div>
            )}
        </div>
    );
});

const InteractHint = () => (
    <div className="absolute -top-12 bg-white/90 text-black text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none z-40 whitespace-nowrap flex items-center gap-1 animate-bounce">
        <span className="w-4 h-4 bg-black text-white rounded flex items-center justify-center text-[8px]">E</span>
        互動
    </div>
);

// --- PLAYER COMPONENT ---
export const PlayerView = ({ player, isFlashlightOn, isMoving }: { player: PlayerState, isFlashlightOn: boolean, isMoving: boolean }) => {
    return (
        <div className="absolute z-20"
            style={{ left: player.x, top: player.y, width: player.w, height: player.h }}>
                <div className={`relative w-full h-full transition-transform duration-200 ${player.facingRight ? '' : 'scale-x-[-1]'}`}>
                    
                    {/* Legs Animation */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center gap-1">
                        <div className={`w-3 h-8 bg-black rounded-full origin-top ${isMoving ? 'leg-l' : ''}`}></div>
                        <div className={`w-3 h-8 bg-black rounded-full origin-top ${isMoving ? 'leg-r' : ''}`}></div>
                    </div>

                    {/* Character Body */}
                    <div className={`w-full h-[80%] bg-[#1a1a1a] rounded-t-3xl overflow-hidden relative shadow-2xl z-10 absolute bottom-2 ${isMoving ? 'walking-bounce' : ''}`}>
                         <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full h-2 bg-white/20" />
                         <div className="absolute bottom-0 w-full h-4 bg-[#111]"></div>
                    </div>
                    
                    {/* Head */}
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#e5e5e5] rounded-full border-2 border-gray-400 shadow-md overflow-hidden z-20 ${isMoving ? 'walking-bounce' : ''}`} style={{ animationDelay: '-0.15s' }}>
                        <div className="w-full h-3 bg-black absolute top-0" />
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

const InventoryDisplay = ({ inventory }: { inventory: string[] }) => {
    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
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

export const HUD = ({ roomName, isRevealing, isFlashlightOn, inventory, boss, objective }: { roomName: string, isRevealing: boolean, isFlashlightOn: boolean, inventory: string[], boss: BossState, objective: string }) => {
    return (
        <>
            {/* Objective Banner */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center w-full pointer-events-none">
                <div className="bg-gradient-to-r from-transparent via-black/80 to-transparent px-12 py-3 border-y border-red-900/30 text-red-100 font-serif tracking-[0.15em] shadow-[0_5px_20px_rgba(0,0,0,0.5)] text-center transform scale-105">
                    <div className="text-[10px] text-red-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-center gap-2">
                        <AlertTriangle size={10} /> Current Objective <AlertTriangle size={10} />
                    </div>
                    <span className="drop-shadow-[0_0_5px_rgba(255,0,0,0.5)] text-lg">{objective}</span>
                </div>
            </div>

            {/* Boss Health Bar */}
            {boss.active && boss.health > 0 && (
                <div className="fixed top-28 left-1/2 -translate-x-1/2 w-[400px] h-4 bg-gray-900 border border-purple-900 rounded-full overflow-hidden z-50 shadow-2xl">
                    <div className="h-full bg-gradient-to-r from-purple-800 to-purple-500 transition-all duration-300 relative" style={{ width: `${boss.health}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            )}

            {/* Room Name */}
            <div className="fixed top-6 left-6 z-50 select-none">
                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Location</div>
                <div className="text-white font-serif text-2xl flex items-center gap-3 drop-shadow-md">
                    <MapPin size={20} className="text-red-500/80" /> {roomName}
                </div>
            </div>
            
            {/* Controls Help */}
            <div className="fixed top-6 right-6 flex flex-col items-end gap-2 z-50 select-none">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isRevealing ? "bg-red-950/80 border-red-500 text-red-100 shadow-[0_0_15px_red]" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">F</span>
                    <span className="text-xs">Reveal</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isFlashlightOn ? "bg-yellow-950/80 border-yellow-500 text-yellow-100 shadow-[0_0_15px_yellow]" : "bg-black/40 border-white/10 text-white/40"}`}>
                    <span className="text-[10px] font-bold">SHIFT</span>
                    <span className="text-xs">Light</span>
                </div>
            </div>

            <InventoryDisplay inventory={inventory} />
        </>
    );
};

export const DialogueBox = ({ text, position }: { text: string, position: {x: number, y: number} }) => (
    <div className="fixed z-[100] transition-all duration-75 ease-out pointer-events-none"
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
    isMoving,
    cameraX,
    isDoorLocked
}: { 
    room: RoomData, 
    player: PlayerState, 
    boss: BossState, 
    isRevealing: boolean, 
    isFlashlightOn: boolean,
    isCorrupted: boolean,
    isDistorting: boolean,
    thought: string | null,
    isMoving: boolean,
    cameraX: number,
    isDoorLocked: (id: string) => boolean
}) => {
    // Filters
    let containerFilter = "";
    if (isRevealing) containerFilter = "invert(1) hue-rotate(180deg) contrast(1.1) brightness(0.8)";
    if (isCorrupted && !isRevealing) containerFilter += " sepia(0.3) contrast(1.2) saturate(1.2)";
    if (isDistorting) containerFilter += " hue-rotate(90deg) contrast(2) brightness(1.5) blur(2px)";

    return (
        <div 
            className={`relative overflow-hidden shadow-2xl transition-all duration-300 border-y-[10px] border-black ${isDistorting ? 'glitch-mode' : ''}`}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        >
            <div className={`absolute inset-0 transition-all duration-300 wall-texture ${room.backgroundClass}`} style={{ filter: containerFilter }}>
                <div className="absolute top-0 left-0 h-full transition-transform duration-75 ease-linear will-change-transform"
                    style={{ width: room.width, transform: `translate3d(-${cameraX}px, 0, 0)` }}
                >
                    <div className="absolute bottom-0 left-0 w-full h-[80px] floor-texture z-10" />

                    {room.entities.map(ent => (
                        <EntityView 
                            key={ent.id} 
                            entity={ent} 
                            isRevealing={isRevealing} 
                            isInventoryItem={player.inventory.includes(ent.id)} 
                            isLocked={ent.type === 'door' && isDoorLocked(ent.id)}
                        />
                    ))}

                    <BossView boss={boss} isRevealing={isRevealing} />
                    <PlayerView player={player} isFlashlightOn={isFlashlightOn} isMoving={isMoving} />
                    <ThoughtBubble text={thought} x={player.x} y={player.y} />
                </div>
            </div>

            {isRevealing && <div className="noise-overlay" />}
            <div className="scanlines w-full h-full absolute top-0 left-0" />
            <div className="vignette w-full h-full absolute top-0 left-0" />
        </div>
    );
};