"use client";

import React, { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Video,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  LogOut,
  Plus,
  MonitorUp,
  Sparkles,
  CheckCircle2,
  Lock,
  Mic,
  Camera,
} from "lucide-react";
import LiveKitRoomView from "@/components/LiveKitRoomView";
import DirectWebRTCRoomView from "@/components/DirectWebRTCRoomView";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [roomName, setRoomName] = useState("phong-hop-nhom-5");
  const [callEngine, setCallEngine] = useState<"livekit" | "webrtc">("livekit");
  const [inCall, setInCall] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitWsUrl, setLivekitWsUrl] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Quick Account Login
  const handleQuickLogin = async (name: string, provider: string) => {
    setIsLoggingIn(true);
    try {
      await signIn("social-demo", {
        name,
        provider,
        redirect: false,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Join Room
  const handleJoinCall = async (targetRoom?: string) => {
    const finalRoom = (targetRoom || roomName).trim();
    if (!finalRoom) return;
    const userName = session?.user?.name || "Người dùng";

    if (callEngine === "livekit") {
      setIsLoadingToken(true);
      setTokenError(null);
      try {
        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(
            finalRoom
          )}&username=${encodeURIComponent(userName)}`
        );
        const data = await res.json();

        if (data.token && data.wsUrl) {
          setLivekitToken(data.token);
          setLivekitWsUrl(data.wsUrl);
          setInCall(true);
        } else if (!data.configured) {
          // If LiveKit credentials are not yet entered, automatically switch to WebRTC Direct
          setCallEngine("webrtc");
          setInCall(true);
        } else {
          setTokenError(data.error || "Không thể kết nối phòng gọi.");
        }
      } catch (err: unknown) {
        // Fallback to direct WebRTC if API call fails
        console.warn("LiveKit API unavailable, using WebRTC fallback", err);
        setCallEngine("webrtc");
        setInCall(true);
      } finally {
        setIsLoadingToken(false);
      }
    } else {
      setInCall(true);
    }
  };

  const handleCreateNewMeeting = () => {
    const newRoom = `meet-${Math.random().toString(36).substring(2, 8)}`;
    setRoomName(newRoom);
    handleJoinCall(newRoom);
  };

  const handleLeaveCall = () => {
    setInCall(false);
    setLivekitToken(null);
    setLivekitWsUrl(null);
  };

  // Active call view
  if (inCall && session?.user?.name) {
    if (callEngine === "livekit" && livekitToken && livekitWsUrl) {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
          <LiveKitRoomView
            token={livekitToken}
            serverUrl={livekitWsUrl}
            roomName={roomName}
            userName={session.user.name}
            onLeave={handleLeaveCall}
          />
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
        <DirectWebRTCRoomView
          roomName={roomName}
          userName={session.user.name}
          userEmail={session.user.email || ""}
          userImage={session.user.image || undefined}
          onLeave={handleLeaveCall}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                  MeetPulse
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Nhóm 5
                </span>
              </div>
            </div>
          </div>

          {/* User Section in Header */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <span className="text-xs text-slate-400">Đang đồng bộ...</span>
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-full py-1.5 px-3 shadow-inner">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name || "avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (session.user.name || "U").charAt(0)
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border border-slate-800 transition-all text-xs flex items-center gap-1.5"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => signIn("google")}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-sm"
                >
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 lg:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: CTA & Action */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nền tảng gọi video trực tuyến thế hệ mới</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Hội nghị truyền hình{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                chất lượng cao
              </span>{" "}
              cho mọi cuộc gặp gỡ.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Kết nối liền mạch với âm thanh trung thực, video chuẩn HD và khả năng chia sẻ màn hình theo thời gian thực. Trải nghiệm họp trực tuyến mượt mà ngay trên trình duyệt của bạn.
            </p>

            {/* Main Action Box */}
            <div className="mt-2 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
              {!session?.user ? (
                /* Require Login Before Joining */
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold text-white">
                      Đăng nhập để tham gia hoặc tạo cuộc họp
                    </span>
                  </div>

                  {/* Social Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => signIn("google")}
                      className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md active:scale-98"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Tiếp tục với Google</span>
                    </button>

                    <button
                      onClick={() => signIn("github")}
                      className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all shadow-md active:scale-98 border border-slate-700"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                      <span>Tiếp tục với GitHub</span>
                    </button>
                  </div>

                  {/* Fast Account Switcher */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-[11px] text-slate-400 mb-2 font-medium">
                      Hoặc chọn nhanh tài khoản thành viên:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        disabled={isLoggingIn}
                        onClick={() =>
                          handleQuickLogin("Trương Đàm Công Quý", "google")
                        }
                        className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 flex items-center gap-2.5 transition-all text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
                          Q
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 block truncate">
                            Trương Đàm Công Quý
                          </span>
                          <span className="text-[10px] text-indigo-400 block">
                            Thành viên Nhóm 5
                          </span>
                        </div>
                      </button>

                      <button
                        disabled={isLoggingIn}
                        onClick={() =>
                          handleQuickLogin("Tạ Thanh Tấn", "github")
                        }
                        className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 flex items-center gap-2.5 transition-all text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white shadow">
                          T
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 block truncate">
                            Tạ Thanh Tấn
                          </span>
                          <span className="text-[10px] text-indigo-400 block">
                            Thành viên Nhóm 5
                          </span>
                        </div>
                      </button>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Hoặc nhập tên của bạn..."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        disabled={isLoggingIn || !customName.trim()}
                        onClick={() =>
                          handleQuickLogin(customName.trim(), "custom")
                        }
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all"
                      >
                        Vào
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Authenticated State: Join or Create Meeting */
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã đăng nhập: {session.user.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                      <span>Động cơ:</span>
                      <button
                        onClick={() => setCallEngine(callEngine === "livekit" ? "webrtc" : "livekit")}
                        className="font-bold text-indigo-400 hover:underline"
                      >
                        {callEngine === "livekit" ? "LiveKit Cloud SFU" : "WebRTC Direct"}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCreateNewMeeting}
                      className="py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cuộc họp mới</span>
                    </button>

                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Nhập mã cuộc họp..."
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        disabled={isLoadingToken || !roomName.trim()}
                        onClick={() => handleJoinCall()}
                        className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all active:scale-98 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <span>Tham gia</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {tokenError && (
                    <p className="text-xs text-rose-400 mt-1">{tokenError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Visual Mockup Showcase (looks like a real product!) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl p-4">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-slate-400 font-medium ml-2">
                    Phòng họp: phong-hop-nhom-5
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  HD Trực tiếp
                </span>
              </div>

              {/* Mockup Video Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Tile 1: Truong Dam Cong Quy */}
                <div className="relative aspect-video rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/60 overflow-hidden flex items-center justify-center shadow">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-md ring-2 ring-emerald-500/60">
                    Q
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-white truncate max-w-[100px]">
                      Trương Đàm Công Quý
                    </span>
                    <span className="p-1 rounded bg-black/60 text-emerald-400 text-[10px]">
                      <Mic className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>

                {/* Tile 2: Ta Thanh Tan */}
                <div className="relative aspect-video rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/60 overflow-hidden flex items-center justify-center shadow">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-500 to-pink-600 flex items-center justify-center font-bold text-white text-lg shadow-md">
                    T
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-white truncate max-w-[100px]">
                      Tạ Thanh Tấn
                    </span>
                    <span className="p-1 rounded bg-black/60 text-emerald-400 text-[10px]">
                      <Mic className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Mockup Controls Bar */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/80">
                <div className="p-2 rounded-xl bg-slate-800 text-slate-200">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div className="p-2 rounded-xl bg-slate-800 text-slate-200">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div className="p-2 rounded-xl bg-slate-800 text-slate-200">
                  <MonitorUp className="w-3.5 h-3.5" />
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold">
                  Rời phòng
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="border-t border-slate-800/80 bg-slate-900/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">
                Âm thanh & Video Chuẩn HD
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Độ trễ siêu thấp dưới 150ms tối ưu hóa bởi công nghệ WebRTC hiện đại, mang lại trải nghiệm đàm thoại mượt mà.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">
                Tự Động Nhận Diện Tên
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hiển thị chính xác tên người gọi theo tài khoản đăng nhập mạng xã hội, quản lý quyền micro và camera trực quan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white mb-2">
                Bảo Mật & Mã Hóa Kênh
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tất cả các luồng truyền thông đều được mã hóa đầu cuối (End-to-End Encryption) an toàn tuyệt đối.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Development Team / Group Info Section (Required group & member info presented professionally) */}
      <section className="py-12 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-950/30 to-slate-900/90 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  Dự án phát triển
                </span>
                <span className="text-sm font-extrabold text-white">
                  NHÓM 5 (Nhoms5)
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Ứng dụng gọi video trực tuyến tích hợp LiveKit API, xác thực mạng xã hội và quản lý danh sách người tham gia theo thời gian thực.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                  Q
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Trương Đàm Công Quý
                  </h4>
                  <p className="text-[10px] text-slate-400">Thành viên Nhóm 5</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-500 to-pink-600 flex items-center justify-center font-bold text-white text-xs">
                  T
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Tạ Thanh Tấn
                  </h4>
                  <p className="text-[10px] text-slate-400">Thành viên Nhóm 5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          © 2026 MeetPulse • Phát triển bởi Nhóm 5 (Trương Đàm Công Quý & Tạ Thanh Tấn)
        </p>
      </footer>
    </main>
  );
}
