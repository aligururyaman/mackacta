'use client';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useEffect, useState } from "react";
import AsyncDataPhone from "./AsyncDataPhone";

const AsyncTeamDataFetcher = ({ teamId }) => {
  const [teamData, setTeamData] = useState({
    teamImage: null,
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
            teamImage: data.teamImage || "/placeholder.png",
            name: data.name || "Bilinmiyor",
            captainId: data.captainId || "",
          });
        } else {
          setTeamData({ name: "Takım bulunamadı" });
        }
      } catch (error) {
        console.error("Takım bilgisi alınırken hata oluştu:", error);
        setTeamData({ name: "Hata" });
      }
    };

    fetchTeam();
  }, [teamId]);

  return (
    <div className="flex flex-col items-center text-center">
      {teamData.teamImage && (
        <>
          <img
            src={teamData.teamImage}
            alt="Takım Resmi"
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-gray-200 object-cover shadow-md"
          />
          <h3 className="text-lg font-semibold text-gray-800 mt-2">{teamData.name}</h3>
          <p className="text-sm text-gray-600">
            <AsyncDataPhone captainId={teamData.captainId} />
          </p>
        </>
      )}
    </div>
  );
};

export default AsyncTeamDataFetcher;
