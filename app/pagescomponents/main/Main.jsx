"use client";
import logo from "@/app/assets/logo/logo.png";
import { Instagram, Twitter } from "lucide-react";
import Image from "next/image";

export default function Main() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-foreground text-slate-700 rounded-xl">
      {/* Hero Section */}
      <div className="flex flex-col justify-center items-center py-12 px-4">
        <Image
          src={logo}
          width={150}
          height={150}
          alt="logo"
          className="rounded-full shadow-lg"
        />
        <h1 className="font-extrabold text-4xl md:text-6xl mt-6 text-center">
          Maç Kaçta
        </h1>
        <p className="text-lg md:text-xl text-center mt-4 max-w-md">
          Halı saha etkinlikleri düzenleyin, takım arkadaşları bulun ve birlikte unutulmaz maçlar yapın!
        </p>
      </div>

      {/* Features Section */}
      <div className="py-12 px-6 bg-foreground text-gray-800 rounded-t-3xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-8">
          Uygulamamızda Neler Var?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4 bg-gray-100 rounded-lg shadow-md hover:bg-blue-50 transition">
            <div className="p-4 bg-blue-500 text-white rounded-full mb-4">
              🏟️
            </div>
            <h3 className="text-xl font-semibold mb-2">Maç Organizasyonu</h3>
            <p className="text-gray-600">
              Halı saha maçlarınızı düzenleyin ve katılımcılarınızı yönetin.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-gray-100 rounded-lg shadow-md hover:bg-blue-50 transition">
            <div className="p-4 bg-green-500 text-white rounded-full mb-4">
              🧑‍🤝‍🧑
            </div>
            <h3 className="text-xl font-semibold mb-2">Takım Arkadaşı Bul</h3>
            <p className="text-gray-600">
              Yeni takım arkadaşları keşfedin ve takımlarınızı güçlendirin.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-gray-100 rounded-lg shadow-md hover:bg-blue-50 transition">
            <div className="p-4 bg-yellow-500 text-white rounded-full mb-4">
              📅
            </div>
            <h3 className="text-xl font-semibold mb-2">Maç Takvimi</h3>
            <p className="text-gray-600">
              Maç tarihlerini kolayca yönetin ve tüm katılımcılarla paylaşın.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-12 px-6 bg-gradient-to-b from-foreground to-green-900 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">
          Halı Saha Keyfini Hemen Başlatın!
        </h2>
      </div>

      {/* Footer */}
      <footer className="bg-green-900 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-end items-center">

          {/* Footer Right */}
          <div className="flex gap-4 justify-center">
            <a
              href="#"
              className="bg-gray-700 p-2 rounded-full hover:bg-red-500 transition"
            >
              <Instagram />
            </a>
            <a
              href="#"
              className="bg-gray-700 p-2 rounded-full hover:bg-blue-400 transition"
            >
              <Twitter />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
