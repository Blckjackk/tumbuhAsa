"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import staffData from "@/data/staff.json";

interface Message {
  nim: string;
  staffNim: string;
  staffName: string;
  message: string;
  response: string;
  timestamp: string;
}

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStaff, setFilterStaff] = useState("all");

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    setMessages(storedMessages);
  }, []);

  const handleRespond = (message: Message) => {
    setSelectedMessage(message);
    setResponseText(message.response || "");
    setIsDialogOpen(true);
  };

  const handleSaveResponse = () => {
    if (!selectedMessage) return;

    const updatedMessages = messages.map(msg => 
      msg.timestamp === selectedMessage.timestamp && msg.nim === selectedMessage.nim
        ? { ...msg, response: responseText }
        : msg
    );

    localStorage.setItem("messages", JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
    setIsDialogOpen(false);
    setSelectedMessage(null);
    setResponseText("");
  };

  const getStaffData = (staffNim: string) => {
    return staffData.find(s => s.nim === staffNim);
  };

  const filteredMessages = filterStaff === "all"
    ? messages
    : messages.filter(m => m.staffNim === filterStaff);

  const groupedByStaff = staffData.reduce((acc, staff) => {
    acc[staff.nim] = messages.filter(m => m.staffNim === staff.nim).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl text-primary">Admin Dashboard</CardTitle>
            <CardDescription className="text-base">
              Kelola dan balas pesan dari mahasiswa untuk pengurus BEM KEMAKOM
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 mb-6 md:grid-cols-4">
          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{messages.length}</div>
              <p className="text-sm text-muted-foreground">Total Pesan</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-accent">
                {messages.filter(m => m.response).length}
              </div>
              <p className="text-sm text-muted-foreground">Sudah Dibalas</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">
                {messages.filter(m => !m.response).length}
              </div>
              <p className="text-sm text-muted-foreground">Belum Dibalas</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-primary/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{staffData.length}</div>
              <p className="text-sm text-muted-foreground">Total Pengurus</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl">Filter berdasarkan Pengurus</CardTitle>
            <div className="mt-4">
              <select 
                className="w-full p-2 border rounded-lg bg-background"
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
              >
                <option value="all">Semua Pengurus ({messages.length} pesan)</option>
                {staffData.map(staff => {
                  const count = groupedByStaff[staff.nim] || 0;
                  if (count > 0) {
                    return (
                      <option key={staff.nim} value={staff.nim}>
                        {staff.nama} ({count} pesan)
                      </option>
                    );
                  }
                  return null;
                })}
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Belum ada pesan {filterStaff !== "all" && "untuk pengurus ini"}
              </div>
            ) : (
              filteredMessages.map((msg, idx) => {
                const staffInfo = getStaffData(msg.staffNim);
                return (
                  <Card key={idx} className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          {staffInfo && (
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={staffInfo.photo} alt={staffInfo.nama} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {staffInfo.nama.split(' ').slice(0, 2).map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base">Untuk: {msg.staffName}</CardTitle>
                              {msg.response && (
                                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                                  ✓ Sudah Dibalas
                                </Badge>
                              )}
                            </div>
                            <CardDescription>
                              Dari NIM: {msg.nim} • {new Date(msg.timestamp).toLocaleString('id-ID')}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">Pesan:</Label>
                        <p className="mt-2 text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                          {msg.message}
                        </p>
                      </div>
                      {msg.response && (
                        <div>
                          <Label className="text-sm font-semibold text-accent">Respon Anda:</Label>
                          <p className="mt-2 text-sm whitespace-pre-wrap bg-accent/10 border-2 border-accent/20 p-3 rounded-lg">
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
                );
              })
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary">Balas Pesan</DialogTitle>
              <DialogDescription>
                Untuk: {selectedMessage?.staffName} • Dari NIM: {selectedMessage?.nim}
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
