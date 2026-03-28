"use client";

import { useEffect } from "react";
import { 
  BATTLE_ELEMENT_VISUALS, 
  BATTLE_SKILL_META, 
  BATTLE_PASSIVE_ITEMS,
  ACTIVE_COMPANION_CONFIG
} from "@/lib/battle/config";

/**
 * AssetPreloader silently pre-fetches critical game images into the browser cache
 * to prevent flickering or on-demand loading delays during core gameplay.
 */
export function AssetPreloader() {
  useEffect(() => {
    const imagesToPreload = [
      // UI Elements
      "/battle/dice-plate.png",
      "/home/home-bg/home-bg-1.webp",
      "/home/home-bg/home-bg-2.webp",
      "/home/home-bg/home-bg-3.webp",
      "/home/hero-section/hero-panda-trainer.png",
      "/home/hero-section/hero-protomon.png",
      "/protomon-logo.png",
      "/protomon-loading/loading-panda.gif",
      
      // Companion/Theme assets
      ACTIVE_COMPANION_CONFIG.trainerImageSrc,
      ACTIVE_COMPANION_CONFIG.companionImageSrc,
      ACTIVE_COMPANION_CONFIG.stageBackgroundSrc,

      // Elemental Icons & Dice Faces
      ...Object.values(BATTLE_ELEMENT_VISUALS).flatMap(v => [v.iconSrc, v.diceFaceSrc]),

      // Skill Icons
      ...BATTLE_SKILL_META.map(s => s.iconSrc),

      // Passive Item Icons
      ...BATTLE_PASSIVE_ITEMS.map(p => p.iconSrc),
    ];

    // Remove duplicates and filter empty strings
    const uniqueImages = Array.from(new Set(imagesToPreload)).filter(Boolean);

    uniqueImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return null; // Silent component
}
