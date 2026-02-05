"use client";

import { useState, useEffect, useRef } from "react";
import type { Meeting, Member } from "@/lib/supabase";

export function AttendanceForm() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Photo upload states
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load meetings and members
  useEffect(() => {
    const loadData = async () => {
      try {
        const [meetingsRes, membersRes] = await Promise.all([
          fetch("/api/meetings"),
          fetch("/api/members"),
        ]);
        const meetingsData = await meetingsRes.json();
        const membersData = await membersRes.json();

        setMeetings(meetingsData);
        setMembers(membersData);

        // Select the most recent past meeting by default
        const today = new Date().toISOString().split("T")[0];
        const pastMeetings = meetingsData.filter(
          (m: Meeting) => m.meeting_date <= today
        );
        if (pastMeetings.length > 0) {
          setSelectedMeetingId(pastMeetings[0].id);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load attendance when meeting changes
  useEffect(() => {
    if (!selectedMeetingId) {
      setCurrentPhotoUrl(null);
      return;
    }

    const loadAttendance = async () => {
      try {
        const res = await fetch(`/api/attendance?meetingId=${selectedMeetingId}`);
        const data = await res.json();
        setSelectedMembers(new Set(data.memberIds));
      } catch (error) {
        console.error("Failed to load attendance:", error);
      }
    };
    loadAttendance();

    // Load current photo for the meeting
    const meeting = meetings.find((m) => m.id === selectedMeetingId);
    setCurrentPhotoUrl(meeting?.photo_url || null);
    setPhotoPreview(null);
  }, [selectedMeetingId, meetings]);

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSave = async () => {
    if (!selectedMeetingId) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: selectedMeetingId,
          memberIds: Array.from(selectedMembers),
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Presenças salvas!" });
      } else {
        setMessage({ type: "error", text: "Erro ao salvar" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar" });
    } finally {
      setSaving(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !selectedMeetingId) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("meetingId", selectedMeetingId);

      const res = await fetch("/api/meetings/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Foto enviada!" });
        setCurrentPhotoUrl(data.photoUrl);
        setPhotoPreview(null);
        // Update the meetings array with the new photo URL
        setMeetings((prev) =>
          prev.map((m) =>
            m.id === selectedMeetingId ? { ...m, photo_url: data.photoUrl } : m
          )
        );
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao enviar foto" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao enviar foto" });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const cancelPhotoSelection = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="text-center text-[var(--text-muted)] py-8">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meeting Selector */}
      <div>
        <label
          htmlFor="meeting"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
        >
          Data do encontro
        </label>
        <select
          id="meeting"
          value={selectedMeetingId}
          onChange={(e) => setSelectedMeetingId(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[var(--ash)] bg-[var(--slate)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--electric)] focus:border-transparent"
        >
          <option value="">Selecione uma data</option>
          {meetings.map((meeting) => (
            <option key={meeting.id} value={meeting.id}>
              {formatDate(meeting.meeting_date)}
            </option>
          ))}
        </select>
      </div>

      {/* Photo Upload Section */}
      {selectedMeetingId && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Foto do encontro
          </label>

          {/* Current photo */}
          {currentPhotoUrl && !photoPreview && (
            <div className="relative">
              <img
                src={currentPhotoUrl}
                alt="Foto atual do encontro"
                className="w-full rounded-lg border border-[var(--ash)]"
              />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Foto atual
              </span>
            </div>
          )}

          {/* Preview of selected photo */}
          {photoPreview && (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview da nova foto"
                className="w-full rounded-lg border border-[var(--electric)]"
              />
              <span className="absolute top-2 left-2 bg-[var(--electric)] text-white text-xs px-2 py-1 rounded">
                Nova foto
              </span>
            </div>
          )}

          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload buttons */}
          {!photoPreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 border border-dashed border-[var(--ash)] text-[var(--text-muted)] rounded-lg hover:border-[var(--electric)] hover:text-[var(--electric)] transition-all cursor-pointer"
            >
              {currentPhotoUrl ? "Substituir foto" : "Adicionar foto"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePhotoUpload}
                disabled={uploading}
                className="flex-1 py-3 px-4 bg-[var(--electric)] text-white font-medium rounded-lg hover:bg-[var(--electric-bright)] disabled:opacity-50 transition-all cursor-pointer"
              >
                {uploading ? "Enviando..." : "Enviar foto"}
              </button>
              <button
                type="button"
                onClick={cancelPhotoSelection}
                disabled={uploading}
                className="py-3 px-4 border border-[var(--ash)] text-[var(--text-muted)] rounded-lg hover:border-[var(--error)] hover:text-[var(--error)] disabled:opacity-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members Checklist */}
      {selectedMeetingId && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            Quem estava presente?
          </label>
          <div className="space-y-2">
            {members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedMembers.has(member.id)
                    ? "bg-[var(--electric)]/10 border-[var(--electric)]/40"
                    : "bg-[var(--slate)] border-[var(--ash)] hover:bg-[var(--smoke)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.has(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="w-5 h-5 rounded border-[var(--ash)] text-[var(--electric)] focus:ring-[var(--electric)] focus:ring-offset-0 bg-[var(--charcoal)]"
                />
                <span className="w-8 h-8 rounded-full bg-[var(--electric)] text-white flex items-center justify-center text-sm font-medium">
                  {member.name.charAt(0)}
                </span>
                <span className="text-[var(--text-primary)]">{member.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      {selectedMeetingId && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 px-4 bg-[var(--electric)] text-white font-medium rounded-lg hover:bg-[var(--electric-bright)] focus:outline-none focus:ring-2 focus:ring-[var(--electric)] focus:ring-offset-2 focus:ring-offset-[var(--void)] disabled:opacity-50 transition-all"
        >
          {saving ? "Salvando..." : "Salvar presenças"}
        </button>
      )}

      {/* Status Message */}
      {message && (
        <p
          className={`text-center text-sm ${
            message.type === "success"
              ? "text-[var(--success)]"
              : "text-[var(--error)]"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
