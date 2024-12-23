'use client';
import { useState, useEffect } from "react";
import { auth, db } from "@/utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import ScheduledMatches from "@/components/matchesComp/ScheduledMatches";

const Matches = () => {
  const [userId, setUserId] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [pastMatches, setPastMatches] = useState([]);
  const [futureMatches, setFutureMatches] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchTeamData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userTeamId = userDoc.data().teamId;
          if (userTeamId) {
            const teamDoc = await getDoc(doc(db, "teams", userTeamId));
            if (teamDoc.exists()) {
              setTeamData({ id: userTeamId, ...teamDoc.data() });
            }
          }
        }
      } catch (error) {
        console.error("Takım verileri alınırken hata oluştu:", error);
      }
    };

    fetchTeamData();
  }, [userId]);

  useEffect(() => {
    if (!teamData || !teamData.id) return;

    const fetchMatches = async () => {
      try {
        const currentDate = new Date();
        const today = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        );

        // Maçları alıcı ve gönderici olarak sorgula
        const receivedMatchesQuery = query(
          collection(db, "matches"),
          where("receiverTeamId", "==", teamData.id)
        );

        const sentMatchesQuery = query(
          collection(db, "matches"),
          where("senderTeamId", "==", teamData.id)
        );

        const [receivedSnapshot, sentSnapshot] = await Promise.all([
          getDocs(receivedMatchesQuery),
          getDocs(sentMatchesQuery),
        ]);

        const allMatches = [
          ...receivedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ...sentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ];

        // Maçları geçmiş ve gelecek olarak ayır (bugünü geçmiş saymaz)
        const past = allMatches.filter((match) => {
          const matchDate = new Date(match.date.seconds * 1000);
          return matchDate < today; // Bugünü dahil etmez
        }).map((match) => ({
          ...match,
          opponentTeamId:
            match.senderTeamId === teamData.id
              ? match.receiverTeamId
              : match.senderTeamId,
        }));

        const future = allMatches.filter((match) => {
          const matchDate = new Date(match.date.seconds * 1000);
          return matchDate >= today; // Bugünü dahil eder
        }).map((match) => ({
          ...match,
          opponentTeamId:
            match.senderTeamId === teamData.id
              ? match.receiverTeamId
              : match.senderTeamId,
        }));

        setPastMatches(past);
        setFutureMatches(future);
      } catch (error) {
        console.error("Maçlar alınırken hata oluştu:", error);
      }
    };

    fetchMatches();
  }, [teamData]);

  return (
    <div className="flex flex-col p-2">
      <h2 className="text-4xl font-bold">Maçlar</h2>

      <div className="">
        <h3 className="text-2xl font-semibold mb-4">Gelecek Maçlar</h3>
        <ScheduledMatches matches={futureMatches} ownTeamId={teamData?.id} />
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-4">Geçmiş Maçlar</h3>
        <ScheduledMatches matches={pastMatches} ownTeamId={teamData?.id} />
      </div>
    </div>
  );
};

export default Matches;
