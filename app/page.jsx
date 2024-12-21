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
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { motion } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import main from '@/app/assets/main/main.png'
import Image from "next/image";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("")
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Kullanıcı dokümanını kontrol et
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error("Kullanıcı dokümanı bulunamadı.");
        alert("Hesap bilgileri eksik görünüyor, lütfen tekrar deneyin.");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Giriş hatası:", error.message);
    }
  };



  const handleSignUp = async () => {
    try {
      // Kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore'da kullanıcı dokümanı oluştur
      const userDocRef = doc(db, "users", user.uid); // UID altında doküman oluştur
      await setDoc(userDocRef, {
        name, // Kullanıcı adı
        surname, // Kullanıcı soyadı
        email: user.email,
        teamId: null, // Kullanıcı e-posta adresi
        createdAt: new Date(), // Hesap oluşturulma tarihi
      });

      alert("Kayıt başarılı! Giriş yapabilirsiniz.");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Bu e-posta adresi zaten kullanılıyor.");
      } else {
        console.error("Kayıt hatası:", error.message);
      }
    }
  };





  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-600">
      <motion.h1
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: [20, -5, 0],
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="text-2xl px-4 md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto h-40"
      >
        {" "}
        <div>
          <Highlight className="text-black dark:text-white">
            Rakip Bul - Takım Arkadaşı Bul OYNA!
          </Highlight>
        </div>

      </motion.h1>

      <Tabs defaultValue="SignIn" className="w-[400px] bg-none rounded-xl">
        <TabsList className="grid w-full grid-cols-2 bg-gray-300">
          <TabsTrigger value="SignIn" className="bg-gray-600">Giriş Yap</TabsTrigger>
          <TabsTrigger value="SignUp" className="bg-gray-600">Hesap Oluştur</TabsTrigger>
        </TabsList>
        <TabsContent value="SignIn" >
          <Card className="bg-gray-600 border-none rounded-xl shadow-xl">
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
              <Button className="rounded-xl bg-lime-400 hover:bg-green-100" onClick={handleSignIn}>Giriş Yap</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="SignUp">
          <Card className="bg-gray-600 border-none rounded-xl shadow-xl">
            <CardHeader>
              <CardTitle>Kayıt Ol</CardTitle>
              <CardDescription>Dünyamızı keşfetmek için kayıt ol.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label>Ad</Label>
                <Input
                  type="name"
                  placeholder="İsim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Soyad</Label>
                <Input
                  type="surname"
                  placeholder="Soyad"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                />
              </div>

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
              <Button className="rounded-xl bg-lime-400 hover:bg-green-100" onClick={handleSignUp}>Kayıt Ol</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
