import React from 'react';
import { RoomData, PlayerState, BossState } from '../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../data';
import { EntityView } from './Entity';
import { PlayerView, BossView } from './Character';
import { ThoughtBubble } from './UI';

export const WorldRenderer = ({ 
    room, 
    player, 
    boss, 
    isRevealing, 
    isHighBeam,
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
    isHighBeam: boolean,
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

    // Calculate player position relative to screen for the darkness mask
    const playerScreenX = player.x - cameraX + player.w / 2;
    const playerScreenY = player.y + player.h / 3; 

    // Light Logic:
    let maskSize = '200px'; 
    // Brighter ambient light: Opacity reduced from 0.6/0.9 to 0.4/0.75
    let maskColor = 'transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.75) 90%'; 
    
    // Low Battery Flicker
    const isLowBattery = player.battery < 20 && player.flashlightOn;
    const flickerOpacity = isLowBattery ? (Math.random() * 0.4 + 0.6) : 1;

    if (player.flashlightOn && player.battery > 0) {
        if (isHighBeam) {
             // High Beam (Space)
             maskSize = '600px';
             maskColor = `transparent 10%, rgba(0,0,0,${0.1 * flickerOpacity}) 50%, rgba(0,0,0,${0.85 * flickerOpacity}) 90%`;
        } else {
             // Standard Beam (F)
             maskSize = '300px';
             maskColor = `transparent 5%, rgba(0,0,0,${0.2 * flickerOpacity}) 40%, rgba(0,0,0,${0.8 * flickerOpacity}) 80%`;
        }
    } else {
        // Off or Empty Battery (Dimly lit, visible)
        maskSize = '150px';
        maskColor = 'transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 90%';
    }

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

                    {room.entities.map(ent => {
                         // Calculate distance for 'near' hint
                         const dx = (ent.x + ent.w/2) - (player.x + player.w/2);
                         const dy = (ent.y + ent.h/2) - (player.y + player.h/2);
                         const dist = Math.sqrt(dx*dx + dy*dy);
                         const isNear = dist < 100;

                        return (
                            <EntityView 
                                key={ent.id} 
                                entity={ent} 
                                isRevealing={isRevealing} 
                                isInventoryItem={player.inventory.includes(ent.id)} 
                                isLocked={ent.type === 'door' && isDoorLocked(ent.id)}
                                isNear={isNear}
                            />
                        );
                    })}

                    <BossView boss={boss} isRevealing={isRevealing} />
                    <PlayerView player={player} isFlashlightOn={player.flashlightOn && player.battery > 0} isMoving={isMoving} />
                    <ThoughtBubble text={thought} x={player.x} y={player.y} />
                </div>
            </div>

            {/* Darkness Overlay (Fog of War) */}
            {!isRevealing && (
                <div 
                    className="absolute inset-0 z-40 pointer-events-none transition-all duration-75 ease-out"
                    style={{
                        background: `radial-gradient(circle ${maskSize} at ${playerScreenX}px ${playerScreenY}px, ${maskColor})`
                    }}
                />
            )}

            {isRevealing && <div className="noise-overlay" />}
            <div className="scanlines w-full h-full absolute top-0 left-0 z-50" />
            <div className="vignette w-full h-full absolute top-0 left-0 z-50" />
        </div>
    );
};