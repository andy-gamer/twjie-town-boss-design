
import React from 'react';
import { DoorOpen, Ghost, Lock, User, Sparkles, AlertOctagon, Hammer, Wind } from 'lucide-react';
import { Entity } from '../types';

// Helper for Interaction Hint
const InteractHint = ({label}: {label?: string}) => (
    <div className="absolute -top-12 bg-white/90 text-black text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none z-40 whitespace-nowrap flex items-center gap-1 animate-bounce">
        <span className="w-4 h-4 bg-black text-white rounded flex items-center justify-center text-[8px]">E</span>
        {label || "互動"}
    </div>
);

export const EntityView = React.memo(({ entity, isRevealing, isInventoryItem, isLocked }: { entity: Entity, isRevealing: boolean, isInventoryItem: boolean, isLocked?: boolean }) => {
    const { id, type, x, y, w, h, label, color, icon, revealText, interactable, visibleInNormal, visibleInReveal, hp } = entity;
    
    // Visibility Check
    const isVisible = (visibleInNormal && !isRevealing) || (visibleInReveal && isRevealing) || (visibleInNormal && visibleInReveal);
    
    // Check breakable destroyed
    if (type === 'breakable' && hp !== undefined && hp <= 0) return null;
    
    if (isInventoryItem) return null; // Already picked up
    if (!isVisible) return null;

    // --- BREAKABLE BARRIERS ---
    if (type === 'breakable') {
        return (
            <div className="absolute flex flex-col items-center justify-end group"
                 style={{ left: x, top: y, width: w, height: h }}>
                 <div className="w-full h-full bg-orange-950 border-2 border-orange-900 flex items-center justify-center relative shadow-lg">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-50"></div>
                     {/* Cracks based on HP */}
                     {hp && hp < 50 && <div className="absolute inset-0 border-t-2 border-r-2 border-black/50 rotate-45 transform origin-center"></div>}
                     <Hammer className="text-white/50 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                 </div>
                 <div className="absolute -top-8 bg-red-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100">
                     [K] 攻擊 ({hp} HP)
                 </div>
            </div>
        );
    }

    // --- VENTS ---
    if (type === 'vent') {
        return (
            <div className="absolute flex flex-col items-center justify-end group"
                 style={{ left: x, top: y, width: w, height: h }}>
                 <div className="w-full h-full bg-black border-4 border-gray-600 flex items-center justify-center relative shadow-[inset_0_0_10px_black]">
                     <div className="w-full h-1 bg-gray-700 absolute top-2"></div>
                     <div className="w-full h-1 bg-gray-700 absolute top-5"></div>
                     <div className="w-full h-1 bg-gray-700 absolute top-8"></div>
                     <Wind className="text-gray-500 w-6 h-6 absolute -right-4 animate-pulse opacity-50" />
                 </div>
                 <div className="absolute -top-8 bg-blue-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100">
                     [C] 蹲下進入
                 </div>
            </div>
        );
    }

    // --- DOORS ---
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

    // --- ITEMS ---
    if (type === 'item' && id !== 'boss_altar') {
        let itemColor = 'text-yellow-200';
        let glowColor = 'bg-yellow-400';
        
        if (icon === 'fist') { itemColor = 'text-red-300'; glowColor = 'bg-red-500'; }
        if (icon === 'shoe') { itemColor = 'text-blue-300'; glowColor = 'bg-blue-500'; }

        return (
            <div className="absolute flex flex-col items-center justify-end group"
                 style={{ left: x, top: y, width: w, height: h }}>
                <div className="relative animate-bounce">
                    <div className={`absolute inset-0 ${glowColor} blur-md opacity-30 animate-pulse`} />
                    <Sparkles className={`${itemColor} w-8 h-8 drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]`} />
                </div>
                {label && (
                    <div className="absolute -top-8 w-max text-xs text-yellow-200 bg-black/80 px-2 py-1 rounded border border-yellow-900 shadow-lg z-20">
                        {label}
                    </div>
                )}
                {interactable && <InteractHint label="拾取" />}
            </div>
        );
    }
    
    // --- BOSS ALTAR ---
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

    // --- CURTAINS ---
    if (id === 'curtain_left' || id === 'curtain_right') {
         return (
             <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
                 <div className="w-full h-full bg-red-950 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] border-b-4 border-yellow-900/30" 
                      style={{ clipPath: id === 'curtain_left' ? 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 15% 100%)' }} />
             </div>
         );
    }

    // --- BOUND JIAHAO ---
    if (id === 'jiahao_bound') {
        return (
             <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
                <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[200px] h-[400px] bg-gradient-to-b from-purple-500/20 via-transparent to-transparent pointer-events-none blur-xl" />
                
                <div className="relative w-full h-full flex flex-col items-center justify-end">
                     <div className="absolute inset-0 bg-purple-600/20 blur-2xl animate-pulse rounded-full" />
                     {/* Complex Vines Background omitted for brevity, keeping base structure */}
                     
                     <div className="relative z-10 w-24 h-40 bg-black rounded-t-full flex items-center justify-center border-x border-t border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.4)] overflow-hidden">
                         <User className="text-purple-900 opacity-80 w-16 h-16 translate-y-4" />
                     </div>
                     
                     <div className="absolute -top-6 animate-bounce">
                        <Lock size={20} className="text-purple-300 drop-shadow-[0_0_10px_purple]" />
                     </div>
                </div>
                {interactable && <InteractHint />}
             </div>
        );
    }

    // --- NPCS ---
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
                </div>
                 {interactable && <InteractHint />}
            </div>
        );
    }
    
    // --- GENERIC DECORATIONS ---
    return (
        <div className="absolute flex flex-col items-center justify-end group opacity-70 hover:opacity-100 transition-opacity"
            style={{ left: x, top: y, width: w, height: h }}>
            <div className="w-full h-full border-b-2 border-white/5 relative flex items-center justify-center"
                 style={{ backgroundColor: color ? `${color}20` : 'rgba(255,255,255,0.02)' }}>
                 <div className="absolute bottom-0 w-full h-1 bg-black/50 blur-sm" />
            </div>
            {label && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/60 text-gray-400 text-[10px] px-2 py-1 rounded border border-gray-800 whitespace-nowrap backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {label}
                </div>
            )}
        </div>
    );
});
