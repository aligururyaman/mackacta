'use client';
import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Minus, Plus } from "lucide-react";
import UserInfo from "@/app/pagescomponents/profile/UserInfo";
import logo from "@/app/assets/logo/logo.png"
import Image from "next/image";

const data = {
  navMain: [
    {
      title: "Takım",
      url: "#",
      items: [
        { title: "Takımım", url: "team" },
        { title: "Maçlar", url: "matches" },
        { title: "Ayarlar", url: "settings" },
      ],
    },
    {
      title: "Bul",
      url: "#",
      items: [
        { title: "Rakip Bul", url: "#" },
        { title: "Takım Bul", url: "#" },
        { title: "Oyuncu Bul", url: "#" },
      ],
    },
    {
      title: "Profil",
      url: "#",
      items: [
        { title: "Bilgiler", url: "#" },
        { title: "Arkadaşlar", url: "#" },
        { title: "Profil Ayarları", url: "#" },
      ],
    },
  ],
};

export function AppSidebar({ onSelectMenu, ...props }) {
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false); // Profil bileşeni için durum
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email); // Kullanıcı e-posta bilgisi
      } else {
        router.push("/"); // Oturum yoksa yönlendirme
      }
      setLoading(false); // Yükleme tamamlandı
    });

    return () => unsubscribe(); // Component unmount olduğunda dinleyiciyi kaldır
  }, [auth, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/"); // Çıkış yaptıktan sonra yönlendirme
    } catch (error) {
      console.error("Çıkış hatası:", error.message);
    }
  };

  const goProfile = () => {
    setShowProfile(true);
  };


  return (
    <>
      <Sidebar {...props} className="bg-green-300">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <div>
                  <div className="flex aspect-square  items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Image
                      className="w-12 h-12 rounded-full bg-green-300 object-none"
                      src={logo}
                      alt="profil resmi"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Maç Kaçta</span>
                    <span className="">v1.0.0</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible key={item.title} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.title}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {item.items?.length ? (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                onClick={() =>
                                  onSelectMenu(subItem.title, item.title)
                                }
                              >
                                <a href="#">{subItem.title}</a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex justify-center h-20">
                <div className="flex flex-col h-12 leading-none">
                  <span onClick={goProfile} className="font-semibold cursor-pointer">
                    {userEmail}
                  </span>
                  <Button variant="link" onClick={handleSignOut}>
                    Çıkış Yap
                  </Button>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      {showProfile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          role="dialog"
          aria-labelledby="profile-modal-title"
          aria-modal="true"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <h2 id="profile-modal-title" className="text-lg font-bold">
              Kullanıcı Bilgileri
            </h2>
            <UserInfo />
            <Button variant="secondary" onClick={() => setShowProfile(false)}>
              Kapat
            </Button>
          </div>
        </div>
      )}

    </>
  );
}
