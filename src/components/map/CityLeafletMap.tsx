"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { CityPoint, CityPointType } from "@/types/rebuild";

interface CityLeafletMapProps {
  points: CityPoint[];
  selectedPointId: string | null;
  onSelectPoint: (point: CityPoint) => void;
}

const POINT_COLORS: Record<CityPointType, { bg: string; label: string }> = {
  warehouse: { bg: "#0D2B22", label: "С" },
  reception: { bg: "#16A34A", label: "П" },
  pickup: { bg: "#2563EB", label: "В" },
  seller: { bg: "#D97706", label: "Т" },
};

export default function CityLeafletMap({
  points,
  selectedPointId,
  onSelectPoint,
}: CityLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [47.7997, 67.7141], // Жезказган, Казахстан
      zoom: 13,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    points.forEach((pt) => {
      const style = POINT_COLORS[pt.type];
      const isSelected = pt.id === selectedPointId;

      const icon = L.divIcon({
        className: "custom-rebuild-marker",
        html: `<div style="
          width:${isSelected ? 40 : 32}px;
          height:${isSelected ? 40 : 32}px;
          border-radius:9999px;
          background:${style.bg};
          color:#A3E635;
          border:3px solid ${isSelected ? "#A3E635" : "#FFFFFF"};
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:800;
          font-size:${isSelected ? 15 : 13}px;
          cursor:pointer;
        ">${style.label}</div>`,
        iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
        iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon });
      marker.on("click", () => {
        onSelectPoint(pt);
        map.panTo([pt.lat, pt.lng], { animate: true });
      });
      marker.bindTooltip(pt.name, { direction: "top", offset: [0, -14] });
      marker.addTo(layer);
    });
  }, [points, selectedPointId, onSelectPoint]);

  return (
    <div
      ref={mapContainerRef}
      className="h-[440px] sm:h-[540px] w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xs"
    />
  );
}

