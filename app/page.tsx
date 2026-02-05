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

  // Fetch data from API and load messages from JSON
  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Starting data fetch...');
        
        const [staffRes, divisionsRes, messagesRes] = await Promise.all([
          fetch('/api/staff', { cache: 'no-store' }),
          fetch('/api/divisions', { cache: 'no-store' }),
          fetch('/api/messages', { cache: 'no-store' })
        ]);
        
        if (!staffRes.ok || !divisionsRes.ok || !messagesRes.ok) {
          throw new Error('Failed to fetch data from API');
        }
        
        const staff = await staffRes.json();
        const divisions = await divisionsRes.json();
        const messagesData = await messagesRes.json();
        
        console.log('Data fetched successfully:', {
          staffCount: staff.length,
          divisionsCount: divisions.length,
          messagesCount: messagesData.length
        });
        
        setStaffData(staff);
        setDivisionsData(divisions);

        // Load messages dari JSON ke localStorage jika belum ada
        if (Array.isArray(messagesData)) {
          messagesData.forEach((msg: MessageData) => {
            if (msg.message && msg.message.trim() !== "") {
              const staffKey = `staff_${msg.staffNim}`;
              const existingMessages = JSON.parse(localStorage.getItem(staffKey) || "[]");
              
              // Cek apakah pesan ini sudah ada (berdasarkan nim dan message)
              const isDuplicate = existingMessages.some(
                (existing: MessageData) => 
                  existing.nim === msg.nim && 
                  existing.message === msg.message
              );
              
              if (!isDuplicate) {
                existingMessages.push({
                  ...msg,
                  timestamp: msg.timestamp || new Date().toISOString()
                });
                localStorage.setItem(staffKey, JSON.stringify(existingMessages));
              }
            }
          });
          console.log('Messages loaded to localStorage successfully');
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Gagal memuat data. Silakan refresh halaman.');
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

    // Pastikan data sudah di-load
    if (staffData.length === 0) {
      setError("Data masih dimuat, mohon tunggu sebentar...");
      return;
    }

    console.log('Checking NIM:', nim.trim());
    console.log('Staff data count:', staffData.length);

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
    
    console.log('Found staff:', staff);
    
    if (!staff) {
      setError("NIM tidak ditemukan. Pastikan Anda adalah pengurus BEM KEMAKOM.");
      console.log('Available NIMs:', staffData.map(s => s.nim).join(', '));
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-4 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                BEM KEMAKOM
              </h1>
              <p className="text-lg font-semibold text-slate-700">
                Kabinet Tumbuh Asa
              </p>
              <p className="text-sm text-slate-600">Portal Komunikasi Pengurus</p>
            </div>
          </div>

          <Card className="shadow-lg border border-slate-200">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Masuk Portal
              </CardTitle>
              <CardDescription className="text-slate-600">
                Masukkan NIM untuk mengakses portal komunikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <form onSubmit={handleNimSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nim" className="text-sm font-medium text-slate-700">
                    Nomor Induk Mahasiswa
                  </Label>
                  <Input
                    id="nim"
                    type="text"
                    placeholder="Masukkan NIM"
                    value={nim}
                    onChange={(e) => {
                      setNim(e.target.value);
                      setError("");
                    }}
                    className={`h-11 ${
                      error 
                        ? "border-red-500 focus-visible:ring-red-500" 
                        : "focus-visible:ring-primary"
                    }`}
                  />
                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="font-medium">{error}</p>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary/90 font-medium"
                  disabled={isLoading || staffData.length === 0}
                >
                  {staffData.length === 0 ? 'Memuat data...' : 'Masuk ke Portal'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-slate-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
                <span className="font-medium">103 Pengurus</span>
                <span className="text-slate-400">•</span>
                <span className="font-medium">8 Divisi</span>
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
      <div className="min-h-screen p-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Admin */}
          <Card className="shadow-sm border border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-slate-200">
                    <AvatarImage src={staffInfo.photo} alt={staffInfo.nama} />
                    <AvatarFallback className="bg-primary text-white text-xl font-semibold">
                      {staffInfo.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      {staffInfo.nama}
                    </CardTitle>
                    <p className="text-slate-600 text-sm mt-1">{staffInfo.jabatan}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-primary text-white font-medium">
                        Azzam
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
                  className="h-10 px-6 font-medium"
                >
                  Keluar
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Form Kirim Pesan ke Staff */}
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="border-b">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Kirim Pesan ke Pengurus
              </CardTitle>
              <CardDescription className="text-slate-600">
                Pilih pengurus dan kirimkan pesan kepada mereka
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Pilih Penerima
                </Label>
                <select 
                  value={selectedStaffNim}
                  onChange={(e) => setSelectedStaffNim(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                >
                  <option value="">Pilih pengurus</option>
                  {staffData.filter(s => s.nim !== ADMIN_NIM).map(staff => (
                    <option key={staff.nim} value={staff.nim}>
                      {staff.nama} - {staff.jabatan} ({getDivisionName(staff.divisi)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Isi Pesan
                </Label>
                <Textarea
                  placeholder="Tulis pesan untuk pengurus"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  rows={5}
                  className="resize-none border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{adminMessage.length} karakter</span>
                </div>
              </div>
              <Button 
                onClick={handleSendMessageToStaff}
                disabled={!selectedStaffNim || !adminMessage.trim()}
                className="w-full h-10 bg-primary hover:bg-primary/90 font-medium"
              >
                Kirim Pesan
              </Button>
            </CardContent>
          </Card>

          {/* Inbox - Pesan Masuk untuk Admin */}
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    Pesan Masuk
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    {messages.length} pesan dari pengurus
                  </CardDescription>
                </div>
                {messages.length > 0 && (
                  <Badge variant="outline" className="text-xs px-3 py-1 border-orange-500 text-orange-600 font-medium">
                    {messages.filter(m => !m.response).length} belum dibalas
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-lg font-medium mt-4">Belum Ada Pesan</p>
                  <p className="text-sm mt-2">Pesan dari pengurus akan muncul di sini</p>
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
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs flex-shrink-0 font-medium">
                                      Dibalas
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs flex-shrink-0 font-medium">
                                      Baru
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
                        <div className="p-4 border-t bg-white">
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Tulis balasan Anda"
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                                  alert("Balasan berhasil disimpan");
                                }}
                                disabled={!responseText.trim()}
                                className="bg-primary hover:bg-primary/90 px-6 font-medium"
                              >
                                {selectedMessage.response ? 'Perbarui Balasan' : 'Kirim Balasan'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        <div className="text-center">
                          <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="text-base font-medium mt-4">Pilih Pesan</p>
                          <p className="text-sm mt-2">Klik pesan untuk melihat detail dan membalas</p>
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
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header - Profile Pengurus */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-slate-200">
                  <AvatarImage src={staffInfo.photo} alt={staffInfo.nama} />
                  <AvatarFallback className="bg-primary text-white text-xl font-semibold">
                    {staffInfo.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {staffInfo.nama}
                  </CardTitle>
                  <p className="text-slate-600 text-sm mt-1">{staffInfo.jabatan}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      NIM: {staffInfo.nim}
                    </Badge>
                    <Badge className="bg-primary text-white text-xs font-medium">
                      {getDivisionName(staffInfo.divisi)}
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
                className="h-10 px-6 font-medium"
              >
                Keluar
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Messages List - Pesan dari Azzam */}
        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Pesan untuk Anda
            </CardTitle>
            <CardDescription className="text-slate-600 mt-1">
              Pesan dari Azzam
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {messages.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-lg font-medium mt-4">Belum Ada Pesan</p>
                <p className="text-sm mt-2">Anda belum menerima pesan</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <Card key={idx} className="border border-slate-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base font-semibold text-slate-900">
                            Dari: Azzam
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
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
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-primary">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
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

         {/* Link Instagram untuk Azzam */}
        <Card className="shadow-sm border border-slate-200 bg-gradient-to-br from-pink-50 to-purple-50">
          <CardHeader className="border-b bg-white/50">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Barangkali pesan untuk Azzam?
            </CardTitle>
            <CardDescription className="text-slate-600 mt-1">
              Hubungi via Instagram
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <a 
              href="https://www.instagram.com/aizzaam_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <svg 
                className="w-6 h-6" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Klik di sini ya! &gt;&lt;</span>
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-xs text-center text-slate-500 mt-3">
              @aizzaam_ · Instagram
            </p>
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
