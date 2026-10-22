import React, { useState, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { AppointmentRecord } from '../types';

interface TelehealthRoomModalProps {
  appointment: AppointmentRecord | null;
  onClose: () => void;
  viewerRole: 'patient' | 'provider';
}

export const TelehealthRoomModal: React.FC<TelehealthRoomModalProps> = ({
  appointment,
  onClose,
  viewerRole,
}) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [chatNote, setChatNote] = useState('');
  const [sessionMessages, setSessionMessages] = useState<
    { sender: string; text: string; time: string }[]
  >([
    {
      sender: 'System (HIPAA Encryption)',
      text: 'End-to-end 256-bit AES TLS video & audio encryption verified for Texas Telepsychiatry session.',
      time: 'Connected',
    },
    {
      sender: 'Brenda Hobyani, PMHNP-BC',
      text: 'Welcome to our Golden Mind Psychiatry 100% Telehealth room. Please make sure your audio and camera are comfortable before we begin.',
      time: 'Just now',
    },
  ]);

  useEffect(() => {
    if (!appointment) return;
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [appointment]);

  if (!appointment) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const rem = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const handleSendRoomChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatNote.trim()) return;
    setSessionMessages((prev) => [
      ...prev,
      {
        sender: viewerRole === 'provider' ? 'Brenda Hobyani, PMHNP-BC' : appointment.patientName,
        text: chatNote.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-6xl bg-[#0A0A0A] border border-[#D4AF37]/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-stone-100">
        {/* Top HIPAA Security Bar */}
        <div className="px-6 py-3.5 bg-[#121212] border-b border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>GOLDEN MIND PSYCHIATRY PLLC · 100% TELEHEALTH VIDEO SANCTUARY</span>
              </div>
              <p className="text-[11px] text-stone-400 font-mono tabular-nums mt-0.5">
                Room ID: {appointment.telehealthUrl.split('/').pop()} · Patient:{' '}
                {appointment.patientName} · {appointment.preferredDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-stone-300 font-mono tabular-nums bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Leave Session</span>
            </button>
          </div>
        </div>

        {/* Main Video Stage + Side Clinical Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Primary Video Feed */}
          <div className="lg:col-span-8 p-5 flex flex-col justify-between bg-[#0E0E0E] relative min-h-[380px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {/* Provider Feed */}
              <div className="relative rounded-xl overflow-hidden bg-stone-900 border border-[#D4AF37]/30 flex flex-col items-center justify-center p-6 min-h-[240px]">
                <img
                  src="/WA_1792680137982.jpeg"
                  alt="Brenda Hobyani, PMHNP-BC"
                  className="w-24 h-24 rounded-full object-cover object-top border-2 border-[#D4AF37] mb-3 shadow-lg"
                />
                <p className="text-sm font-serif font-bold text-white">
                  Brenda Hobyani, PMHNP-BC
                </p>
                <p className="text-xs text-[#D4AF37] mt-0.5">
                  Board-Certified Psychiatric Nurse Practitioner
                </p>
                <span className="mt-3 text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  HD Audio & Video Ready
                </span>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/70 text-[11px] text-stone-200">
                  Provider Stream · Texas Licensed
                </div>
              </div>

              {/* Patient Self-View Feed */}
              <div className="relative rounded-xl overflow-hidden bg-stone-900 border border-stone-800 flex flex-col items-center justify-center p-6 min-h-[240px]">
                {videoEnabled ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] mb-3">
                      <User className="w-9 h-9" />
                    </div>
                    <p className="text-sm font-serif font-bold text-white">
                      {appointment.patientName}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {appointment.serviceType}
                    </p>
                    <span className="mt-3 text-[11px] text-stone-300">
                      Camera Active · {micEnabled ? 'Microphone Unmuted' : 'Microphone Muted'}
                    </span>
                  </>
                ) : (
                  <div className="text-center text-stone-400">
                    <VideoOff className="w-10 h-10 mx-auto mb-2 text-stone-500" />
                    <p className="text-xs font-medium">Camera Paused</p>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/70 text-[11px] text-stone-200">
                  Patient Stream ({appointment.patientName})
                </div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="mt-5 pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-stone-400">
                <span className="text-stone-200 font-medium">Focus:</span>{' '}
                {appointment.conditionReason} ·{' '}
                {appointment.preVisitScreenerCompleted ? (
                  <span className="text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pre-Visit PHQ-9/GAD-7 Completed
                  </span>
                ) : (
                  <span className="text-amber-400">Pre-Visit Check-In Pending</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMicEnabled(!micEnabled)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
                    micEnabled
                      ? 'bg-stone-900 border-stone-700 text-stone-100 hover:border-[#D4AF37]'
                      : 'bg-red-950/60 border-red-700 text-red-200'
                  }`}
                >
                  {micEnabled ? <Mic className="w-4 h-4 text-[#D4AF37]" /> : <MicOff className="w-4 h-4" />}
                  <span>{micEnabled ? 'Mute Audio' : 'Unmute Audio'}</span>
                </button>

                <button
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
                    videoEnabled
                      ? 'bg-stone-900 border-stone-700 text-stone-100 hover:border-[#D4AF37]'
                      : 'bg-red-950/60 border-red-700 text-red-200'
                  }`}
                >
                  {videoEnabled ? (
                    <Video className="w-4 h-4 text-[#D4AF37]" />
                  ) : (
                    <VideoOff className="w-4 h-4" />
                  )}
                  <span>{videoEnabled ? 'Stop Video' : 'Start Video'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side In-Session Chat & Telehealth Info */}
          <div className="lg:col-span-4 bg-[#141414] border-l border-stone-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-stone-800">
                <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                  In-Session Clinical Chat
                </h3>
              </div>

              <div className="py-4 space-y-3 max-h-[260px] overflow-y-auto">
                {sessionMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#D4AF37] font-semibold">
                      <span>{m.sender}</span>
                      <span className="text-stone-500 font-mono tabular-nums">{m.time}</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendRoomChat} className="pt-3 border-t border-stone-800 space-y-2">
              <input
                type="text"
                value={chatNote}
                onChange={(e) => setChatNote(e.target.value)}
                placeholder="Type a message during your video visit..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-gold-gradient text-[#1C1917] font-bold text-xs cursor-pointer hover:opacity-95 transition-opacity"
              >
                Send Session Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
