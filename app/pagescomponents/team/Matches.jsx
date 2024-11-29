'use client';
import { useState, useEffect } from "react";
import { auth, db } from "@/utils/firebase";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, getDoc, addDoc } from "firebase/firestore";
import ScheduledMatches from "@/components/matchesComp/ScheduledMatches";


const Matches = () => {
  const [userId, setUserId] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);

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
          } else {
            setTeamData(null);
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
        const requestsQuery = query(
          collection(db, "matchRequests"),
          where("receiverTeamId", "==", teamData.id), // Gelen istekler
          where("status", "==", "pending")
        );

        const sentRequestsQuery = query(
          collection(db, "matchRequests"),
          where("senderTeamId", "==", teamData.id), // Gönderilen istekler
          where("status", "==", "pending")
        );

        const [receivedSnapshot, sentSnapshot] = await Promise.all([
          getDocs(requestsQuery),
          getDocs(sentRequestsQuery),
        ]);

        const allRequests = [
          ...receivedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ...sentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ];

        setRequests(allRequests);
      } catch (error) {
        console.error("Maç istekleri alınırken hata oluştu:", error);
      }
    };

    const fetchScheduledMatches = async () => {
      try {
        const receivedMatchesQuery = query(
          collection(db, "matches"),
          where("receiverTeamId", "==", teamData.id) // Alıcı olan maçlar
        );

        const sentMatchesQuery = query(
          collection(db, "matches"),
          where("senderTeamId", "==", teamData.id) // Gönderen olan maçlar
        );

        const [receivedSnapshot, sentSnapshot] = await Promise.all([
          getDocs(receivedMatchesQuery),
          getDocs(sentMatchesQuery),
        ]);

        const allMatches = [
          ...receivedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ...sentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ];

        setUpcomingMatches(allMatches);
      } catch (error) {
        console.error("Planlanmış maçlar alınırken hata oluştu:", error);
      }
    };

    fetchMatches();
    fetchScheduledMatches();
  }, [teamData]);

  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, "matchRequests", requestId);
      const requestSnap = await getDoc(requestRef);

      if (requestSnap.exists()) {
        const requestData = requestSnap.data();

        const matchesRef = collection(db, "matches");
        await addDoc(matchesRef, {
          senderTeamId: requestData.senderTeamId, // Gönderen takımın ID'si
          receiverTeamId: requestData.receiverTeamId, // Alıcı takımın ID'si
          field: requestData.field,
          date: requestData.date,
          time: requestData.time,
          status: "scheduled",
          createdAt: new Date(),
        });

        await deleteDoc(requestRef); // İstek silinir
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        alert("Maç isteği onaylandı ve maç planlandı.");
      }
    } catch (error) {
      console.error("Maç isteği onaylanırken hata oluştu:", error);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold">Maçlar</h2>

      {teamData?.captainId === userId && (
        <div>
          <h3 className="font-bold mb-2">Gelen İstekler</h3>
          {requests.length > 0 ? (
            requests.map((req) => (
              <div key={req.id} className="border p-2 mb-2">
                <p>
                  {req.field} - {req.date?.toDate().toLocaleDateString()} -{" "}
                  {req.time}
                </p>
                <div className="flex gap-2">
                  <button
                    className="bg-green-500 text-white p-2 rounded"
                    onClick={() => handleApprove(req.id)}
                  >
                    Onayla
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>Henüz maç isteği yok.</p>
          )}
        </div>
      )}

      {/* Planlanmış Maçlar Bileşeni */}
      <ScheduledMatches matches={upcomingMatches} />
    </div>
  );
};

export default Matches;
