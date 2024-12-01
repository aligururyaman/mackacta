'use client';
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import MyTeam from "../pagescomponents/team/MyTeam";
import Matches from "../pagescomponents/team/Matches";
import TeamSettings from "../pagescomponents/team/TeamSettings";
import FindPlayer from "../pagescomponents/find/FindPlayer";
import FindRival from "../pagescomponents/find/FindRival";
import FindTeam from "../pagescomponents/find/FindTeam";
import ProfileSettings from "../pagescomponents/profile/ProfileSettings";
import UserInfo from "../pagescomponents/profile/UserInfo";
import Friends from "../pagescomponents/profile/Friends";
import Main from "../pagescomponents/main/Main";


export default function Dashboard() {
  const [selectedItem, setSelectedItem] = useState(""); // Ana menü
  const [selectedSubItem, setSelectedSubItem] = useState(""); // Alt menü

  const handleMenuSelect = (subItemTitle, mainItemTitle) => {
    setSelectedItem(mainItemTitle);
    setSelectedSubItem(subItemTitle);
  };

  // Dinamik bileşen seçimi
  const renderContent = () => {
    if (selectedSubItem === "Takımım") {
      return <MyTeam />;
    }
    if (selectedSubItem === "Maçlar") {
      return <Matches />;
    }
    if (selectedSubItem === "Ayarlar") {
      return <TeamSettings />;
    }
    if (selectedSubItem === "Rakip Bul") {
      return <FindRival />;
    }
    if (selectedSubItem === "Takım Bul") {
      return <FindTeam />;
    }
    if (selectedSubItem === "Oyuncu Bul") {
      return <FindPlayer />;
    }
    if (selectedSubItem === "Profil Ayarları") {
      return <ProfileSettings />;
    }
    if (selectedSubItem === "Bilgiler") {
      return <UserInfo />;
    }
    if (selectedSubItem === "Arkadaşlar") {
      return <Friends />;
    }

    return <div><Main /></div>;
  };

  return (
    <SidebarProvider>
      <AppSidebar onSelectMenu={handleMenuSelect} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-green-300">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb >
            <BreadcrumbList >
              <BreadcrumbItem className="hidden md:block font-semibold">
                <BreadcrumbLink href="#">{selectedItem || "Ana Menü"}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block font-semibold" />
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedSubItem}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 bg-green-100 relative">
          <div className="absolute inset-0 flex items-center justify-center z-9">
            <div className="absolute w-full h-1 bg-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute w-72 h-72 border-4 border-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute w-6 h-6 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
          <div className="relative z-10">
            {renderContent()}
          </div>
        </div>


      </SidebarInset>
    </SidebarProvider>
  );
}
