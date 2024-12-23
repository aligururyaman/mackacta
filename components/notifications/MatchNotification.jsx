'use client';
import { auth, db } from "@/utils/firebase";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, setDoc, addDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";

function MatchNotification({ show, onClose }) {
  const [teamRequests, setTeamRequests] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [userTeamId, setUserTeamId] = useState([]);
  const [matchRequests, setMatchRequests] = useState([]);

  const fetchRequests = async (collectionName, filters = [], type) => {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      // Query oluşturma
      let q = query(collection(db, collectionName));
      filters.forEach((filter) => {
        q = query(q, where(filter.field, filter.op, filter.value));
      });

      const snapshot = await getDocs(q);

      // Verileri işleme
      const requests = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const requestData = docSnapshot.data();

          // Kullanıcı veya takım bilgilerini ekleme
          if (type === "friend") {
            const senderDoc = await getDoc(doc(db, "users", requestData.senderId));
            return {
              id: docSnapshot.id,
              ...requestData,
              senderName: senderDoc.exists() ? senderDoc.data().name : "Bilinmiyor",
              senderSurname: senderDoc.exists() ? senderDoc.data().surname : "Bilinmiyor",
            };
          } else if (type === "match") {
            const senderTeamDoc = await getDoc(doc(db, "teams", requestData.senderTeamId));
            return {
              id: docSnapshot.id,
              ...requestData,
              senderTeamName: senderTeamDoc.exists()
                ? senderTeamDoc.data().name
                : "Bilinmiyor",
            };
          } else if (type === "team") {
            const senderDoc = await getDoc(doc(db, "users", requestData.senderId));
            return {
              id: docSnapshot.id,
              ...requestData,
              senderName: senderDoc.exists() ? senderDoc.data().name : "Bilinmiyor",
              senderSurname: senderDoc.exists() ? senderDoc.data().surname : "Bilinmiyor",
            };
          }
          return { id: docSnapshot.id, ...requestData };
        })
      );

      return requests;
    } catch (error) {
      console.error(`${collectionName} istekleri alınırken hata oluştu:`, error);
      return [];
    }
  };

  useEffect(() => {
    if (show) {
      (async () => {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const userTeamId = userDoc.data().teamId;

        const friendRequests = await fetchRequests(
          "friendRequests",
          [
            { field: "receiverId", op: "==", value: user.uid },
            { field: "status", op: "==", value: "pending" },
          ],
          "friend"
        );
        setFriendRequests(friendRequests);

        const matchRequests = await fetchRequests(
          "matchRequests",
          [
            { field: "receiverTeamId", op: "==", value: userTeamId },
            { field: "status", op: "==", value: "pending" },
          ],
          "match"
        );
        setMatchRequests(matchRequests);

        const teamRequests = await fetchRequests(
          "teamRequests",
          [
            { field: "teamId", op: "==", value: userTeamId },
            { field: "status", op: "==", value: "pending" },
          ],
          "team"
        );
        setTeamRequests(teamRequests);

        const teamId = userDoc.data().teamId;
        setUserTeamId(teamId); // userTeamId burada güncellenir

      })();

    }
  }, [show]);


  const handleRequestAction = async (requestId, type, action, additionalData = {}) => {
    try {
      const collectionName =
        type === "friend" ? "friendRequests" :
          type === "match" ? "matchRequests" :
            "teamRequests";

      const requestRef = doc(db, collectionName, requestId);

      if (action === "accept") {
        if (type === "team") {
          const { senderId, teamId } = additionalData;

          // Takım isteği için ek işlem
          await updateDoc(doc(db, "users", senderId), { teamId });
        }
        await updateDoc(requestRef, { status: "accepted" });
      } else if (action === "reject") {
        await deleteDoc(requestRef);
      }

      alert(`${type} isteği ${action === "accept" ? "kabul" : "reddedildi"}.`);

      // İlgili listeyi güncelle
      if (action === "accept") {
        if (type === "friend") {
          const requestData = await getDoc(requestRef);
          if (requestData.exists()) {
            const senderId = requestData.data().senderId;

            // Kullanıcının arkadaşlar koleksiyonuna ekle
            const userFriendRef = doc(db, "users", auth.currentUser.uid, "friends", senderId);
            await setDoc(userFriendRef, { friendId: senderId });

            // Arkadaşın arkadaşlar koleksiyonuna da kullanıcıyı ekle
            const friendUserRef = doc(db, "users", senderId, "friends", auth.currentUser.uid);
            await setDoc(friendUserRef, { friendId: auth.currentUser.uid });
          }
        }
        await updateDoc(requestRef, { status: "accepted" });
      }

      if (type === "match" && action === "accept") {
        const requestDoc = await getDoc(doc(db, "matchRequests", requestId));

        if (requestDoc.exists()) {
          const matchData = requestDoc.data();
          await addDoc(collection(db, "matches"), {
            ...matchData,
            status: "scheduled", // Yeni koleksiyonda durumu "scheduled" olarak belirleyin
          });

          await deleteDoc(doc(db, "matchRequests", requestId)); // İstek koleksiyonundan sil
          setMatchRequests((prev) => prev.filter((req) => req.id !== requestId));
        }
      }
      if (action === "accept" && type === "team") {
        const { senderId, teamId } = additionalData;

        if (!teamId || !senderId) {
          console.error("Team ID or Sender ID is undefined!");
          return;
        }

        console.log("Takıma eklenen kullanıcı ID'si:", senderId, "Takım ID'si:", teamId);

        // Kullanıcıyı takıma ekleme
        await updateDoc(doc(db, "users", senderId), { teamId });
        await updateDoc(requestRef, { status: "accepted" });
      }


    } catch (error) {
      console.error(`${type} isteği ${action} edilirken hata oluştu:`, error);
    }
  };


  return (
    <Sheet open={show} onOpenChange={onClose}>
      {/* Maç İstekleri */}
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-slate-700">Bildirimler</SheetTitle>
        </SheetHeader>
        <ul>
          {
            friendRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-col justify-between items-center mt-4 p-2 border-2 rounded-xl gap-4"
              >
                <span>
                  <strong>
                    {request.senderName || "Bilinmiyor"} {request.senderSurname || ""}
                  </strong>{" "}
                  sizi arkadaş olarak ekledi.
                </span>
                <div className="flex flex-row gap-4">
                  <Button className="bg-button rounded-xl" onClick={() => handleRequestAction(request.id, "friend", "accept")}>
                    Kabul Et
                  </Button>
                  <Button className="bg-button rounded-xl" onClick={() => handleRequestAction(request.id, "friend", "reject")}>
                    Reddet
                  </Button>
                </div>
              </li>
            ))}
          {
            matchRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-col justify-between items-center mt-4 p-2 border-2 rounded-xl gap-4"
              >
                <span>
                  <strong>{request.senderTeamName || "Bilinmiyor"}</strong> sizinle maç yapmak istiyor.
                </span>
                <div className="flex flex-row gap-4">
                  <Button className="bg-button rounded-xl" onClick={() => handleRequestAction(request.id, "match", "accept")}>
                    Kabul Et
                  </Button>
                  <Button className="bg-button rounded-xl" onClick={() => handleRequestAction(request.id, "match", "reject")}>
                    Reddet
                  </Button>
                </div>
              </li>
            ))}
          {teamRequests.map((request) => (
            <li
              key={request.id}
              className="flex flex-col justify-between items-center mt-4 p-2 border-2 rounded-xl gap-4"
            >
              <span>
                <strong>{request.senderName} {request.senderSurname}</strong> takıma katılmak istiyor.
              </span>
              <div className="flex flex-row gap-4">
                <Button className="bg-button rounded-xl"
                  onClick={() =>
                    handleRequestAction(request.id, "team", "accept", {
                      senderId: request.senderId,
                      teamId: userTeamId,
                    })
                  }
                >
                  Kabul Et
                </Button>
                <Button className="bg-button rounded-xl" onClick={() => handleRequestAction(request.id, "team", "reject")}>
                  Reddet
                </Button>

              </div>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

export default MatchNotification;
