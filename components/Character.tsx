import React from 'react';
import { Skull, Heart, Trees, Zap, Biohazard, User, Leaf, Eye } from 'lucide-react';
import { PlayerState, BossState } from '../types';

export const PlayerView = ({ player, isFlashlightOn, isHighBeam, isMoving }: { player: PlayerState, isFlashlightOn: boolean, isHighBeam: boolean, isMoving: boolean }) => {
    
    // Jump Offset
    const jumpY = -player.z;
    const shadowScale = Math.max(0.5, 1 - player.z / 100);
    
    // Crouch Transform
    const heightMod = player.isCrouching ? 'scale-y-[0.6] translate-y-[30%]' : '';

    return (
        <div className="absolute z-20"
            style={{ left: player.x, top: player.y, width: player.w, height: player.h }}>
                
                {/* Shadow (Stays on ground) */}
                <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/40 blur-sm rounded-full w-full h-4 transition-transform"
                    style={{ transform: `scale(${shadowScale}) translateX(-50%)` }} 
                />

                {/* Main Transform Wrapper - Handles facing flip */}
                <div className={`relative w-full h-full transition-transform duration-200 ${player.facingRight ? '' : 'scale-x-[-1]'} ${heightMod}`} style={{ transform: `${player.facingRight ? '' : 'scaleX(-1)'} translateY(${jumpY}px) ${player.isCrouching ? 'translateY(25%) scaleY(0.7)' : ''}` }}>
                    
                    {/* Legs Animation */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center gap-1">
                        <div className={`w-3 h-8 bg-black rounded-full origin-top ${isMoving && player.z === 0 ? 'leg-l' : ''}`}></div>
                        <div className={`w-3 h-8 bg-black rounded-full origin-top ${isMoving && player.z === 0 ? 'leg-r' : ''}`}></div>
                    </div>

                    {/* Character Body */}
                    <div className={`w-full h-[80%] bg-[#1a1a1a] rounded-t-3xl overflow-hidden relative shadow-2xl z-10 absolute bottom-2 ${isMoving && player.z === 0 ? 'walking-bounce' : ''}`}>
                         <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full h-2 bg-white/20" />
                         <div className="absolute bottom-0 w-full h-4 bg-[#111]"></div>
                    </div>
                    
                    {/* Head */}
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#e5e5e5] rounded-full border-2 border-gray-400 shadow-md overflow-hidden z-20 ${isMoving && player.z === 0 ? 'walking-bounce' : ''}`} style={{ animationDelay: '-0.15s' }}>
                        <div className="w-full h-3 bg-black absolute top-0" />
                    </div>
                    
                    {/* Flashlight Beam */}
                    {isFlashlightOn && (
                        <div 
                            className={`absolute top-6 left-[60%] w-[600px] h-[300px] -translate-y-1/2 origin-left flashlight-beam z-30 transition-transform duration-100 ${isHighBeam ? 'focused' : ''}`}
                            style={{ 
                                transform: `translateY(-50%) rotate(${player.aimAngle}deg)` 
                            }}
                        />
                    )}
                </div>
        </div>
    );
};

export const BossView = ({ boss, isRevealing, isHighBeam }: { boss: BossState, isRevealing: boolean, isHighBeam: boolean }) => {
    if (!boss.active || boss.health <= 0) return null;
    
    const isHit = Date.now() - boss.lastHit < 100;
    
    // AI States
    const isMoving = (boss.aiState === 'CHASE' || boss.aiState === 'WANDER') && !boss.stunned;
    const isWindup = boss.aiState === 'WINDUP';
    const isAttacking = boss.aiState === 'ATTACK';
    const isStunned = boss.aiState === 'STUNNED';
    
    // Scared / Stunned visual effects (Desaturation / Distortion)
    const isScared = isHighBeam || isStunned; 
    const scaredEffect = isScared ? 'grayscale-[0.8] brightness-125 blur-[1px] opacity-90' : '';
    const stunnedShake = isStunned ? 'animate-[shake_0.5s_infinite]' : '';

    // Vine Calculation
    let vinePath = "";
    if ((isAttacking || isWindup) && boss.vineAttack) {
        // Relative coordinates (Boss container is 60x120)
        // Center of mass roughly at x=30, y=40 (Torso)
        const sx = 30; 
        const sy = 40;
        const tx = boss.vineAttack.targetX - boss.x + 30; 
        const ty = boss.vineAttack.targetY - boss.y;
        
        // Dynamic jagged path for "Thorns" look
        // We create a bezier curve but add a middle control point that jitters
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        
        // Jitter increases during attack
        const jitter = isAttacking ? 30 : 5;
        const cx1 = sx + (tx - sx) * 0.3 + (Math.random() - 0.5) * jitter;
        const cy1 = sy - 50 + (Math.random() - 0.5) * jitter; 
        const cx2 = sx + (tx - sx) * 0.7 + (Math.random() - 0.5) * jitter;
        const cy2 = ty - 20 + (Math.random() - 0.5) * jitter;

        vinePath = `M${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
    }

    return (
        <>
            <div className={`absolute z-30 pointer-events-none transition-transform duration-500 ${stunnedShake} ${isHit ? 'boss-flinch' : ''}`}
                style={{ left: boss.x, top: boss.y, width: 60, height: 120 }}>
                    
                    {/* Boss Speech Bubble */}
                    {boss.mutterText && (
                        <div className="absolute -top-40 left-1/2 -translate-x-1/2 z-50 w-[240px] flex justify-center pointer-events-none">
                            <div key={boss.mutterText} className="bg-black/90 border border-purple-500/50 text-red-200 text-sm px-4 py-3 rounded-lg bubble-animate relative font-serif text-center shadow-[0_0_20px_rgba(120,0,0,0.4)] tracking-wider">
                                {boss.mutterText}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90"></div>
                            </div>
                        </div>
                    )}

                    {/* Health Bar */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-2 bg-black border border-green-900 rounded-full overflow-hidden opacity-80">
                        <div className="h-full bg-green-900" style={{ width: `${boss.health}%` }} />
                    </div>

                    {/* REDESIGNED BOSS BODY - "CORRUPTED TREANT" */}
                    {/* Main Container */}
                    <div className={`relative w-full h-full flex flex-col items-center justify-end transition-all duration-300 ${isHit ? 'filter brightness-200 contrast-200 sepia' : ''} ${scaredEffect}`}>
                        
                        {/* Aura */}
                        <div className={`absolute inset-0 bg-green-950/40 blur-3xl rounded-full transition-all duration-500 ${isWindup ? 'scale-150 opacity-100' : 'scale-110 opacity-60'} ${isScared ? 'animate-pulse opacity-20' : ''}`} />

                        {/* VISUAL TELL: Gathering Energy (Windup) - Enhanced */}
                        {isWindup && (
                            <div className="absolute top-0 right-[-30px] w-24 h-24 bg-purple-500/30 rounded-full blur-xl animate-ping z-50 shadow-[0_0_40px_#a855f7] mix-blend-screen" />
                        )}

                        {/* Legs - Root like */}
                        <div className="absolute bottom-0 w-full flex justify-center gap-4 z-10">
                            {/* Left Leg */}
                            <div className={`w-4 h-20 bg-gradient-to-b from-[#1a1c0d] to-black rounded-b-full origin-top 
                                            ${isMoving ? 'boss-walk-l' : ''} 
                                            ${isWindup ? 'rotate-12' : ''}`}>
                            </div>
                            {/* Right Leg */}
                            <div className={`w-4 h-20 bg-gradient-to-b from-[#1a1c0d] to-black rounded-b-full origin-top 
                                            ${isMoving ? 'boss-walk-r' : ''}
                                            ${isWindup ? '-rotate-12' : ''}`}>
                            </div>
                        </div>

                        {/* Torso/Trunk */}
                        <div className={`relative w-20 h-32 bg-[#1a1c0d] rounded-t-[40px] rounded-b-[20px] z-20 -mb-4 shadow-2xl flex items-center justify-center border border-green-900/30
                                         ${isMoving ? 'animate-[bossSway_3.4s_infinite_ease-in-out]' : ''}
                                         ${isWindup ? 'translate-y-2 scale-105' : ''}`}>
                            
                            {/* Core Weakness */}
                            <div className="absolute top-10 left-1/2 -translate-x-1/2">
                                <Heart size={14} className="text-red-900 fill-red-950 animate-pulse opacity-80" />
                            </div>

                            {/* Arms - Branches */}
                            {/* Left Arm (Passive) */}
                            <div className={`absolute top-6 -left-4 w-4 h-28 bg-[#1a1c0d] rounded-full origin-top 
                                            ${isMoving ? 'boss-arm-idle' : 'rotate-12'}`}>
                                <div className="absolute bottom-0 w-full h-8 bg-green-900/50 blur-sm rounded-full"></div>
                            </div>

                            {/* Right Arm (Attacking) */}
                            <div className={`absolute top-6 -right-4 w-4 h-28 bg-[#1a1c0d] rounded-full origin-top transition-all duration-300
                                            ${isMoving && !isWindup ? 'boss-arm-walk' : ''}
                                            ${isWindup ? 'boss-windup-arm z-50' : '-rotate-12'}`}>
                                <div className="absolute bottom-0 w-full h-8 bg-purple-900/50 blur-sm rounded-full"></div>
                                {/* Hand Glow on Windup - INTENSIFIED */}
                                {isWindup && (
                                    <>
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-purple-400/90 blur-md rounded-full animate-pulse shadow-[0_0_20px_#d8b4fe]" />
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-purple-500/60 blur-xl rounded-full animate-ping" />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Head */}
                        <div className={`relative w-16 h-20 bg-[#0f1108] rounded-[30%] z-30 shadow-lg flex justify-center items-center
                                         ${isMoving ? 'animate-[headBob_3.4s_infinite_ease-in-out]' : ''}
                                         ${isWindup ? 'translate-y-1' : ''}`}>
                            {/* Glowing Eyes */}
                            <div className="flex gap-4 mt-2">
                                <div className={`w-2 h-2 bg-red-900 rounded-full shadow-[0_0_8px_red] ${isScared ? 'opacity-20' : 'animate-pulse'}`} />
                                <div className={`w-2 h-2 bg-red-900 rounded-full shadow-[0_0_8px_red] ${isScared ? 'opacity-20' : 'animate-pulse'}`} />
                            </div>
                        </div>

                    </div>
                    
                    {/* VINE ATTACK VISUAL - Rendered inside Boss container but breaking out */}
                    {(isAttacking || isWindup) && boss.vineAttack.active && (
                        <div className="absolute top-0 left-0 w-0 h-0 overflow-visible z-[100]">
                            {/* SVG Container Overflowing */}
                            <svg className="overflow-visible" style={{ width: 1, height: 1 }}>
                                <defs>
                                    <filter id="vine-glow" x="-100%" y="-100%" width="300%" height="300%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feFlood floodColor="#a855f7" result="color" />
                                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                                        <feMerge>
                                            <feMergeNode in="glow" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                
                                {/* Windup Projection Line - Indicates Path (Dashed Red Line) */}
                                {isWindup && (
                                    <>
                                        <path 
                                            d={vinePath}
                                            fill="none"
                                            stroke="rgba(255, 0, 0, 0.5)" 
                                            strokeWidth="2"
                                            strokeDasharray="8 8"
                                            className="animate-pulse"
                                        />
                                        {/* Target Reticle at end */}
                                        <circle 
                                            cx={boss.vineAttack.targetX - boss.x + 30} 
                                            cy={boss.vineAttack.targetY - boss.y} 
                                            r="12" 
                                            fill="none" 
                                            stroke="red" 
                                            strokeWidth="2"
                                            className="animate-ping"
                                        />
                                    </>
                                )}
                                
                                {/* Vine Body during Attack */}
                                {isAttacking && (
                                    <>
                                        {/* Core Vine */}
                                        <path 
                                            d={vinePath}
                                            fill="none"
                                            stroke="#2f3318"
                                            strokeWidth="14"
                                            strokeLinecap="round"
                                        />
                                        {/* Glowing Inner */}
                                        <path 
                                            d={vinePath}
                                            fill="none"
                                            stroke="#581c87"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            filter="url(#vine-glow)"
                                            strokeDasharray="1000"
                                            strokeDashoffset={1000 * (1 - boss.vineAttack.progress)}
                                        />
                                        {/* Spikes/Thorns */}
                                        <path 
                                            d={vinePath}
                                            fill="none"
                                            stroke="#bef264" 
                                            strokeWidth="3"
                                            strokeDasharray="5 30"
                                            strokeLinecap="square"
                                            strokeDashoffset={1000 * (1 - boss.vineAttack.progress)}
                                            className="opacity-80"
                                        />
                                    </>
                                )}
                            </svg>
                        </div>
                    )}
            </div>
            
            <style>{`
                @keyframes bossSway { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(1deg); } 75% { transform: rotate(-1deg); } }
                @keyframes headBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(1px); } }
                @keyframes shake { 0%, 100% { transform: translate(0,0); } 25% { transform: translate(2px, 2px); } 75% { transform: translate(-2px, -2px); } }
            `}</style>
        </>
    );
};