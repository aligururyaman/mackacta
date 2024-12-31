'use client';
import { auth, db } from "@/utils/firebase";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, setDoc, addDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { toast, Toaster } from "react-hot-toast";

function MatchNotification({ show, onClose }) {
  const [teamRequests, setTeamRequests] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [userTeamId, setUserTeamId] = useState([]);
  const [matchRequests, setMatchRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchRequests = async (collectionName, filters = [], type) => {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      let q = query(collection(db, collectionName));
      filters.forEach((filter) => {
        q = query(q, where(filter.field, filter.op, filter.value));
      });

      const snapshot = await getDocs(q);

      const requests = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const requestData = docSnapshot.data();

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
          } else if (type === "notification") {
            return {
              id: docSnapshot.id,
              ...requestData,
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

        const userId = user.uid;

        // Bildirimler
        const notifications = await fetchRequests(
          "notifications",
          [{ field: "status", op: "==", value: "unread" }],
          "notification"
        );

        console.log("Bildirimler:", notifications);

        // Arkadaşlık istekleri
        const friendRequests = await fetchRequests(
          "friendRequests",
          [
            { field: "receiverId", op: "==", value: userId },
            { field: "status", op: "==", value: "pending" },
          ],
          "friend"
        );

        setFriendRequests(friendRequests);

        // Kullanıcının takımını kontrol et
        const teamSnapshot = await getDocs(
          query(collection(db, "teams"), where("captainId", "==", userId))
        );

        if (teamSnapshot.empty) {
          setTeamRequests([]);
          setMatchRequests([]);
          return;
        }

        const teamData = teamSnapshot.docs[0].data();
        const userTeamId = teamSnapshot.docs[0].id;

        // Maç istekleri
        const matchRequests = await fetchRequests(
          "matchRequests",
          [
            { field: "receiverTeamId", op: "==", value: userTeamId },
            { field: "status", op: "==", value: "pending" },
          ],
          "match"
        );
        setMatchRequests(matchRequests);

        // Takım istekleri
        const teamRequests = await fetchRequests(
          "teamRequests",
          [
            { field: "teamId", op: "==", value: userTeamId },
            { field: "status", op: "==", value: "pending" },
          ],
          "team"
        );
        setTeamRequests(teamRequests);

        setUserTeamId(userTeamId);
      })();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      (async () => {
        const user = auth.currentUser;
        if (!user) return;

        const userId = user.uid;

        // Bildirimleri getir
        const notificationsData = await fetchRequests(
          "notifications",
          [{ field: "status", op: "==", value: "unread" }],
          "notification"
        );
        setNotifications(notificationsData);
      })();
    }
  }, [show]);

  const handleRequestAction = async (requestId, type, action, additionalData = {}) => {
    try {
      // Türkçe tipleri İngilizce koleksiyon isimlerine çeviriyoruz
      const collectionMap = {
        "Arkadaşlık": "friendRequests",
        "Maç Yapma": "matchRequests",
        "Takıma katılma": "teamRequests",
      };

      const collectionName = collectionMap[type]; // Doğru koleksiyon adını al
      if (!collectionName) {
        throw new Error(`Bilinmeyen istek türü: ${type}`);
      }

      const requestRef = doc(db, collectionName, requestId);

      // Kabul veya reddetme işlemi
      if (action === "accept") {
        if (type === "Takıma katılma") {
          const { senderId, teamId } = additionalData;

          // Takım isteği için ek işlem
          await updateDoc(doc(db, "users", senderId), { teamId });
        }
        await updateDoc(requestRef, { status: "accepted" });
      } else if (action === "reject") {
        await deleteDoc(requestRef);
      }

      // Başarı mesajı
      toast.success(
        `${type} isteği ${action === "accept" ? "kabul" : "reddedildi"}.`
      );

      // İlgili listeyi güncelle
      if (type === "Arkadaşlık") {
        setFriendRequests((prev) =>
          prev.filter((request) => request.id !== requestId)
        );
      } else if (type === "Maç Yapma") {
        setMatchRequests((prev) =>
          prev.filter((request) => request.id !== requestId)
        );
      } else if (type === "Takıma katılma") {
        setTeamRequests((prev) =>
          prev.filter((request) => request.id !== requestId)
        );
      }
    } catch (error) {
      toast.error(`${type} isteği ${action} edilirken hata oluştu.`);
      console.error(`${type} isteği ${action} edilirken hata oluştu:`, error);
    }
  };


  return (
    <Sheet open={show} onOpenChange={onClose}>
      {/* Maç İstekleri */}
      <Toaster position="top-right" reverseOrder={false} />
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
                  <Button className="rounded-xl bg-button hover:bg-background hover:text-text-slate-600" onClick={() => handleRequestAction(request.id, "Arkadaşlık", "accept")}>
                    Kabul Et
                  </Button>
                  <Button className="rounded-xl bg-button hover:bg-background hover:text-text-slate-600" onClick={() => handleRequestAction(request.id, "Arkadaşlık", "reject")}>
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
                  <strong>{request.senderTeamName}</strong> <span className="font-bold text-slate-400">{
                    `${request.timestamp.toDate().toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                    })} ${request.timestamp.toDate().toLocaleDateString("tr-TR", { weekday: "long" })}`
                  }</span> günü sizinle maç yapmak istiyor.
                </span>

                <div className="flex flex-row gap-4">
                  <Button className="rounded-xl bg-button hover:bg-background hover:text-text-slate-600" onClick={() => handleRequestAction(request.id, "Maç Yapma", "accept")}>
                    Kabul Et
                  </Button>
                  <Button className="rounded-xl bg-button hover:bg-background hover:text-text-slate-600" onClick={() => handleRequestAction(request.id, "Maç Yapma", "reject")}>
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
                <Button
                  className="rounded-xl bg-button hover:bg-background hover:text-text-slate-600"
                  onClick={() =>
                    handleRequestAction(request.id, "Takıma katılma", "accept", {
                      senderId: request.senderId,
                      teamId: userTeamId,
                    })
                  }
                >
                  Kabul Et
                </Button>
                <Button className="rounded-xl bg-button hover:bg-background hover:text-slate-600" onClick={() => handleRequestAction(request.id, "Takıma katılma", "reject")}>
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
