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
    <div className="flex items-center gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Resim</TableHead>
            <TableHead>Takım Adı</TableHead>
            <TableHead>Kaptan Adı</TableHead>
            <TableHead className="text-right">Tel No:</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>

          <TableRow>
            <TableCell className="font-medium">  {teamData.teamImage && (
              <img
                src={teamData.teamImage}
                alt="Takım Resmi"
                className="w-10 h-10 rounded-full object-cover"
              />
            )}</TableCell>
            <TableCell> {teamData.name} </TableCell>
            <TableCell>{teamData.captainId && (
              <p>
                <AsyncDataFetcher captainId={teamData.captainId} />
              </p>
            )}</TableCell>
            <TableCell className="text-right">{teamData.captainId && (
              <p>
                <AsyncDataPhone captainId={teamData.captainId} />
              </p>
            )}</TableCell>
          </TableRow>

        </TableBody>
      </Table>
    </div>
  );
};

export default AsyncTeamDataFetcher;
