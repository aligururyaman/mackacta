'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/utils/firebase";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Kullanıcı giriş yaptı:", userCredential.user);
      router.push("/dashboard"); // Başarılı giriş sonrası yönlendirme
    } catch (error) {
      console.error("Giriş hatası:", error.message);
      alert("Giriş başarısız! Lütfen bilgilerinizi kontrol edin.");
    }
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Kullanıcı kaydedildi:", userCredential.user);
      alert("Kayıt başarılı! Giriş yapabilirsiniz.");
    } catch (error) {
      console.error("Kayıt hatası:", error.message);
      alert("Kayıt başarısız! Lütfen bilgilerinizi kontrol edin.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Tabs defaultValue="SignIn" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2 border">
          <TabsTrigger value="SignIn" className="bg-gray-50">Giriş Yap</TabsTrigger>
          <TabsTrigger value="SignUp" className="bg-gray-50">Hesap Oluştur</TabsTrigger>
        </TabsList>
        <TabsContent value="SignIn">
          <Card>
            <CardHeader>
              <CardTitle>Giriş Yap</CardTitle>
              <CardDescription>Dünyamızı keşfetmek için giriş yap.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  placeholder="@xxx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  type="password"
                  id="password"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSignIn}>Giriş Yap</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="SignUp">
          <Card>
            <CardHeader>
              <CardTitle>Kayıt Ol</CardTitle>
              <CardDescription>Dünyamızı keşfetmek için kayıt ol.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="@xxx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Şifre</Label>
                <Input
                  type="password"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSignUp}>Kayıt Ol</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
