"use client";

import React, { useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
} from "@livekit/components-react";
import { Users, PhoneOff, ShieldCheck, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface LiveKitRoomViewProps {
  token: string;
  serverUrl: string;
  roomName: string;
  userName: string;
  onLeave: () => void;
}

function LiveKitParticipantList() {
  const participants = useParticipants();

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">
            Danh sách người gọi ({participants.length})
          </h3>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
          LiveKit API
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Tên hiển thị nhận tự động từ tài khoản đăng nhập mạng xã hội:
      </p>

      <div className="space-y-2 overflow-y-auto pr-1 flex-1">
        {participants.map((p) => {
          const isSpeaking = p.isSpeaking;
          const isMicOn = p.isMicrophoneEnabled;
          const isCamOn = p.isCameraEnabled;
          const displayName = p.name || p.identity;

          return (
            <div
              key={p.sid || p.identity}
              className={`p-3 rounded-xl border transition-all ${
                isSpeaking
                  ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                  : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    {isSpeaking && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-ping" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-100 text-sm truncate max-w-[130px]" title={displayName}>
                        {displayName}
                      </p>
                      {p.isLocal && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-medium">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {p.identity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isMicOn
                        ? "bg-slate-700/80 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                    title={isMicOn ? "Microphone bật" : "Microphone tắt"}
                  >
                    {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`p-1.5 rounded-lg ${
                      isCamOn
                        ? "bg-slate-700/80 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                    title={isCamOn ? "Camera bật" : "Camera tắt"}
                  >
                    {isCamOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Mã hóa WebRTC LiveKit Cloud</span>
      </div>
    </div>
  );
}

export default function LiveKitRoomView({
  token,
  serverUrl,
  roomName,
  userName,
  onLeave,
}: LiveKitRoomViewProps) {
  const [showParticipantDrawer, setShowParticipantDrawer] = useState(true);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-7xl mx-auto p-2 sm:p-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-3 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-300">
              Phòng: {roomName}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Tên đăng nhập:</span>
            <span className="font-semibold text-slate-200">{userName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowParticipantDrawer(!showParticipantDrawer)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              showParticipantDrawer
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh sách người gọi ({showParticipantDrawer ? "Ẩn" : "Hiện"})</span>
          </button>
          <button
            onClick={onLeave}
            className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Rời phòng</span>
          </button>
        </div>
      </div>

      {/* Main Conference Area inside single LiveKitRoom */}
      <div className="flex-1 min-h-0 relative">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          onDisconnected={onLeave}
          className="h-full w-full flex flex-col lg:flex-row gap-3"
        >
          <div className="flex-1 min-h-0 h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-2xl relative">
            <VideoConference />
            <RoomAudioRenderer />
          </div>

          {showParticipantDrawer && (
            <div className="w-full lg:w-80 h-full flex-shrink-0">
              <LiveKitParticipantList />
            </div>
          )}
        </LiveKitRoom>
      </div>
    </div>
  );
}
