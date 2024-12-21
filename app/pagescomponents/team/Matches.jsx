'use client';
import { useState, useEffect } from "react";
import { auth, db } from "@/utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import ScheduledMatches from "@/components/matchesComp/ScheduledMatches";

const Matches = () => {
  const [userId, setUserId] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [requests, setRequests] = useState([]);
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
          where("receiverTeamId", "==", teamData.id),
          where("status", "==", "pending")
        );

        const receivedSnapshot = await getDocs(requestsQuery);

        const allRequests = receivedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRequests(allRequests);
      } catch (error) {
        console.error("Maç istekleri alınırken hata oluştu:", error);
      }
    };

    const fetchScheduledMatches = async () => {
      try {
        if (!teamData || !teamData.id) return;

        const currentDate = new Date();

        // Sadece kullanıcının takımına ait maçları al
        const receivedMatchesQuery = query(
          collection(db, "matches"),
          where("receiverTeamId", "==", teamData.id) // Kullanıcının takımı alıcıysa
        );

        const sentMatchesQuery = query(
          collection(db, "matches"),
          where("senderTeamId", "==", teamData.id) // Kullanıcının takımı gönderense
        );

        const [receivedSnapshot, sentSnapshot] = await Promise.all([
          getDocs(receivedMatchesQuery),
          getDocs(sentMatchesQuery),
        ]);

        const allMatches = [
          ...receivedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ...sentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ];

        // Maçları geçmiş ve gelecekteki olarak ayır
        const past = allMatches.filter(
          (match) => new Date(match.date.seconds * 1000) < currentDate
        );
        const future = allMatches.filter(
          (match) => new Date(match.date.seconds * 1000) >= currentDate
        );

        setPastMatches(past);
        setFutureMatches(future);
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
          senderTeamId: requestData.senderTeamId,
          receiverTeamId: requestData.receiverTeamId,
          field: requestData.field,
          date: requestData.date,
          time: requestData.time,
          status: "scheduled",
          createdAt: new Date(),
        });

        await deleteDoc(requestRef);
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        alert("Maç isteği onaylandı ve maç planlandı.");
      }
    } catch (error) {
      console.error("Maç isteği onaylanırken hata oluştu:", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await deleteDoc(doc(db, "matchRequests", requestId));
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      alert("Maç isteği reddedildi.");
    } catch (error) {
      console.error("Maç isteği reddedilirken hata oluştu:", error);
    }
  };

  return (
    <div className="flex flex-col p-2">
      <h2 className="text-4xl font-bold">Maçlar</h2>

      {teamData?.captainId === userId && (
        <div className="flex flex-col justify-center items-center my-2">
          {requests.length > 0 ? (
            requests.map((req) => (
              <div key={req.id} className="p-2 mb-2">
                <p>
                  {req.field} -{" "}
                  {new Date(req.date.seconds * 1000).toLocaleDateString()} -{" "}
                  {req.time}
                </p>
                <div className="flex gap-2">
                  <button
                    className="bg-green-500 text-white p-2 rounded"
                    onClick={() => handleApprove(req.id)}
                  >
                    Onayla
                  </button>
                  <button
                    className="bg-red-500 text-white p-2 rounded"
                    onClick={() => handleReject(req.id)}
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p></p>
          )}
        </div>
      )}

      <div className="">
        <ScheduledMatches matches={futureMatches} />
      </div>

      <div>
        <ScheduledMatches matches={pastMatches} />
      </div>
    </div>
  );
};

export default Matches;
