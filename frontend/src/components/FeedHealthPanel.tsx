"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface FeedInfo {
    status: "healthy" | "stale" | "degraded" | "no_data" | "unknown";
    confidence: number;
    label: string;
    tier: string;
    entity_count: number;
    last_updated: string | null;
    age_seconds: number | null;
}

interface FeedStatusResponse {
    feeds: Record<string, FeedInfo>;
    uptime_seconds: number;
    total_entities: number;
}

const STATUS_COLORS: Record<string, string> = {
    healthy: "text-green-400",
    stale: "text-yellow-400",
    degraded: "text-red-400",
    no_data: "text-gray-500",
    unknown: "text-gray-600",
};

const STATUS_DOT_COLORS: Record<string, string> = {
    healthy: "bg-green-400",
    stale: "bg-yellow-400",
    degraded: "bg-red-400",
    no_data: "bg-gray-500",
    unknown: "bg-gray-600",
};

const CONFIDENCE_COLORS = (score: number): string => {
    if (score >= 0.9) return "text-green-400";
    if (score >= 0.75) return "text-cyan-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-orange-400";
};

function formatAge(seconds: number | null): string {
    if (seconds === null) return "—";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

const FRIENDLY_NAMES: Record<string, string> = {
    commercial_flights: "Commercial Flights",
    private_flights: "Private Aviation",
    private_jets: "Private Jets",
    military_flights: "Military Aviation",
    ships: "Maritime AIS",
    satellites: "Orbital Tracking",
    earthquakes: "Seismology",
    firms_fires: "Fire Hotspots",
    news: "News Feeds",
    gdelt: "GDELT Events",
    frontlines: "Frontlines",
    liveuamap: "LiveUAMap",
    cctv: "CCTV Network",
    kiwisdr: "KiwiSDR",
    internet_outages: "Internet Outages",
    datacenters: "Data Centers",
    space_weather: "Space Weather",
    weather: "Weather Radar",
};

const FeedHealthPanel = React.memo(function FeedHealthPanel() {
    const [isMinimized, setIsMinimized] = useState(true);
    const [feedData, setFeedData] = useState<FeedStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchFeedStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/feed-status`);
            if (res.ok) {
                const data = await res.json();
                setFeedData(data);
            }
        } catch {
            // Silently fail — panel will show no data
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchFeedStatus();
        const interval = setInterval(fetchFeedStatus, 60000); // Refresh every 60s
        return () => clearInterval(interval);
    }, [fetchFeedStatus]);

    const healthySources = feedData ? Object.values(feedData.feeds).filter(f => f.status === "healthy").length : 0;
    const totalSources = feedData ? Object.keys(feedData.feeds).length : 0;
    const degradedSources = feedData ? Object.values(feedData.feeds).filter(f => f.status === "degraded" || f.status === "stale").length : 0;

    return (
        <div className="bg-[var(--bg-primary)]/40 backdrop-blur-md border border-[var(--border-primary)] rounded-xl pointer-events-auto shadow-[0_4px_30px_rgba(0,0,0,0.2)] overflow-hidden mt-4">
            {/* Header */}
            <div
                className="flex justify-between items-center p-3 cursor-pointer hover:bg-[var(--bg-secondary)]/50 transition-colors"
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flex items-center gap-2">
                    <Activity size={12} className={degradedSources > 0 ? "text-yellow-400" : "text-green-400"} />
                    <span className="text-[10px] text-[var(--text-muted)] font-mono tracking-widest">FEED HEALTH</span>
                    <span className="text-[9px] font-mono text-cyan-400">
                        {healthySources}/{totalSources}
                    </span>
                    {degradedSources > 0 && (
                        <span className="text-[8px] font-mono text-yellow-400 border border-yellow-500/30 rounded px-1 py-0.5">
                            {degradedSources} DEGRADED
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); fetchFeedStatus(); }}
                        className="text-[var(--text-muted)] hover:text-cyan-400 transition-colors"
                        title="Refresh feed status"
                    >
                        <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                    </button>
                    {isMinimized ? <ChevronDown size={12} className="text-[var(--text-muted)]" /> : <ChevronUp size={12} className="text-[var(--text-muted)]" />}
                </div>
            </div>

            <AnimatePresence>
                {!isMinimized && feedData && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {/* Summary bar */}
                        <div className="px-3 pb-2 flex items-center gap-3 text-[8px] font-mono text-[var(--text-muted)] border-b border-[var(--border-primary)]/50">
                            <span>ENTITIES: {feedData.total_entities.toLocaleString()}</span>
                            <span>UPTIME: {formatAge(feedData.uptime_seconds)}</span>
                        </div>

                        {/* Feed list */}
                        <div className="max-h-[280px] overflow-y-auto styled-scrollbar">
                            {Object.entries(feedData.feeds).map(([key, feed]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-primary)]/30 last:border-0 hover:bg-[var(--bg-secondary)]/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT_COLORS[feed.status]}`} />
                                        <div className="min-w-0">
                                            <div className="text-[9px] font-mono text-[var(--text-primary)] truncate">
                                                {FRIENDLY_NAMES[key] || key}
                                            </div>
                                            <div className="text-[7px] font-mono text-[var(--text-muted)] truncate">
                                                {feed.label}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                        <span className="text-[8px] font-mono text-[var(--text-muted)]">
                                            {feed.entity_count > 0 ? feed.entity_count.toLocaleString() : "—"}
                                        </span>
                                        <span className={`text-[8px] font-mono ${CONFIDENCE_COLORS(feed.confidence)}`} title={`Confidence: ${(feed.confidence * 100).toFixed(0)}%`}>
                                            {(feed.confidence * 100).toFixed(0)}%
                                        </span>
                                        <span className={`text-[8px] font-mono ${STATUS_COLORS[feed.status]}`}>
                                            {formatAge(feed.age_seconds)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default FeedHealthPanel;
