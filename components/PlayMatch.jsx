'use client'
import { auth, db } from "@/utils/firebase";
import { collection } from "firebase/firestore";
import { useState } from "react";
import { Button } from "./ui/button";

export default function PlayMatch() {




  const handleSendMatchRequest = async (teamId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Giriş yapmalısınız.");
        return;
      }

      const matchRequestRef = collection(db, "matchRequests");

      // Mevcut istek kontrolü
      const existingRequest = await getDocs(
        query(
          matchRequestRef,
          where("senderId", "==", user.uid),
          where("receiverId", "==", teamId)
        )
      );

      if (!existingRequest.empty) {
        alert("Bu takıma zaten bir maç isteği gönderdiniz.");
        return;
      }

      // Yeni maç isteği gönder
      await addDoc(matchRequestRef, {
        senderId: user.uid,
        receiverId: teamId,
        status: "pending",
        timestamp: new Date(),
      });

      alert("Maç isteği gönderildi.");
    } catch (error) {
      console.error("Maç isteği gönderilirken hata oluştu:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div>


    </div>
  );
}
