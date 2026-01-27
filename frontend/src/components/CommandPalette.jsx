import React, { useEffect, useMemo, useRef, useState } from "react";

export default function CommandPalette({ isOpen, onClose, commands }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!Array.isArray(commands)) return [];
    const term = query.trim().toLowerCase();
    return commands.filter(cmd =>
      !term || cmd.label.toLowerCase().includes(term) || (cmd.hint || "").toLowerCase().includes(term)
    );
  }, [commands, query]);

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      onClose?.();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(filtered.length, 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const selected = filtered[activeIndex];
      if (selected?.action) {
        selected.action();
        onClose?.();
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose} role="presentation">
      <div className="command-palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="command-header">
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            placeholder="Search commands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="command-hint">Press Esc to close</span>
        </div>
        <ul className="command-list" role="listbox">
          {filtered.length === 0 ? (
            <li className="command-empty">No matches</li>
          ) : (
            filtered.map((cmd, idx) => (
              <li
                key={cmd.id}
                className={`command-item${idx === activeIndex ? " command-item--active" : ""}`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  cmd.action?.();
                  onClose?.();
                }}
                role="option"
                aria-selected={idx === activeIndex}
              >
                <div className="command-label">
                  {cmd.label}
                  {cmd.hint && <span className="command-subtext">{cmd.hint}</span>}
                </div>
                {cmd.kbd && <span className="command-kbd">{cmd.kbd}</span>}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
