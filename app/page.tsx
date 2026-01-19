"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

interface StaffData {
  no: number;
  nama: string;
  nim: string;
  jabatan: string;
  divisi: string;
  photo: string;
}

interface DivisionData {
  id: string;
  name: string;
  fullName: string;
  image: string;
}

interface MessageData {
  nim: string;
  staffNim: string;
  staffName: string;
  message: string;
  response: string;
  timestamp: string;
}

export default function Home() {
  const [nim, setNim] = useState("");
  const [nimSubmitted, setNimSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [staffInfo, setStaffInfo] = useState<StaffData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedStaffNim, setSelectedStaffNim] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [staffData, setStaffData] = useState<StaffData[]>([]);
  const [divisionsData, setDivisionsData] = useState<DivisionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ADMIN_NIM = "2300492";

  // Fetch data from API
  useEffect(() => {
    async function fetchData() {
      try {
        const [staffRes, divisionsRes] = await Promise.all([
          fetch('/api/staff'),
          fetch('/api/divisions')
        ]);
        
        const staff = await staffRes.json();
        const divisions = await divisionsRes.json();
        
        setStaffData(staff);
        setDivisionsData(divisions);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const handleNimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nim || nim.trim().length === 0) {
      setError("NIM tidak boleh kosong");
      return;
    }

    // Check jika admin
    if (nim.trim() === ADMIN_NIM) {
      const adminStaff = staffData.find(s => s.nim === ADMIN_NIM);
      if (adminStaff) {
        setStaffInfo(adminStaff);
        setIsAdmin(true);
        setNimSubmitted(true);
        setError("");
        // Load pesan yang masuk untuk admin
        const adminKey = `staff_${ADMIN_NIM}`;
        const inboxMessages = JSON.parse(localStorage.getItem(adminKey) || "[]");
        setMessages(inboxMessages);
        return;
      }
    }

    // Cari data staff dengan NIM ini
    const staff = staffData.find(s => s.nim === nim.trim());
    
    if (!staff) {
      setError("NIM tidak ditemukan. Pastikan Anda adalah pengurus BEM KEMAKOM.");
      return;
    }

    // Load messages dari Azzam (2300492) untuk staff ini
    const staffKey = `staff_${staff.nim}`;
    const savedMessages = JSON.parse(localStorage.getItem(staffKey) || "[]");

    setStaffInfo(staff);
    setMessages(savedMessages);
    setNimSubmitted(true);
    setIsAdmin(false);
    setError("");
  };

  const handleRespond = (message: MessageData) => {
    setSelectedMessage(message);
    setResponseText(message.response || "");
    setIsDialogOpen(true);
  };

  const handleSaveResponse = () => {
    if (!selectedMessage || !staffInfo) return;

    // Update messages
    const updatedMessages = messages.map(msg => 
      msg.timestamp === selectedMessage.timestamp && msg.nim === selectedMessage.nim
        ? { ...msg, response: responseText }
        : msg
    );

    // Save to localStorage
    const staffKey = `staff_${staffInfo.nim}`;
    localStorage.setItem(staffKey, JSON.stringify(updatedMessages));
    
    setMessages(updatedMessages);
    setIsDialogOpen(false);
    setSelectedMessage(null);
    setResponseText("");
    alert("Respon berhasil disimpan!");
  };

  const handleSendMessageToStaff = () => {
    if (!selectedStaffNim || !adminMessage.trim()) {
      alert("Pilih staff dan tulis pesan");
      return;
    }

    const newMessage: MessageData = {
      nim: ADMIN_NIM,
      staffNim: selectedStaffNim,
      staffName: staffData.find(s => s.nim === selectedStaffNim)?.nama || "",
      message: adminMessage.trim(),
      response: "",
      timestamp: new Date().toISOString(),
    };

    // Save ke staff tersebut
    const staffKey = `staff_${selectedStaffNim}`;
    const existingMessages = JSON.parse(localStorage.getItem(staffKey) || "[]");
    existingMessages.push(newMessage);
    localStorage.setItem(staffKey, JSON.stringify(existingMessages));

    alert(`Pesan berhasil dikirim ke ${newMessage.staffName}!`);
    setSelectedStaffNim("");
    setAdminMessage("");
  };

  const handleSendMessageToAdmin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffInfo || !adminMessage.trim()) {
      return;
    }

    const newMessage: MessageData = {
      nim: staffInfo.nim,
      staffNim: ADMIN_NIM,
      staffName: staffData.find(s => s.nim === ADMIN_NIM)?.nama || "Azzam",
      message: adminMessage.trim(),
      response: "",
      timestamp: new Date().toISOString(),
    };

    // Save ke inbox admin (2300492)
    const adminKey = `staff_${ADMIN_NIM}`;
    const existingMessages = JSON.parse(localStorage.getItem(adminKey) || "[]");
    existingMessages.push(newMessage);
    localStorage.setItem(adminKey, JSON.stringify(existingMessages));

    alert("Pesan berhasil dikirim ke Azzam!");
    setAdminMessage("");
  };

  const getDivisionName = (divisionId: string) => {
    const division = divisionsData.find(d => d.id === divisionId);
    return division?.name || divisionId;
  };

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f1e8] via-white to-[#f5f1e8]">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto text-primary" />
          <p className="text-lg text-primary font-semibold">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Jika NIM belum disubmit, tampilkan form input NIM
  if (!nimSubmitted || !staffInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#f5f1e8] via-[#fdfbf7] to-[#f0ebe0] relative overflow-hidden">
        {/* Animated Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="max-w-lg w-full space-y-6 relative z-10">
          <div className="text-center space-y-5 mb-8 animate-fade-in">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl animate-pulse-slow rounded-full"></div>
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center shadow-2xl border-4 border-white animate-float">
                <span className="text-5xl">🎓</span>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-accent drop-shadow-sm">
                BEM KEMAKOM
              </h1>
              <div className="inline-block">
                <p className="text-xl font-bold text-accent px-6 py-2 rounded-full bg-accent/10 border-2 border-accent/20 shadow-lg">
                  KABINET TUMBUH ASA
                </p>
              </div>
              <p className="text-base text-muted-foreground font-medium">Portal Pesan & Kesan Pengurus</p>
            </div>
          </div>

          <Card className="shadow-2xl border-2 border-primary/20 backdrop-blur-xl bg-white/80 overflow-hidden relative group hover:shadow-primary/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="space-y-4 pb-6 relative">
              <div className="flex items-center justify-center">
                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"></div>
              </div>
              <CardTitle className="text-3xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Login Portal
              </CardTitle>
              <CardDescription className="text-center text-base text-foreground/70">
                Masukkan NIM Anda untuk mengakses portal
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 relative">
              <form onSubmit={handleNimSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="nim" className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs">🔐</span>
                    Nomor Induk Mahasiswa (NIM)
                  </Label>
                  <div className="relative">
                    <Input
                      id="nim"
                      type="text"
                      placeholder="Contoh: 2300492"
                      value={nim}
                      onChange={(e) => {
                        setNim(e.target.value);
                        setError("");
                      }}
                      className={`h-14 text-base font-medium rounded-xl transition-all duration-300 ${
                        error 
                          ? "border-red-500 focus-visible:ring-red-500 focus-visible:ring-4" 
                          : "border-primary/30 focus-visible:ring-primary focus-visible:ring-4 focus-visible:border-primary"
                      }`}
                    />
                    {!error && nim && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-fade-in">
                        ✓
                      </div>
                    )}
                  </div>
                  {error && (
                    <div className="flex items-center gap-3 text-sm text-red-600 bg-red-50 p-4 rounded-xl border-2 border-red-200 shadow-sm animate-shake">
                      <span className="text-lg">⚠️</span>
                      <p className="font-semibold">{error}</p>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary via-primary/95 to-accent hover:from-primary/90 hover:via-primary/85 hover:to-accent/90 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                  <span className="relative flex items-center justify-center gap-2">
                    <span className="text-lg">🚀</span>
                    Masuk Portal
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl shadow-lg overflow-hidden relative group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="pt-6 text-center relative">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-base">👥</span>
                  103 Pengurus
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-base">📊</span>
                  8 Divisi
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                  <span className="text-base">💬</span>
                  Portal Aktif
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Interface untuk ADMIN (NIM 2300492)
  if (isAdmin && staffInfo) {
    return (
      <div className="min-h-screen p-4 py-8 bg-gradient-to-br from-[#f5f1e8] via-[#fdfbf7] to-[#f0ebe0] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Header Admin */}
          <Card className="shadow-2xl border-2 border-primary/30 bg-gradient-to-r from-white/95 via-primary/5 to-accent/10 backdrop-blur-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                    <Avatar className="h-28 w-28 border-4 border-white shadow-2xl ring-4 ring-primary/20 relative">
                      <AvatarImage src={staffInfo.photo} alt={staffInfo.nama} />
                      <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-accent text-white text-3xl font-black">
                        {staffInfo.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 h-12 w-12 bg-gradient-to-br from-accent to-accent/90 rounded-full border-4 border-white flex items-center justify-center shadow-xl animate-bounce-slow">
                      <span className="text-xl">👑</span>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-accent mb-2">
                      {staffInfo.nama}
                    </CardTitle>
                    <p className="text-muted-foreground text-xl font-semibold mb-3">{staffInfo.jabatan}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-gradient-to-r from-primary via-primary/95 to-accent text-white shadow-lg px-4 py-1.5 text-sm font-bold">
                        <span className="mr-1">⭐</span> Admin Portal
                      </Badge>
                      <Badge variant="outline" className="border-primary/30 bg-white/80 text-primary px-4 py-1.5 text-sm font-semibold">
                        <span className="mr-1">🎯</span> Full Access
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNimSubmitted(false);
                    setStaffInfo(null);
                    setMessages([]);
                    setNim("");
                    setIsAdmin(false);
                  }}
                  className="h-12 px-8 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary font-semibold text-base transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <span className="mr-2 text-lg">🚪</span>
                  Logout
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Form Kirim Pesan ke Staff */}
          <Card className="shadow-xl border-2 border-accent/30 overflow-hidden bg-gradient-to-br from-white via-accent/5 to-accent/10">
            <CardHeader className="border-b bg-gradient-to-r from-accent/10 via-accent/5 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
                      <span className="text-3xl">✉️</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-gradient-to-br from-primary to-primary/80 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                      <span className="text-xs">✨</span>
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-3xl text-accent mb-1 font-bold">
                      Kirim Pesan ke Pengurus
                    </CardTitle>
                    <CardDescription className="text-base text-foreground/70">
                      Pilih pengurus dan kirimkan pesan pribadi kepada mereka
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-accent/20 text-accent border-accent/30">
                    📨 Broadcast Message
                  </Badge>
                  <Badge variant="outline" className="border-accent/30">
                    {staffData.filter(s => s.nim !== ADMIN_NIM).length} Pengurus Tersedia
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 relative">
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs">
                    👤
                  </span>
                  Pilih Penerima
                </Label>
                <select 
                  value={selectedStaffNim}
                  onChange={(e) => setSelectedStaffNim(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-accent/20 bg-white hover:border-accent focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all text-base font-medium"
                >
                  <option value="">-- Pilih Pengurus --</option>
                  {staffData.filter(s => s.nim !== ADMIN_NIM).map(staff => (
                    <option key={staff.nim} value={staff.nim}>
                      {staff.nama} - {staff.jabatan} ({getDivisionName(staff.divisi)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs">
                    ✍️
                  </span>
                  Pesan Anda
                </Label>
                <Textarea
                  placeholder="Tulis pesan untuk pengurus..."
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  rows={5}
                  className="resize-none border-2 border-accent/20 focus:border-accent focus:ring-4 focus:ring-accent/20 rounded-xl"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{adminMessage.length} karakter</span>
                  {adminMessage.length > 0 && (
                    <span className="text-accent font-medium">✓ Siap dikirim</span>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleSendMessageToStaff}
                disabled={!selectedStaffNim || !adminMessage.trim()}
                className="w-full h-12 bg-gradient-to-r from-accent via-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg hover:shadow-xl transition-all text-base font-semibold"
              >
                <span className="mr-2 text-lg">📤</span>
                Kirim Pesan Sekarang
              </Button>
            </CardContent>
          </Card>

          {/* Inbox - Pesan Masuk untuk Admin */}
          <Card className="border-2 border-primary/10 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">📬</span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      Inbox - Pesan Masuk
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {messages.length} pesan dari pengurus BEM KEMAKOM
                    </CardDescription>
                  </div>
                </div>
                {messages.length > 0 && (
                  <Badge variant="outline" className="text-sm px-3 py-1 border-orange-500 text-orange-600">
                    {messages.filter(m => !m.response).length} belum dibalas
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="text-7xl mb-4">📭</div>
                  <p className="text-xl font-semibold mb-2">Inbox masih kosong</p>
                  <p className="text-sm">Belum ada pesan masuk dari pengurus lain</p>
                </div>
              ) : (
                <div className="grid grid-cols-12 divide-x min-h-[600px]">
                  {/* Left Panel - Message List */}
                  <div className="col-span-5 overflow-y-auto max-h-[600px]">
                    <div className="divide-y">
                      {messages.map((msg, idx) => {
                        const sender = staffData.find(s => s.nim === msg.nim);
                        const isSelected = selectedMessage?.timestamp === msg.timestamp;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedMessage(msg);
                              setResponseText(msg.response || "");
                            }}
                            className={`w-full text-left p-4 hover:bg-primary/5 transition-colors ${
                              isSelected ? 'bg-primary/10 border-l-4 border-primary' : ''
                            } ${!msg.response ? 'bg-orange-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0">
                                <AvatarImage src={sender?.photo} alt={sender?.nama} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                  {sender?.nama.split(' ').slice(0, 2).map(n => n[0]).join('') || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <p className="font-semibold text-sm text-foreground truncate">
                                    {sender?.nama || `NIM ${msg.nim}`}
                                  </p>
                                  {msg.response ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs flex-shrink-0">
                                      ✓ Replied
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs flex-shrink-0">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {sender?.jabatan || 'Pengurus'} • {getDivisionName(sender?.divisi || '')}
                                </p>
                                <p className="text-sm text-foreground/80 line-clamp-2">
                                  {msg.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(msg.timestamp).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Panel - Message Detail */}
                  <div className="col-span-7 bg-gradient-to-br from-white to-primary/5">
                    {selectedMessage ? (
                      <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b bg-white/80 backdrop-blur">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
                              <AvatarImage 
                                src={staffData.find(s => s.nim === selectedMessage.nim)?.photo} 
                                alt={staffData.find(s => s.nim === selectedMessage.nim)?.nama} 
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-lg">
                                {staffData.find(s => s.nim === selectedMessage.nim)?.nama.split(' ').slice(0, 2).map(n => n[0]).join('') || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-primary">
                                {staffData.find(s => s.nim === selectedMessage.nim)?.nama || `NIM ${selectedMessage.nim}`}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {staffData.find(s => s.nim === selectedMessage.nim)?.jabatan || 'Pengurus'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {getDivisionName(staffData.find(s => s.nim === selectedMessage.nim)?.divisi || '')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(selectedMessage.timestamp).toLocaleString('id-ID', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                          {/* Pesan dari pengirim */}
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage 
                                src={staffData.find(s => s.nim === selectedMessage.nim)?.photo} 
                                alt={staffData.find(s => s.nim === selectedMessage.nim)?.nama} 
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {staffData.find(s => s.nim === selectedMessage.nim)?.nama.split(' ').slice(0, 2).map(n => n[0]).join('') || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm border">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {selectedMessage.message}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 ml-2">
                                {new Date(selectedMessage.timestamp).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Respon dari admin (jika ada) */}
                          {selectedMessage.response && (
                            <div className="flex gap-3 justify-end">
                              <div className="flex-1 max-w-[80%]">
                                <div className="bg-gradient-to-br from-primary to-primary/90 text-white rounded-xl rounded-tr-none p-4 shadow-md">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedMessage.response}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 mr-2 text-right">
                                  Anda
                                </p>
                              </div>
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={staffInfo.photo} alt={staffInfo.nama} />
                                <AvatarFallback className="bg-accent text-white text-xs font-semibold">
                                  {staffInfo.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                        </div>

                        {/* Reply Form */}
                        <div className="p-4 border-t bg-white/80 backdrop-blur">
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Tulis balasan Anda..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="resize-none border-2 focus:border-primary"
                            />
                            <div className="flex justify-end">
                              <Button 
                                onClick={() => {
                                  if (!selectedMessage || !staffInfo) return;
                                  const updatedMessages = messages.map(msg => 
                                    msg.timestamp === selectedMessage.timestamp && msg.nim === selectedMessage.nim
                                      ? { ...msg, response: responseText }
                                      : msg
                                  );
                                  const staffKey = `staff_${staffInfo.nim}`;
                                  localStorage.setItem(staffKey, JSON.stringify(updatedMessages));
                                  setMessages(updatedMessages);
                                  setSelectedMessage({ ...selectedMessage, response: responseText });
                                  alert("Respon berhasil disimpan!");
                                }}
                                disabled={!responseText.trim()}
                                className="bg-primary hover:bg-primary/90 px-6"
                              >
                                <span className="mr-2">📤</span>
                                {selectedMessage.response ? 'Update Respon' : 'Kirim Balasan'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <div className="text-6xl mb-4">💬</div>
                          <p className="text-lg font-semibold">Pilih pesan untuk melihat detail</p>
                          <p className="text-sm mt-2">Klik salah satu pesan di sebelah kiri</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Interface untuk MAHASISWA BIASA
  return (
    <div className="min-h-screen p-4 py-8 bg-gradient-to-br from-[#f5f1e8] via-[#fdfbf7] to-[#f0ebe0] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header - Profile Pengurus */}
        <Card className="shadow-2xl border-2 border-primary/30 bg-gradient-to-r from-white/95 via-primary/10 to-white/95 backdrop-blur-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
          <CardHeader className="relative">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <Avatar className="h-28 w-28 border-4 border-white shadow-2xl ring-4 ring-primary/20 relative">
                    <AvatarImage src={staffInfo.photo} alt={staffInfo.nama} />
                    <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-accent text-white text-3xl font-black">
                      {staffInfo.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 h-12 w-12 bg-gradient-to-br from-primary to-accent rounded-full border-4 border-white flex items-center justify-center shadow-xl animate-bounce-slow">
                    <span className="text-xl">✨</span>
                  </div>
                </div>
                <div>
                  <CardTitle className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-accent mb-2">
                    {staffInfo.nama}
                  </CardTitle>
                  <p className="text-muted-foreground text-xl font-semibold mb-3">{staffInfo.jabatan}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="border-primary/30 bg-white/80 text-primary px-4 py-1.5 text-sm font-semibold">
                      <span className="mr-1">📋</span> NIM: {staffInfo.nim}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-primary via-primary/95 to-accent text-white shadow-lg px-4 py-1.5 text-sm font-bold">
                      <span className="mr-1">🏢</span> {getDivisionName(staffInfo.divisi)}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setNimSubmitted(false);
                  setStaffInfo(null);
                  setMessages([]);
                  setNim("");
                }}
                className="h-12 px-8 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary font-semibold text-base transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <span className="mr-2 text-lg">🚪</span>
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Messages List - Pesan dari Azzam */}
        <Card className="shadow-xl border-2 border-primary/10 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">💌</span>
                </div>
                <div>
                  <CardTitle className="text-3xl text-primary font-bold">Pesan untuk Anda</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Pesan dari Azzam (Admin) untuk Anda
                  </CardDescription>
                </div>
              </div>
              {messages.length > 0 && (
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  📨 {messages.length} Pesan Tersimpan
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {messages.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="text-8xl mb-6">📭</div>
                <p className="text-2xl font-semibold mb-2">Belum ada pesan</p>
                <p className="text-base">Anda belum menerima pesan dari Azzam</p>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((msg, idx) => (
                  <Card key={idx} className="border-2 border-primary/30 hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white via-primary/5 to-transparent overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-accent/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="pb-4 relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-accent flex items-center justify-center shadow-xl relative">
                              <span className="text-3xl">👤</span>
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-xl text-primary flex items-center gap-2 font-bold mb-1">
                              <span>Dari: Azzam</span>
                              <Badge className="bg-accent/20 text-accent border border-accent/30 text-xs px-2 py-0.5">
                                Admin
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-sm mt-1 font-medium flex items-center gap-2">
                              <span className="text-base">📅</span>
                              {new Date(msg.timestamp).toLocaleString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="bg-gradient-to-br from-white via-white to-primary/5 backdrop-blur-sm rounded-2xl p-6 border-l-4 border-primary shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground font-medium">
                          {msg.message}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

         {/* Form Kirim Pesan ke Azzam */}
        <Card className="shadow-xl border-2 border-accent/30 overflow-hidden bg-gradient-to-br from-white via-accent/5 to-accent/10">
          <CardHeader className="border-b bg-gradient-to-r from-accent/10 via-accent/5 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">✍️</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-gradient-to-br from-primary to-primary/80 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                    <span className="text-xs">💬</span>
                  </div>
                </div>
                <div>
                  <CardTitle className="text-3xl text-accent mb-1 font-bold">
                    Ada pesan ga buat Azzam?
                  </CardTitle>
                  <CardDescription className="text-base text-foreground/70">
                    Tulis pesan & kesan kamu untuk Azzam (Admin)
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-accent/20 text-accent border-accent/30">
                💌 Direct Message
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 relative">
            <form onSubmit={handleSendMessageToAdmin} className="space-y-5">
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs">
                    ✉️
                  </span>
                  Pesan Kamu
                </Label>
                <Textarea
                  placeholder="Tulis pesan kamu di sini..."
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  rows={5}
                  className="resize-none border-2 border-accent/20 focus:border-accent focus:ring-4 focus:ring-accent/20 rounded-xl"
                  required
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{adminMessage.length} karakter</span>
                  {adminMessage.length > 0 && (
                    <span className="text-accent font-medium">✓ Siap dikirim</span>
                  )}
                </div>
              </div>
              <Button 
                type="submit"
                disabled={!adminMessage.trim()}
                className="w-full h-12 bg-gradient-to-r from-[#2d5f3f] via-[#2d5f3f] to-[#234a32] hover:from-[#234a32] hover:to-[#1a3424] text-white shadow-lg hover:shadow-xl transition-all text-base font-semibold"
              >
                <span className="mr-2 text-lg">📤</span>
                Kirim Pesan ke Azzam
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Dialog for Response */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">Balas Pesan</DialogTitle>
              <DialogDescription>
                Dari NIM: {selectedMessage?.nim}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Pesan dari mahasiswa:</Label>
                <div className="mt-2 p-4 bg-muted/30 rounded-lg text-sm border">
                  {selectedMessage?.message}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="response" className="text-base font-semibold">
                  Respon Anda:
                </Label>
                <Textarea
                  id="response"
                  placeholder="Tuliskan respon Anda di sini..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full h-12"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveResponse} 
                  className="w-full h-12 bg-primary hover:bg-primary/90"
                >
                  Simpan Respon
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
