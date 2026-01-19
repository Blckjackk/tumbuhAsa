"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NIMPage() {
  const [nim, setNim] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nim || nim.trim().length === 0) {
      setError("NIM tidak boleh kosong");
      return;
    }

    if (nim.length < 5) {
      setError("NIM tidak valid");
      return;
    }

    sessionStorage.setItem("userNIM", nim);
    router.push("/message");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardHeader className="space-y-3 text-center">
          <div className="inline-block mx-auto px-4 py-1 bg-primary/10 rounded-full">
            <p className="text-xs font-semibold text-primary tracking-wide">KABINET TUMBUH ASA</p>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            BEM KEMAKOM
          </CardTitle>
          <CardDescription className="text-base">
            Masukkan NIM Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nim" className="text-foreground font-semibold">NIM</Label>
              <Input
                id="nim"
                type="text"
                placeholder="Contoh: 2300492"
                value={nim}
                onChange={(e) => {
                  setNim(e.target.value);
                  setError("");
                }}
                className={`h-12 ${error ? "border-red-500" : "border-border"}`}
              />
              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12"
                onClick={() => router.push("/")}
              >
                Kembali
              </Button>
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90">
                Lanjutkan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
