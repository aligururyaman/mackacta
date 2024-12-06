'use client';
import { useEffect, useState } from "react";
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
import { auth, db } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import MatchNotification from "@/components/notifications/MatchNotification";


export default function Dashboard() {
  const [selectedItem, setSelectedItem] = useState(""); // Ana menü
  const [selectedSubItem, setSelectedSubItem] = useState(""); // Alt menü
  const [userName, setUserName] = useState(null);
  const [userSurName, setUserSurName] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [matchRequests, setMatchRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [requests, setRequests] = useState([]);



  const fetchMatchRequests = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("Kullanıcı yok");
        return;
      }

      // Kullanıcının takımını bul
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log("Kullanıcının takımı bulunamadı.");
        return;
      }

      const userTeamId = userDoc.data().teamId;
      if (!userTeamId) {
        console.log("Kullanıcının takıma ait ID'si yok.");
        return;
      }

      // Kullanıcının takımı kaptan mı, yoksa başka bir rolde mi olduğunu kontrol edin
      const teamDoc = await getDoc(doc(db, "teams", userTeamId));
      if (!teamDoc.exists()) {
        console.log("Takım dokümanı bulunamadı.");
        return;
      }

      const teamData = teamDoc.data();

      // Gelen ve gönderilen maç isteklerini bul
      const receivedRequestsQuery = query(
        collection(db, "matchRequests"),
        where("receiverTeamId", "==", userTeamId), // Kullanıcının takımı alıcıysa
        where("status", "==", "pending")
      );

      const sentRequestsQuery = query(
        collection(db, "matchRequests"),
        where("senderTeamId", "==", userTeamId), // Kullanıcının takımı gönderense
        where("status", "==", "pending")
      );

      // Verileri paralel olarak çek
      const [receivedSnapshot, sentSnapshot] = await Promise.all([
        getDocs(receivedRequestsQuery),
        getDocs(sentRequestsQuery),
      ]);

      // Gelen ve gönderilen istekleri birleştir
      const allRequests = [
        ...receivedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ...sentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      ];

      console.log("Fetched match requests:", allRequests);
      setRequests(allRequests); // State'e set et
    } catch (error) {
      console.error("Match requests fetch error:", error);
    }
  };






  useEffect(() => {
    if (showNotifications) {
      fetchMatchRequests(); // Bildirim paneli açıldığında veri çek
    }
  }, [showNotifications]);




  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Firestore'da kullanıcı dokümanını al
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name); // Kullanıcının adını ayarla
            setUserSurName(userData.surname); // Kullanıcının soyadını ayarla
            console.log(userName, userSurName);

          } else {
            console.error("Kullanıcı dokümanı bulunamadı.");
          }
        } catch (error) {
          console.error("Kullanıcı bilgileri alınırken hata oluştu:", error);
        }
      } else {
        router.push("/"); // Oturum yoksa yönlendirme
      }
      setLoading(false); // Yükleme tamamlandı
    });

    return () => unsubscribe(); // Component unmount olduğunda dinleyiciyi kaldır
  }, [auth, router]);

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev); // Bildirim panelini aç/kapat
  };

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

  const goProfile = () => {
    setShowProfile(true);
  };


  return (
    <SidebarProvider>
      <AppSidebar onSelectMenu={handleMenuSelect} />
      <SidebarInset>
        <header className="flex h-16 justify-between shrink-0 items-center gap-2 border-b px-4 bg-green-300">
          <div className="flex flex-row justify-center items-center gap-2">
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
          </div>

          <div className="flex items-center gap-4">
            {/* Bildirim Simgesi */}
            <div
              className="relative cursor-pointer"
              onClick={handleToggleNotifications}
            >
              <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                {/* Bildirim sayısı */}
                {matchRequests.length}
              </div>
            </div>
            {/* Kullanıcı Bilgileri */}
            <p className="font-semibold cursor-pointer">
              {userName} {userSurName}
            </p>
          </div>
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
        <MatchNotification
          show={showNotifications}
          onClose={() => setShowNotifications(false)}
          matchRequests={matchRequests} // Veriyi burada geçiriyoruz
        />

      </SidebarInset>
      {showProfile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          role="dialog"
          aria-labelledby="profile-modal-title"
          aria-modal="true"
        >
          <div className="bg-white p-6 rounded-3xl shadow-lg w-1/2">
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

    </SidebarProvider>

  );
}
