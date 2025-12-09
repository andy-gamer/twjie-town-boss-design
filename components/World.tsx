
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

    // Calculate player position relative to screen for the darkness mask
    const playerScreenX = player.x - cameraX + player.w / 2;
    const playerScreenY = player.y + player.h / 3; 

    // Proper CSS syntax for radial-gradient size/shape
    // Flashlight ON: Large radius, soft falloff
    // Flashlight OFF: Small radius (150px), hard darkness but slightly transparent outer
    const maskSize = isFlashlightOn ? '600px' : '150px'; 
    const maskColor = isFlashlightOn 
        ? 'transparent 5%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.95) 70%' 
        : 'transparent 10%, rgba(0,0,0,0.9) 85%';

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

            {/* Darkness Overlay (Fog of War) */}
            {!isRevealing && (
                <div 
                    className="absolute inset-0 z-40 pointer-events-none transition-all duration-500 ease-in-out"
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
