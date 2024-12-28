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
import FindTeam from "../pagescomponents/find/FindTeam";
import ProfileSettings from "../pagescomponents/profile/ProfileSettings";
import UserInfo from "../pagescomponents/profile/UserInfo";
import Friends from "../pagescomponents/profile/Friends";
import Main from "../pagescomponents/main/Main";
import { auth, db } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import MatchNotification from "@/components/notifications/MatchNotification";

export default function Dashboard() {
  const [selectedItem, setSelectedItem] = useState(""); // Ana menü
  const [selectedSubItem, setSelectedSubItem] = useState(""); // Alt menü
  const [userName, setUserName] = useState(null);
  const [userSurName, setUserSurName] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [matchRequests, setMatchRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [teamData, setTeamData] = useState(null); // Takım verisi
  const router = useRouter();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name);
            setUserSurName(userData.surname);

            // Kullanıcının takım bilgilerini al
            await fetchTeamData(user.uid);

            // Arkadaşlık isteklerini çek
            await fetchFriendRequests(user.uid);

            // Maç isteklerini ve takım isteklerini sadece kaptansa çek
            if (userData.teamId && teamData?.captainId === user.uid) {
              await fetchMatchRequests(user.uid);
              await fetchTeamRequests(user.uid);
            } else {
              // Eğer kullanıcı kaptan değilse, bu istekleri temizle
              setMatchRequests([]);
              setTeamRequests([]);
            }
          }
        } catch (error) {
          console.error("Kullanıcı bilgileri alınırken hata oluştu:", error);
        }
      } else {
        router.push("/"); // Kullanıcı giriş yapmamışsa yönlendir
      }
    });

    return () => unsubscribe();
  }, [teamData]);

  const fetchTeamData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userTeamId = userDoc.data()?.teamId;

      if (!userTeamId) return;

      const teamDoc = await getDoc(doc(db, "teams", userTeamId));
      if (teamDoc.exists()) {
        setTeamData({ id: teamDoc.id, ...teamDoc.data() });
      }
    } catch (error) {
      console.error("Takım verileri alınırken hata oluştu:", error);
    }
  };

  const fetchFriendRequests = async (userId) => {
    try {
      const requestsRef = collection(db, "friendRequests");
      const q = query(
        requestsRef,
        where("receiverId", "==", userId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);

      const requests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFriendRequests(requests);
    } catch (error) {
      console.error("Arkadaşlık istekleri alınırken hata oluştu:", error);
    }
  };

  const fetchMatchRequests = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userTeamId = userDoc.data()?.teamId;
      if (!userTeamId) return;

      // Kullanıcının takımıyla eşleşen maç isteklerini çek
      const matchRequestsQuery = query(
        collection(db, "matchRequests"),
        where("receiverTeamId", "==", userTeamId),
        where("status", "==", "pending")
      );

      const matchRequestsSnapshot = await getDocs(matchRequestsQuery);

      const matchRequestsData = matchRequestsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMatchRequests(matchRequestsData);
    } catch (error) {
      console.error("Maç istekleri alınırken hata oluştu:", error);
    }
  };


  const fetchTeamRequests = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userTeamId = userDoc.data()?.teamId;
      if (!userTeamId) return;

      const teamRequestsQuery = query(
        collection(db, "teamRequests"),
        where("teamId", "==", userTeamId),
        where("status", "==", "pending")
      );

      const snapshot = await getDocs(teamRequestsQuery);
      const allRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeamRequests(allRequests);
    } catch (error) {
      console.error("Takım istekleri alınırken hata oluştu:", error);
    }
  };

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev); // Bildirim panelini aç/kapat
  };



  useEffect(() => {
    const savedSelectedItem = localStorage.getItem("selectedItem");
    const savedSelectedSubItem = localStorage.getItem("selectedSubItem");

    if (savedSelectedItem) setSelectedItem(savedSelectedItem);
    if (savedSelectedSubItem) setSelectedSubItem(savedSelectedSubItem);
  }, []);

  // Seçimler değiştiğinde bu seçimleri sakla
  useEffect(() => {
    localStorage.setItem("selectedItem", selectedItem);
    localStorage.setItem("selectedSubItem", selectedSubItem);
  }, [selectedItem, selectedSubItem]);

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
    if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
          className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full"
        ></motion.div>
      </div>
    }

    return <div><Main /></div>;
  };

  return (
    <SidebarProvider>
      <AppSidebar onSelectMenu={handleMenuSelect} />
      <SidebarInset>
        <header className="flex h-16 justify-between shrink-0 items-center gap-2 border-b px-4 bg-foreground text-slate-600 font-extrabold">
          <div className="flex flex-row justify-center items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb >
              <BreadcrumbList >
                <BreadcrumbItem className="hidden md:block font-semibold">
                  <BreadcrumbLink href="#">{selectedItem || "Ana Menü"}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block font-semibold" />
                <BreadcrumbItem >
                  <BreadcrumbPage className="text-slate-500 font-bold">{selectedSubItem}</BreadcrumbPage>
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
              <div>
                {/* Bildirim sayısı */}
                {(matchRequests?.length >= 1 || friendRequests?.length >= 1 ||
                  (auth.currentUser?.uid === teamData?.captainId && teamRequests?.length >= 1)) && (
                    <span className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      {matchRequests?.length + friendRequests?.length +
                        (auth.currentUser?.uid === teamData?.captainId ? teamRequests?.length : 0)}
                    </span>
                  )}
              </div>

            </div>

            {/* Kullanıcı Bilgileri */}
            <p className="font-semibold cursor-pointer">
              {userName} {userSurName}
            </p>
          </div>
        </header>
        <div className="p-3">
          <div className="relative z-10">
            {renderContent()}
          </div>
        </div>
        <MatchNotification
          show={showNotifications}
          onClose={() => setShowNotifications(false)}
          matchRequests={matchRequests}
          friendRequests={friendRequests}
          teamRequests={teamRequests} // Takım istekleri eklendi
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
