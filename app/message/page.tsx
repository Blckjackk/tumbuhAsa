"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function MessagePage() {
  const [nim, setNim] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<typeof staffData[0] | null>(null);
  const [message, setMessage] = useState("");
  const [existingMessage, setExistingMessage] = useState<MessageData | null>(null);
  const [filterDivision, setFilterDivision] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const storedNim = sessionStorage.getItem("userNIM");
    if (!storedNim) {
      router.push("/nim");
    } else {
      setNim(storedNim);
    }
  }, [router]);

  const handleStaffClick = (staff: typeof staffData[0]) => {
    setSelectedStaff(staff);
    
    // Check if there's already a message for this staff
    const messages = JSON.parse(localStorage.getItem("messages") || "[]");
    const existing = messages.find(
      (m: MessageData) => m.nim === nim && m.staffNim === staff.nim
    );
    
    if (existing) {
      setExistingMessage(existing);
      setMessage(existing.message);
    } else {
      setExistingMessage(null);
      setMessage("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStaff || !message.trim()) {
      alert("Mohon lengkapi semua field");
      return;
    }

    const messages = JSON.parse(localStorage.getItem("messages") || "[]");
    const newMessage: MessageData = {
      nim,
      staffNim: selectedStaff.nim,
      staffName: selectedStaff.nama,
      message: message.trim(),
      response: existingMessage?.response || "",
      timestamp: existingMessage?.timestamp || new Date().toISOString(),
    };

    // Update or add message
    const existingIndex = messages.findIndex(
      (m: MessageData) => m.nim === nim && m.staffNim === selectedStaff.nim
    );
    
    if (existingIndex >= 0) {
      messages[existingIndex] = newMessage;
    } else {
      messages.push(newMessage);
    }
    
    localStorage.setItem("messages", JSON.stringify(messages));
    alert("Pesan berhasil disimpan!");
    setExistingMessage(newMessage);
  };

  const getDivisionName = (divisionId: string) => {
    const division = divisionsData.find(d => d.id === divisionId);
    return division?.name || divisionId;
  };

  const filteredStaff = filterDivision === "all" 
    ? staffData 
    : staffData.filter(s => s.divisi === filterDivision);

  if (!nim) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl text-primary">Pesan & Kesan</CardTitle>
                <CardDescription className="text-base mt-2">
                  Pilih pengurus untuk memberikan pesan dan kesan
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">NIM: {nim}</Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Side - Staff List */}
          <div>
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <CardTitle className="text-xl">Daftar Pengurus</CardTitle>
                <Tabs value={filterDivision} onValueChange={setFilterDivision} className="mt-4">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
                    <TabsTrigger value="all">Semua</TabsTrigger>
                    <TabsTrigger value="nondivisi">Non</TabsTrigger>
                    <TabsTrigger value="psdm">PSDM</TabsTrigger>
                    <TabsTrigger value="adkesma">ADKS</TabsTrigger>
                    <TabsTrigger value="medinfo">MED</TabsTrigger>
                    <TabsTrigger value="kominfo">KOM</TabsTrigger>
                    <TabsTrigger value="kewirus">KEW</TabsTrigger>
                    <TabsTrigger value="litbang">LIT</TabsTrigger>
                    <TabsTrigger value="senbud">SEN</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
                {filteredStaff.map((staff) => (
                  <Card 
                    key={staff.nim}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedStaff?.nim === staff.nim 
                        ? 'border-2 border-primary bg-primary/5' 
                        : 'border hover:border-primary/50'
                    }`}
                    onClick={() => handleStaffClick(staff)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={staff.photo} alt={staff.nama} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {staff.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{staff.nama}</p>
                          <p className="text-sm text-muted-foreground">{staff.nim}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {getDivisionName(staff.divisi)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Message Form */}
          <div>
            {selectedStaff ? (
              <Card className="border-2 border-primary/20">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStaff.photo} alt={selectedStaff.nama} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                        {selectedStaff.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl text-primary">{selectedStaff.nama}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedStaff.jabatan}</p>
                      <Badge className="mt-1">{getDivisionName(selectedStaff.divisi)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-base font-semibold">
                        Pesan & Kesan Anda
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Tuliskan pesan dan kesan Anda untuk pengurus ini..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                      <p className="text-sm text-muted-foreground">
                        {message.length} karakter
                      </p>
                    </div>

                    {existingMessage?.response && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold text-accent">
                          Respon dari {selectedStaff.nama}
                        </Label>
                        <div className="p-4 bg-accent/10 border-2 border-accent/20 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap text-foreground">
                            {existingMessage.response}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/")}
                        className="w-full h-12"
                      >
                        Kembali
                      </Button>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-primary hover:bg-primary/90"
                      >
                        {existingMessage ? "Update Pesan" : "Kirim Pesan"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-primary/30 h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-lg font-semibold text-foreground">Pilih Pengurus</p>
                  <p className="text-muted-foreground mt-2">
                    Klik salah satu pengurus di sebelah kiri untuk mulai menulis pesan
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
