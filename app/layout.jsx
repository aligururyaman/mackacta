import localFont from "next/font/local";
import "./globals.css";

// Poppins font tanımları
const poppinsBold = localFont({
  src: "./fonts/Poppins-Bold.ttf",
  variable: "--font-poppins-bold",
  weight: "700",
});
const poppinsBlack = localFont({
  src: "./fonts/Poppins-Black.ttf",
  variable: "--font-poppins-black",
  weight: "900",
});
const poppinsExtraBold = localFont({
  src: "./fonts/Poppins-ExtraBold.ttf",
  variable: "--font-poppins-extra-bold",
  weight: "800",
});
const poppinsLight = localFont({
  src: "./fonts/Poppins-Light.ttf",
  variable: "--font-poppins-light",
  weight: "300",
});
const poppinsSemiBold = localFont({
  src: "./fonts/Poppins-SemiBold.ttf",
  variable: "--font-poppins-semi-bold",
  weight: "600",
});

export const metadata = {
  title: "Maç Kaçta",
  description: "Halısahaların Uygulaması",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppinsBold.variable} ${poppinsBlack.variable} ${poppinsExtraBold.variable} ${poppinsLight.variable} ${poppinsSemiBold.variable} antialiased font-poppinsLight text-slate-700`}
      >
        {children}
      </body>
    </html>
  );
}
