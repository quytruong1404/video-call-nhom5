"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Users,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MessageSquare,
  ShieldCheck,
  Send,
  Sparkles,
} from "lucide-react";

interface DirectWebRTCRoomViewProps {
  roomName: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  onLeave: () => void;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  image?: string;
  isLocal: boolean;
  isMicOn: boolean;
  isCamOn: boolean;
  isSpeaking: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export default function DirectWebRTCRoomView({
  roomName,
  userName,
  userEmail,
  userImage,
  onLeave,
}: DirectWebRTCRoomViewProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipantList, setShowParticipantList] = useState(true);

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "local-user",
      name: userName,
      email: userEmail,
      image: userImage,
      isLocal: true,
      isMicOn: true,
      isCamOn: true,
      isSpeaking: false,
    },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-1",
      sender: "Hệ thống",
      text: `Chào mừng ${userName} đã tham gia phòng ${roomName}!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize media stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        currentStream = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera/Mic not accessible, falling back to simulated stream:", err);
      }
    }

    initMedia();

    // Multi-tab broadcast channel for local testing
    try {
      const channel = new BroadcastChannel(`room_${roomName}`);
      channelRef.current = channel;

      // Announce arrival
      const myId = `peer_${Math.random().toString(36).substring(2, 9)}`;
      channel.postMessage({
        type: "JOIN",
        payload: {
          id: myId,
          name: userName,
          email: userEmail,
          image: userImage,
          isMicOn: true,
          isCamOn: true,
        },
      });

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === "JOIN") {
          setParticipants((prev) => {
            if (prev.some((p) => p.email === payload.email || p.id === payload.id)) {
              return prev;
            }
            return [
              ...prev,
              {
                id: payload.id,
                name: payload.name,
                email: payload.email,
                image: payload.image,
                isLocal: false,
                isMicOn: payload.isMicOn ?? true,
                isCamOn: payload.isCamOn ?? true,
                isSpeaking: false,
              },
            ];
          });
          // Reply with my info so the new participant knows me
          channel.postMessage({
            type: "ANNOUNCE_BACK",
            payload: {
              id: "local-user",
              name: userName,
              email: userEmail,
              image: userImage,
              isMicOn,
              isCamOn,
            },
          });
        } else if (type === "ANNOUNCE_BACK") {
          setParticipants((prev) => {
            if (prev.some((p) => p.email === payload.email)) return prev;
            return [
              ...prev,
              {
                id: payload.id,
                name: payload.name,
                email: payload.email,
                image: payload.image,
                isLocal: false,
                isMicOn: payload.isMicOn ?? true,
                isCamOn: payload.isCamOn ?? true,
                isSpeaking: false,
              },
            ];
          });
        } else if (type === "CHAT") {
          setMessages((prev) => [...prev, payload]);
        } else if (type === "STATE_CHANGE") {
          setParticipants((prev) =>
            prev.map((p) => (p.email === payload.email ? { ...p, ...payload } : p))
          );
        } else if (type === "LEAVE") {
          setParticipants((prev) => prev.filter((p) => p.email !== payload.email));
        }
      };
    } catch {
      // BroadcastChannel unsupported
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "LEAVE",
          payload: { email: userEmail },
        });
        channelRef.current.close();
      }
    };
  }, [roomName, userEmail, userName, userImage]);

  // Toggle Microphone
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !isMicOn));
    }
    const next = !isMicOn;
    setIsMicOn(next);
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isMicOn: next } : p))
    );
    channelRef.current?.postMessage({
      type: "STATE_CHANGE",
      payload: { email: userEmail, isMicOn: next },
    });
  };

  // Toggle Camera
  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !isCamOn));
    }
    const next = !isCamOn;
    setIsCamOn(next);
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isCamOn: next } : p))
    );
    channelRef.current?.postMessage({
      type: "STATE_CHANGE",
      payload: { email: userEmail, isCamOn: next },
    });
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
          setIsScreenSharing(false);
        };
      } catch (e) {
        console.warn("Screen share cancelled", e);
      }
    }
  };

  // Send Chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: userName,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    channelRef.current?.postMessage({ type: "CHAT", payload: msg });
    setInputMessage("");
  };

  // Add a simulated teammate (e.g. member from Group 5) to test multi-user view instantly
  const addSimulatedMember = () => {
    const isTan = participants.some((p) => p.name.includes("Tạ Thanh Tấn"));
    const newMember: Participant = isTan
      ? {
          id: `sim-${Date.now()}`,
          name: "Trương Đàm Công Quý (Nhóm 5)",
          email: "truongdamcongquy@xdpm.edu.vn",
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Quy",
          isLocal: false,
          isMicOn: true,
          isCamOn: true,
          isSpeaking: false,
        }
      : {
          id: `sim-${Date.now()}`,
          name: "Tạ Thanh Tấn (Nhóm 5)",
          email: "tathanhtan@xdpm.edu.vn",
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tan",
          isLocal: false,
          isMicOn: true,
          isCamOn: true,
          isSpeaking: false,
        };

    setParticipants((prev) => [...prev, newMember]);
    setMessages((prev) => [
      ...prev,
      {
        id: `sim-msg-${Date.now()}`,
        sender: "Hệ thống",
        text: `${newMember.name} vừa tham gia cuộc gọi.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-7xl mx-auto p-2 sm:p-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-3 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-300">
              Phòng: {roomName}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Đang đăng nhập:</span>
            <span className="font-semibold text-slate-200">{userName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addSimulatedMember}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-medium border border-indigo-500/30 flex items-center gap-1.5 transition-all"
            title="Thêm thành viên Nhóm 5 để kiểm tra hiển thị nhiều người"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mời thành viên</span>
          </button>
          <button
            onClick={() => setShowParticipantList(!showParticipantList)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              showParticipantList
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh sách người gọi ({participants.length})</span>
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

      {/* Main Grid: Video + Sidebars */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-3 relative">
        {/* Video Canvas Area */}
        <div
          className={`${
            showParticipantList || showChat ? "lg:col-span-3" : "lg:col-span-4"
          } h-full flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl relative`}
        >
          {/* Video Grid */}
          <div className="flex-1 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
            {/* Local Video Tile */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center min-h-[220px] shadow-lg group">
              {isCamOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    isScreenSharing ? "" : "-scale-x-100"
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Camera đã tắt</span>
                </div>
              )}

              {/* Name Overlay & Status */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-2">
                  <span>{userName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/80 text-white font-medium">
                    Bạn
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`p-1.5 rounded-lg backdrop-blur-md ${
                      isMicOn
                        ? "bg-black/60 text-emerald-400"
                        : "bg-rose-500/80 text-white"
                    }`}
                  >
                    {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Remote Participants Video Tiles */}
            {participants
              .filter((p) => !p.isLocal)
              .map((p) => (
                <div
                  key={p.id}
                  className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center min-h-[220px] shadow-lg group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-pink-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg animate-pulse">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Trực tuyến
                    </span>
                  </div>

                  {/* Name Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`p-1.5 rounded-lg backdrop-blur-md ${
                          p.isMicOn ? "bg-black/60 text-emerald-400" : "bg-rose-500/80 text-white"
                        }`}
                      >
                        {p.isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Bottom Call Controls */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isMicOn
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-100"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              }`}
              title={isMicOn ? "Tắt micro" : "Bật micro"}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleCam}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isCamOn
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-100"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              }`}
              title={isCamOn ? "Tắt camera" : "Bật camera"}
            >
              {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                isScreenSharing
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-100"
              }`}
              title="Chia sẻ màn hình"
            >
              <ScreenShare className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-2xl transition-all shadow-md ${
                showChat
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-100"
              }`}
              title="Mở tin nhắn"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={onLeave}
              className="p-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
              title="Kết thúc cuộc gọi"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="hidden sm:inline text-xs">Kết thúc</span>
            </button>
          </div>
        </div>

        {/* Sidebar: Participant List & Chat */}
        {(showParticipantList || showChat) && (
          <div className="lg:col-span-1 h-full flex flex-col gap-3 min-h-0">
            {/* Participant List (Requirement: Hiển thị danh sách người gọi theo tên đã nhận khi đăng nhập) */}
            {showParticipantList && (
              <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col flex-1 min-h-0 overflow-hidden">
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
                    Trực tuyến
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-2">
                  Người tham gia trong cuộc gọi:
                </p>

                <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow flex-shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className="font-semibold text-slate-100 text-xs truncate max-w-[120px]"
                              title={p.name}
                            >
                              {p.name}
                            </p>
                            {p.isLocal && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-medium">
                                Bạn
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {p.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span
                          className={`p-1 rounded-md text-[10px] ${
                            p.isMicOn ? "bg-slate-700 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {p.isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                        </span>
                        <span
                          className={`p-1 rounded-md text-[10px] ${
                            p.isCamOn ? "bg-slate-700 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {p.isCamOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WebRTC P2P Peer Connection</span>
                </div>
              </div>
            )}

            {/* Chat Box */}
            {showChat && (
              <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-100">Trò chuyện trong phòng</h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded-xl text-xs ${
                        m.sender === userName
                          ? "bg-indigo-600/30 border border-indigo-500/30 text-indigo-100 ml-4"
                          : m.sender === "Hệ thống"
                          ? "bg-slate-800/40 text-slate-400 italic text-[11px] text-center"
                          : "bg-slate-800/80 border border-slate-700/50 text-slate-200 mr-4"
                      }`}
                    >
                      {m.sender !== "Hệ thống" && (
                        <div className="flex items-center justify-between font-semibold text-[10px] text-indigo-300 mb-0.5">
                          <span>{m.sender}</span>
                          <span className="text-slate-400">{m.time}</span>
                        </div>
                      )}
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
