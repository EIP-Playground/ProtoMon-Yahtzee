"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useLocale } from "@/components/providers/LocaleProvider";
import { BATTLE_PASSIVE_ITEMS } from "@/lib/battle/config";

export function PassiveItemsPanel() {
  const { locale } = useLocale();
  const cells = [...BATTLE_PASSIVE_ITEMS, null] as const;
  const [hoveredItem, setHoveredItem] = useState<{
    id: string;
    name: string;
    description: string;
    x: number;
    y: number;
    placement: "top" | "bottom";
  } | null>(null);

  const tooltipNode = useMemo(() => {
    if (!hoveredItem || typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <div
        className="pixel-rounded-md pointer-events-none fixed z-[140] w-[156px] -translate-x-1/2 border-[3px] border-[#1d2430] bg-[rgba(13,19,31,0.96)] px-3 py-2 text-[10px] leading-[1.45] text-slate-100 shadow-[0_12px_24px_rgba(2,6,23,0.42)]"
        style={{
          left: `${hoveredItem.x}px`,
          top: `${hoveredItem.y}px`,
          transform:
            hoveredItem.placement === "top"
              ? "translate(-50%, calc(-100% - 8px))"
              : "translate(-50%, 8px)",
        }}
      >
        <p className="pixel-font mb-1 text-[10px] uppercase tracking-[0.08em] text-[#fff2c3]">
          {hoveredItem.name}
        </p>
        {hoveredItem.description}
      </div>,
      document.body,
    );
  }, [hoveredItem]);

  function showTooltip(
    item: (typeof BATTLE_PASSIVE_ITEMS)[number],
    target: HTMLElement,
  ) {
    const rect = target.getBoundingClientRect();
    const prefersBottom = rect.top < 120;

    setHoveredItem({
      id: item.id,
      name: item.name[locale],
      description: item.description[locale],
      x: rect.left + rect.width / 2,
      y: prefersBottom ? rect.bottom : rect.top,
      placement: prefersBottom ? "bottom" : "top",
    });
  }

  return (
    <>
      <section className="pixel-rounded-lg border-[4px] border-[rgba(228,241,252,0.42)] bg-[rgba(214,229,240,0.2)] p-[12px] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.16),0_12px_24px_rgba(7,12,20,0.14)] backdrop-blur-[2px]">
        <div className="grid grid-cols-3 gap-[10px]">
        {cells.map((item, index) => (
          <div
            key={item ? item.id : `empty-${index}`}
            className="group relative"
          >
            <div className="pixel-rounded-md flex h-[92px] w-full items-center justify-center border-[3px] border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.68)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)]">
              {item ? (
                <img
                  src={item.iconSrc}
                  alt={item.name[locale]}
                  className="h-[56px] w-[56px] object-contain drop-shadow-[0_8px_10px_rgba(15,23,42,0.18)]"
                  onMouseEnter={(event) => showTooltip(item, event.currentTarget)}
                  onFocus={(event) => showTooltip(item, event.currentTarget)}
                  onMouseLeave={() => setHoveredItem((current) => (current?.id === item.id ? null : current))}
                  onBlur={() => setHoveredItem((current) => (current?.id === item.id ? null : current))}
                />
              ) : null}
            </div>
          </div>
        ))}
        </div>
      </section>
      {tooltipNode}
    </>
  );
}
