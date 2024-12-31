'use client';
import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Minus, Plus } from "lucide-react";
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
      title: "Oyna",
      url: "#",
      items: [
        { title: "Kadro Kur", url: "#" },
        { title: "Kadrolar", url: "#" },
      ],
    },
    {
      title: "Bul",
      url: "#",
      items: [
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
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);




  return (
    <>
      <Sidebar {...props} className="bg-foreground text-slate-600 font-extrabold">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <div>
                  <div className="flex aspect-square  items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Image
                      className="w-12 h-12 rounded-full object-none"
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
      </Sidebar>
    </>
  );
}
