'use client';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

export default function TeamSettings() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Takım verisini getir
  const fetchTeamData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      if (userData.teamId) {
        const teamDoc = await getDoc(doc(db, "teams", userData.teamId));
        if (teamDoc.exists()) {
          setTeamData({ ...teamDoc.data(), id: teamDoc.id });
        }
      }
    } catch (error) {
      console.error("Takım verisi yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleDeleteTeam = async () => {
    try {
      if (!teamData) return;
      if (auth.currentUser.uid !== teamData.captainId) {
        alert("Sadece takım kaptanı takımı silebilir.");
        return;
      }

      const confirmation = confirm("Bu takımı silmek istediğinize emin misiniz?");
      if (!confirmation) return;

      // Takımdaki tüm üyelerin `teamId`'sini null yap
      const membersQuery = query(
        collection(db, "users"),
        where("teamId", "==", teamData.id)
      );
      const membersSnapshot = await getDocs(membersQuery);
      for (const member of membersSnapshot.docs) {
        await updateDoc(doc(db, "users", member.id), { teamId: null });
      }

      // Takımı sil
      await deleteDoc(doc(db, "teams", teamData.id));
      setTeamData(null);
      alert("Takım başarıyla silindi.");
    } catch (error) {
      console.error("Takım silinirken hata oluştu:", error);
      alert("Takım silinemedi. Lütfen tekrar deneyin.");
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-bold">Takım Ayarları</h2>
      {teamData ? (
        <div>
          <Button variant="destructive" onClick={handleDeleteTeam}>
            Takımı Sil
          </Button>
        </div>
      ) : (
        <p>Bir takıma ait değilsiniz.</p>
      )}
    </div>
  );
}
