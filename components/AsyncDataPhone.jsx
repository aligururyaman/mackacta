'use client';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { useEffect, useState } from "react";

const AsyncDataPhone = ({ captainId }) => {
  const [captainInfo, setCaptainInfo] = useState({
    name: "Yükleniyor...",
    phone: "",
  });

  useEffect(() => {
    const fetchCaptain = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", captainId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCaptainInfo({
            name: `${userData.name} ${userData.surname}`,
            phone: userData.phone || "Bilinmiyor",
          });
        } else {
          setCaptainInfo((prev) => ({
            ...prev,
            name: "Kaptan bulunamadı",
          }));
        }
      } catch (error) {
        console.error("Kaptan bilgisi alınırken hata oluştu:", error);
        setCaptainInfo((prev) => ({
          ...prev,
          name: "Hata",
        }));
      }
    };

    fetchCaptain();
  }, [captainId]);

  return (
    <span>
      {captainInfo.phone}
    </span>
  );
};

export default AsyncDataPhone;
