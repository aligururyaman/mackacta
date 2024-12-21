'use client';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useEffect, useState } from "react";
import AsyncDataFetcher from "./AsyncDataFetcher"; // Kaptan bilgilerini getiren bileşen
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import AsyncDataPhone from "./AsyncDataPhone";

const AsyncTeamDataFetcher = ({ teamId }) => {
  const [teamData, setTeamData] = useState({
    teamImage: null, // Varsayılan olarak null
    name: "Yükleniyor...",
    captainId: "",
  });

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (teamDoc.exists()) {
          const data = teamDoc.data();
          setTeamData({
            teamImage: data.teamImage || "/placeholder.png", // Eğer boşsa placeholder görseli kullanılır
            name: data.name || "Bilinmiyor",
            captainId: data.captainId || "",
          });
        } else {
          setTeamData((prev) => ({
            ...prev,
            name: "Takım bulunamadı",
          }));
        }
      } catch (error) {
        console.error("Takım bilgisi alınırken hata oluştu:", error);
        setTeamData((prev) => ({
          ...prev,
          name: "Hata",
        }));
      }
    };

    fetchTeam();
  }, [teamId]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div>
        {teamData.teamImage && (
          <div key={teamData.id} className="flex flex-col justify-center items-center text-lime-400 font-bold">
            <div>
              <img
                src={teamData.teamImage}
                alt="Takım Resmi"
                className="sm:w-36 sm:h-36 w-28 h-28  rounded-full object-cover"
              />
            </div>
            <div className="text-3xl">
              {teamData.name}
            </div>
            <div className="text-sm">
              <AsyncDataPhone captainId={teamData.captainId} />
            </div>


          </div>
        )}
      </div>
    </div >
  );
};

export default AsyncTeamDataFetcher;
