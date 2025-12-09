
import React from 'react';
import { Skull, Heart } from 'lucide-react';
import { PlayerState, BossState } from '../types';

export const PlayerView = ({ player, isFlashlightOn, isMoving }: { player: PlayerState, isFlashlightOn: boolean, isMoving: boolean }) => {
    
    const heightMod = player.isCrouching ? 0.6 : 1;
    const yOffset = player.isCrouching ? player.h * 0.4 : 0;

    return (
        <div className="absolute z-20 transition-all duration-200"
            style={{ left: player.x, top: player.y + yOffset, width: player.w, height: player.h * heightMod }}>
                <div className={`relative w-full h-full transition-transform duration-200 ${player.facingRight ? '' : 'scale-x-[-1]'}`}>
                    
                    {/* Attack Visual */}
                    {player.isAttacking && (
                        <div className="absolute top-1/2 -right-12 w-12 h-1 bg-white animate-ping z-50"></div>
                    )}

                    {/* Legs Animation */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center gap-1">
                        <div className={`w-3 ${player.isCrouching ? 'h-4' : 'h-8'} bg-black rounded-full origin-top ${isMoving ? 'leg-l' : ''}`}></div>
                        <div className={`w-3 ${player.isCrouching ? 'h-4' : 'h-8'} bg-black rounded-full origin-top ${isMoving ? 'leg-r' : ''}`}></div>
                    </div>

                    {/* Character Body */}
                    <div className={`w-full h-[80%] bg-[#1a1a1a] rounded-t-3xl overflow-hidden relative shadow-2xl z-10 absolute bottom-2 ${isMoving ? 'walking-bounce' : ''}`}>
                         <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full h-2 bg-white/20" />
                         <div className="absolute bottom-0 w-full h-4 bg-[#111]"></div>
                    </div>
                    
                    {/* Head */}
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#e5e5e5] rounded-full border-2 border-gray-400 shadow-md overflow-hidden z-20 ${isMoving ? 'walking-bounce' : ''}`} style={{ animationDelay: '-0.15s' }}>
                        <div className="w-full h-3 bg-black absolute top-0" />
                        {/* Eyes */}
                        {player.stealth > 1 && <div className="absolute top-4 left-2 w-6 h-1 bg-blue-500 opacity-50"></div>}
                    </div>
                    
                    {/* Flashlight Beam */}
                    {isFlashlightOn && (
                        <div className="absolute top-6 left-3/4 w-[600px] h-[300px] -translate-y-1/2 origin-left flashlight-beam z-30" />
                    )}
                </div>
        </div>
    );
};

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
