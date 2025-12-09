
import React from 'react';
import { DoorOpen, Ghost, Lock, User, Sparkles, AlertOctagon } from 'lucide-react';
import { Entity } from '../types';

// Helper for Interaction Hint
const InteractHint = () => (
    <div className="absolute -top-12 bg-white/90 text-black text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none z-40 whitespace-nowrap flex items-center gap-1 animate-bounce">
        <span className="w-4 h-4 bg-black text-white rounded flex items-center justify-center text-[8px]">E</span>
        互動
    </div>
);

export const EntityView = React.memo(({ entity, isRevealing, isInventoryItem, isLocked }: { entity: Entity, isRevealing: boolean, isInventoryItem: boolean, isLocked?: boolean }) => {
    const { id, type, x, y, w, h, label, color, icon, revealText, interactable, visibleInNormal, visibleInReveal } = entity;
    
    // Visibility Check
    const isVisible = (visibleInNormal && !isRevealing) || (visibleInReveal && isRevealing) || (visibleInNormal && visibleInReveal);
    
    if (isInventoryItem) return null; // Already picked up
    if (!isVisible) return null;

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

    // --- BOUND JIAHAO (Complex Visual) ---
    if (id === 'jiahao_bound') {
        return (
             <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
                <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[200px] h-[400px] bg-gradient-to-b from-purple-500/20 via-transparent to-transparent pointer-events-none blur-xl" />
                
                <div className="relative w-full h-full flex flex-col items-center justify-end">
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
                     
                     <div className="relative z-10 w-24 h-40 bg-black rounded-t-full flex items-center justify-center border-x border-t border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.4)] overflow-hidden">
                         <div className="absolute top-10 left-8 w-2 h-2 bg-purple-200 rounded-full blur-[1px] animate-ping" style={{animationDuration: '4s'}} />
                         <div className="absolute top-10 right-8 w-2 h-2 bg-purple-200 rounded-full blur-[1px] animate-ping" style={{animationDuration: '4.5s'}} />
                         <User className="text-purple-900 opacity-80 w-16 h-16 translate-y-4" />
                         <div className="absolute top-1/2 left-0 w-full h-1 bg-purple-500/50 rotate-12 blur-[0.5px]" />
                         <div className="absolute top-2/3 left-0 w-full h-1 bg-purple-500/50 -rotate-12 blur-[0.5px]" />
                         <div className="absolute bottom-4 left-0 w-full h-8 bg-gradient-to-t from-purple-900 to-transparent opacity-80" />
                     </div>
                     
                     <div className="absolute -top-6 animate-bounce">
                        <Lock size={20} className="text-purple-300 drop-shadow-[0_0_10px_purple]" />
                     </div>

                     <div className="absolute -top-16 bg-black/80 px-3 py-1.5 rounded-md text-xs text-purple-200 border border-purple-800 shadow-[0_0_15px_purple] font-bold tracking-wider z-20">
                         {label}
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
