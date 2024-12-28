"use client";
import logo from "@/app/assets/logo/logo.png";
import { Instagram, Twitter } from "lucide-react";
import Image from "next/image";

export default function Main() {
  return (
    <div className="min-h-screen  text-slate-700 rounded-xl">
      {/* Hero Section */}
      <div className="flex flex-col justify-center items-center py-8 px-4">
        <Image
          src={logo}
          width={150}
          height={150}
          alt="logo"
          priority
          className="rounded-full shadow-lg"
        />
        <h1 className="font-extrabold text-4xl md:text-6xl mt-6 text-center">
          Maç Kaçta
        </h1>
        <p className="text-lg md:text-xl text-center mt-4 max-w-md">
          Halı saha etkinlikleri düzenleyin, takım arkadaşları bulun ve birlikte unutulmaz maçlar yapın!
        </p>
      </div>

      <div className="w-full">
        <div className="flex flex-col md:flex-row">
          {/* 1. Görsel */}
          <div className="relative w-full md:w-1/3 h-96">
            <Image
              src="https://images.unsplash.com/photo-1689915563407-4b2986d4e05e?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Takım Arkadaşı Bul"
              fill
              className="object-cover rounded-2xl"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-2xl">
              <h2 className="text-white text-2xl md:text-4xl font-bold">
                Takım Arkadaşı Bul
              </h2>
            </div>
          </div>

          {/* 2. Görsel */}
          <div className="relative w-full md:w-1/3 h-96 mt-4 md:mt-0 md:ml-4">
            <Image
              src="https://images.unsplash.com/photo-1574676581439-89ee9f0a7bf1?q=80&w=1854&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Rakip Bul"
              fill
              className="object-cover rounded-2xl"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-2xl">
              <h2 className="text-white text-2xl md:text-4xl font-bold">
                Rakip Bul
              </h2>
            </div>
          </div>

          {/* 3. Görsel */}
          <div className="relative w-full md:w-1/3 h-96 mt-4 md:mt-0 md:ml-4 ">
            <Image
              src="https://images.unsplash.com/photo-1627990282816-21d33cb33136?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Şehrin En İyisi Ol"
              fill
              className="object-cover rounded-2xl"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-2xl">
              <h2 className="text-white text-2xl md:text-4xl font-bold">
                Şehrin En İyisi Ol
              </h2>
            </div>
          </div>
        </div>
      </div>



      {/* Call to Action */}
      <div className="py-16 px-6 text-center text-slate-800">
        <h2 className="text-4xl font-extrabold mb-4">Halı Saha Keyfine Başla!</h2>
        <p className="text-lg max-w-2xl mx-auto text-slate-600">
          Takım arkadaşlarını bul, rakiplerini seç ve unutulmaz maçlara başla.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-300 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Footer Left */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Maç Kaçta</h3>
            <p className="text-sm text-slate-600">
              Türkiye’nin en iyi halı saha organizasyon platformu.
            </p>
          </div>

          {/* Footer Right */}
          <div className="flex gap-6">
            <a
              href="#"
              className="bg-gray-200 p-3 rounded-full hover:bg-gray-300 transition flex items-center justify-center"
            >
              <Instagram size={20} className="text-slate-800" />
            </a>
            <a
              href="#"
              className="bg-gray-200 p-3 rounded-full hover:bg-gray-300 transition flex items-center justify-center"
            >
              <Twitter size={20} className="text-slate-800" />
            </a>
          </div>
        </div>
        <div className="mt-6 text-center text-sm text-slate-600">
          © 2024 Maç Kaçta. Tüm Hakları Saklıdır.
        </div>
      </footer>

    </div>
  );
}
