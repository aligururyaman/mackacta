'use client'
import { auth, db } from "@/utils/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";

function MatchNotification({ show, onClose, matchRequests }) {
  const [teamRequests, setTeamRequests] = useState([]);

  // Bildirimleri çekmek için bir useEffect kullanabilirsiniz
  useEffect(() => {
    if (show) {
      // Bildirimleri Firebase'den çekmek için gerekli kod
      fetchTeamRequests();
    }



  }, [show]);

  const fetchTeamRequests = async () => {
    // Firebase'den maç isteklerini getirin
    try {
      const user = auth.currentUser;
      if (!user) return;
      const teamRequestsQuery = query(
        collection(db, "matchRequests"),
        where("receiverId", "==", user.uid),
        where("status", "==", "pending")
      );
      const teamRequestsSnapshot = await getDocs(teamRequestsQuery);
      const requests = teamRequestsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeamRequests(requests);
    } catch (error) {
      console.error("Match requests fetch error:", error);
    }
  };

  return (
    <Sheet open={show} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Maç İstekleri</SheetTitle>
        </SheetHeader>
        <ul>
          {matchRequests.length > 0 ? (
            matchRequests.map((request) => (
              <li
                key={request.id}
                className="flex justify-between items-center mt-4 p-2 border-2 rounded-md"
              >
                <span>
                  <strong>
                    {request.senderName || "Bilinmiyor"} {request.senderSurname || ""}
                  </strong>{" "}
                  sizinle maç yapmak istiyor.
                </span>
                <div>
                  <Button
                    className="mr-2"
                    onClick={() => handleAcceptRequest(request.id, request.senderId)}
                  >
                    Kabul Et
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    Reddet
                  </Button>
                </div>
              </li>
            ))
          ) : (
            <p>Şu anda yeni maç isteği yok.</p>
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

export default MatchNotification;
