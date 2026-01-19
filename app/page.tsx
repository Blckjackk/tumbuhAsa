"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import staffData from "@/data/staff.json";
import divisionsData from "@/data/divisions.json";

interface MessageData {
  nim: string;
  staffNim: string;
  staffName: string;
  message: string;
  response: string;
  timestamp: string;
}

// Component for public message form
function PublicMessageForm({ staffInfo, onMessageSent }: { 
  staffInfo: typeof staffData[0], 
  onMessageSent: () => void 
}) {
  const [senderNim, setSenderNim] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!senderNim.trim() || !message.trim()) {
      alert("Mohon lengkapi semua field");
      return;
    }

    if (senderNim.length < 5) {
      alert("NIM tidak valid");
      return;
    }

    setIsSubmitting(true);

    const newMessage: MessageData = {
      nim: senderNim.trim(),
      staffNim: staffInfo.nim,
      staffName: staffInfo.nama,
      message: message.trim(),
      response: "",
      timestamp: new Date().toISOString(),
    };

    // Load existing messages for this staff
    const staffKey = `staff_${staffInfo.nim}`;
    const existingMessages = JSON.parse(localStorage.getItem(staffKey) || "[]");
    existingMessages.push(newMessage);
    localStorage.setItem(staffKey, JSON.stringify(existingMessages));

    alert("Pesan berhasil dikirim!");
    setSenderNim("");
    setMessage("");
    setIsSubmitting(false);
    onMessageSent();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="senderNim" className="font-semibold">NIM Anda</Label>
        <Input
          id="senderNim"
          type="text"
          placeholder="Masukkan NIM Anda"
          value={senderNim}
          onChange={(e) => setSenderNim(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="publicMessage" className="font-semibold">Pesan & Kesan</Label>
        <Textarea
          id="publicMessage"
          placeholder="Tuliskan pesan dan kesan Anda..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">{message.length} karakter</p>
      </div>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full h-11 bg-accent hover:bg-accent/90"
      >
        {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
      </Button>
    </form>
  );
}

export default function Home() {
  const [nim, setNim] = useState("");
  const [nimSubmitted, setNimSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [staffInfo, setStaffInfo] = useState<typeof staffData[0] | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleNimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nim || nim.trim().length === 0) {
      setError("NIM tidak boleh kosong");
      return;
    }

    // Cari data pengurus dengan NIM ini
    const staff = staffData.find(s => s.nim === nim.trim());
    
    if (!staff) {
      setError("NIM tidak ditemukan. Pastikan Anda adalah pengurus BEM KEMAKOM.");
      return;
    }

    // Load messages from localStorage
    const staffKey = `staff_${staff.nim}`;
    const savedMessages = JSON.parse(localStorage.getItem(staffKey) || "[]");

    setStaffInfo(staff);
    setMessages(savedMessages);
    setNimSubmitted(true);
    setError("");
  };

  const handleRespond = (message: MessageData) => {
    setSelectedMessage(message);
    setResponseText(message.response || "");
    setIsDialogOpen(true);
  };

  const handleSaveResponse = () => {
    if (!selectedMessage || !staffInfo) return;

    // Update messages in staff data
    const updatedMessages = messages.map(msg => 
      msg.timestamp === selectedMessage.timestamp && msg.nim === selectedMessage.nim
        ? { ...msg, response: responseText }
        : msg
    );

    // Save to localStorage with staff NIM as key
    const staffKey = `staff_${staffInfo.nim}`;
    localStorage.setItem(staffKey, JSON.stringify(updatedMessages));
    
    // Update local state
    setMessages(updatedMessages);
    
    setIsDialogOpen(false);
    setSelectedMessage(null);
    setResponseText("");
    alert("Respon berhasil disimpan!");
  };

  const getDivisionName = (divisionId: string) => {
    const division = divisionsData.find(d => d.id === divisionId);
    return division?.name || divisionId;
  };

  // Jika NIM belum disubmit, tampilkan form input NIM
  if (!nimSubmitted || !staffInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-8">
          <Card className="text-center border-2 border-primary/20">
            <CardHeader className="space-y-6 pb-8">
              <div className="space-y-3">
                <div className="inline-block px-6 py-2 bg-primary/10 rounded-full">
                  <p className="text-sm font-semibold text-primary tracking-wide">KABINET TUMBUH ASA</p>
                </div>
                <CardTitle className="text-5xl font-bold text-primary">
                  BEM KEMAKOM
                </CardTitle>
                <CardTitle className="text-2xl font-medium text-foreground/80">
                  Portal Pengurus
                </CardTitle>
              </div>
              <CardDescription className="text-lg text-foreground/70 max-w-2xl mx-auto">
                Login dengan NIM Anda untuk melihat pesan & kesan yang ditujukan untuk Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <form onSubmit={handleNimSubmit} className="space-y-6">
                <div className="space-y-2 text-left">
                  <Label htmlFor="nim" className="text-foreground font-semibold text-base">
                    NIM Pengurus
                  </Label>
                  <Input
                    id="nim"
                    type="text"
                    placeholder="Masukkan NIM Anda"
                    value={nim}
                    onChange={(e) => {
                      setNim(e.target.value);
                      setError("");
                    }}
                    className={`h-12 text-base ${error ? "border-red-500" : "border-border"}`}
                  />
                  {error && (
                    <p className="text-sm text-red-500 font-medium">{error}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-base">
                  Login
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Portal ini khusus untuk 103 pengurus BEM KEMAKOM dari 8 divisi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Jika NIM sudah disubmit dan data ditemukan, tampilkan pesan untuk pengurus tersebut
  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header - Profile Pengurus */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={staffInfo.photo} alt={staffInfo.nama} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {staffInfo.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl text-primary">{staffInfo.nama}</CardTitle>
                  <p className="text-muted-foreground mt-1">{staffInfo.jabatan}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">NIM: {staffInfo.nim}</Badge>
                    <Badge>{getDivisionName(staffInfo.divisi)}</Badge>
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
              >
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Messages List */}
        <Card className="border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl">Pesan untuk Anda</CardTitle>
            <CardDescription>
              Berikut adalah pesan & kesan yang ditujukan untuk Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg font-semibold">Belum ada pesan</p>
                <p className="mt-2">Anda belum menerima pesan & kesan dari mahasiswa</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <Card key={idx} className="border-2 hover:border-primary/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <CardTitle className="text-base">Dari NIM: {msg.nim}</CardTitle>
                          {msg.response && (
                            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                              ✓ Sudah Dibalas
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
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
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Pesan & Kesan:</Label>
                      <p className="mt-2 text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border">
                        {msg.message}
                      </p>
                    </div>
                    {msg.response && (
                      <div>
                        <Label className="text-sm font-semibold text-accent">Respon Anda:</Label>
                        <p className="mt-2 text-sm whitespace-pre-wrap bg-accent/10 border-2 border-accent/20 p-4 rounded-lg">
                          {msg.response}
                        </p>
                      </div>
                    )}
                    <Button 
                      onClick={() => handleRespond(msg)} 
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {msg.response ? "Edit Respon" : "Balas Pesan"}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

         {/* Public Form for Students to Send Messages */}
        <Card className="mb-6 border-2 border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-xl text-accent">Kirim Pesan untuk {staffInfo.nama}</CardTitle>
            <CardDescription>
              Tuliskan pesan & kesan Anda untuk pengurus ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublicMessageForm staffInfo={staffInfo} onMessageSent={() => {
              // Reload messages
              const staffKey = `staff_${staffInfo.nim}`;
              const savedMessages = JSON.parse(localStorage.getItem(staffKey) || "[]");
              setMessages(savedMessages);
            }} />
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
