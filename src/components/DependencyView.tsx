"use client";
import { useMemo, useRef, useState } from "react";
import { useWorkspace } from "../lib/store";
import { DependencyGraph } from "../lib/graph";
import { dependencyTypes } from "../lib/product";

const cardWidth = 278;
const cardHeight = 76;
const columnStep = 365;

export function DependencyView() {
  const s = useWorkspace();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const graph = useMemo(() => new DependencyGraph(s.product), [s.product]);
  const related = new Set(
    s.selectedComponentId
      ? [
          s.selectedComponentId,
          ...graph.getAncestors(s.selectedComponentId),
          ...graph.getDescendants(s.selectedComponentId),
        ]
      : s.product.components.map((c) => c.id),
  );
  const { positions, width, height } = useMemo(() => {
    const ids = s.product.components.map((c) => c.id);
    const incoming = new Map(ids.map((id) => [id, 0]));
    const outgoing = new Map(ids.map((id) => [id, [] as string[]]));
    for (const edge of s.product.dependencies) {
      incoming.set(
        edge.targetComponentId,
        (incoming.get(edge.targetComponentId) ?? 0) + 1,
      );
      outgoing.get(edge.sourceComponentId)?.push(edge.targetComponentId);
    }
    const queue = ids.filter((id) => incoming.get(id) === 0);
    const depth = new Map(ids.map((id) => [id, 0]));
    const visited = new Set<string>();
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      for (const target of outgoing.get(id) ?? []) {
        depth.set(
          target,
          Math.max(depth.get(target) ?? 0, (depth.get(id) ?? 0) + 1),
        );
        incoming.set(target, (incoming.get(target) ?? 1) - 1);
        if (incoming.get(target) === 0) queue.push(target);
      }
    }
    // Cyclic or disconnected leftovers remain visible in a final column.
    const cycleColumn = Math.max(0, ...depth.values()) + 1;
    for (const id of ids) if (!visited.has(id)) depth.set(id, cycleColumn);
    const columns = new Map<number, string[]>();
    for (const id of ids) {
      const layer = depth.get(id) ?? 0;
      columns.set(layer, [...(columns.get(layer) ?? []), id]);
    }
    const maxRows = Math.max(
      1,
      ...Array.from(columns.values(), (items) => items.length),
    );
    const graphHeight = Math.max(540, 110 + maxRows * 105);
    const graphWidth = Math.max(
      650,
      200 + (Math.max(0, ...columns.keys()) + 1) * columnStep,
    );
    const coords: Record<string, { x: number; y: number; layer: number }> = {};
    for (const [layer, items] of columns) {
      const step = Math.min(112, (graphHeight - 130) / items.length);
      const startY = (graphHeight - (items.length - 1) * step) / 2;
      items.forEach((id, i) => {
        coords[id] = {
          x: 150 + layer * columnStep,
          y: startY + i * step,
          layer,
        };
      });
    }
    return { positions: coords, width: graphWidth, height: graphHeight };
  }, [s.product]);
  const center = (s.selectedComponentId &&
    positions[s.selectedComponentId]) || { x: width / 2, y: height / 2 };

  return (
    <div className="graph-panel">
      <div className="graph-toolbar">
        <span>COMPONENT RELATIONSHIPS / PROVIDER → CONSUMER</span>
        <button
          aria-label="Zoom graph out"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
        >
          −
        </button>
        <button
          aria-label="Zoom graph in"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
        >
          +
        </button>
        <button
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1);
          }}
        >
          Fit graph
        </button>
        <button
          disabled={!s.selectedComponentId}
          onClick={() => {
            setPan({ x: width / 2 - center.x, y: height / 2 - center.y });
            setZoom(1);
          }}
        >
          Focus selected
        </button>
      </div>
      <div className="filters">
        {dependencyTypes
          .filter((t) =>
            s.product.dependencies.some((e) => e.dependencyType === t),
          )
          .map((type) => (
            <button
              key={type}
              aria-pressed={s.dependencyFilters.includes(type)}
              onClick={() =>
                useWorkspace.setState({
                  dependencyFilters: s.dependencyFilters.includes(type)
                    ? s.dependencyFilters.filter((t) => t !== type)
                    : [...s.dependencyFilters, type],
                })
              }
            >
              {type}
            </button>
          ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="Component dependency graph"
        onPointerDown={(e) => {
          if ((e.target as Element).closest("[data-node]")) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            const scale = width / e.currentTarget.getBoundingClientRect().width;
            setPan({
              x: drag.current.px + (e.clientX - drag.current.x) * scale,
              y: drag.current.py + (e.clientY - drag.current.y) * scale,
            });
          }
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          <marker
            id="inside-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#53677d" />
          </marker>
          <marker
            id="inside-arrow-active"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3c5" />
          </marker>
        </defs>
        <g
          transform={`translate(${pan.x},${pan.y}) translate(${width / 2},${height / 2}) scale(${zoom}) translate(${-width / 2},${-height / 2})`}
        >
          {s.product.dependencies
            .filter(
              (e) =>
                !s.dependencyFilters.length ||
                s.dependencyFilters.includes(e.dependencyType),
            )
            .map((e) => {
              const a = positions[e.sourceComponentId],
                b = positions[e.targetComponentId];
              if (!a || !b) return null;
              const active =
                Boolean(s.selectedComponentId) &&
                related.has(e.sourceComponentId) &&
                related.has(e.targetComponentId);
              const x1 = a.x + cardWidth / 2,
                x2 = b.x - cardWidth / 2;
              const bend = Math.max(50, (x2 - x1) * 0.45);
              return (
                <path
                  key={e.id}
                  d={`M${x1},${a.y} C${x1 + bend},${a.y} ${x2 - bend},${b.y} ${x2},${b.y}`}
                  fill="none"
                  stroke={active ? "#14b8a6" : "#354458"}
                  strokeWidth={
                    s.selectedComponentId &&
                    (e.sourceComponentId === s.selectedComponentId ||
                      e.targetComponentId === s.selectedComponentId)
                      ? 2.4
                      : 1.5
                  }
                  strokeDasharray={
                    active && s.selectedComponentId ? "6 5" : undefined
                  }
                  markerEnd={
                    active ? "url(#inside-arrow-active)" : "url(#inside-arrow)"
                  }
                >
                  <title>
                    {e.description} · {e.dependencyType}
                  </title>
                </path>
              );
            })}
          {s.product.components.map((c) => {
            const p = positions[c.id];
            const status = s.compareBefore
              ? "healthy"
              : (s.activeSimulation?.statuses[c.id] ?? "healthy");
            const selected = s.selectedComponentId === c.id;
            const name =
              c.name.length > 27 ? `${c.name.slice(0, 26)}…` : c.name;
            return (
              <g
                data-node="true"
                role="button"
                tabIndex={0}
                aria-label={`${c.name}, ${status}`}
                key={c.id}
                transform={`translate(${p.x},${p.y})`}
                className={`graph-node ${selected ? "selected" : ""} ${related.has(c.id) && s.selectedComponentId ? "related" : ""}`}
                opacity={related.has(c.id) ? 1 : 0.32}
                onClick={() => s.select(c.id)}
                onDoubleClick={() => {
                  s.focus(c.id);
                  s.setMode("Explore");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    s.select(c.id);
                  }
                }}
              >
                <rect
                  x={-cardWidth / 2}
                  y={-cardHeight / 2}
                  width={cardWidth}
                  height={cardHeight}
                  rx={13}
                />
                <circle cx={-cardWidth / 2 + 17} cy={-16} r={5} />
                <text x={-cardWidth / 2 + 31} y={-11} className="graph-name">
                  {name}
                </text>
                <text x={-cardWidth / 2 + 18} y={13} className="graph-meta">
                  {c.category.toUpperCase()} / LAYER {p.layer}
                </text>
                <text
                  x={cardWidth / 2 - 13}
                  y={-cardHeight / 2 + 17}
                  textAnchor="end"
                  className={`graph-status ${status}`}
                >
                  {selected
                    ? "SELECTED"
                    : status === "healthy"
                      ? ""
                      : status.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <p className="caption">
        Drag to pan · Select a node to inspect · Double-click to focus in 3D
      </p>
    </div>
  );
}
