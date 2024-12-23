'use client';
import { useEffect, useId, useRef, useState } from "react";
import { auth, db } from "@/utils/firebase";
import { collection, deleteDoc, getDocs, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";


// Helper function to capitalize words
const capitalizeWords = (str) => {
  return str
    ?.toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const ref = useRef(null);
  const id = useId();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch friends from user's friends subcollection
        const friendsRef = collection(db, "users", user.uid, "friends");
        const friendsSnapshot = await getDocs(friendsRef);

        const friendsData = await Promise.all(
          friendsSnapshot.docs.map(async (docSnapshot) => {
            const friendId = docSnapshot.data().friendId;
            const friendDocRef = doc(db, "users", friendId);
            const friendDoc = await getDoc(friendDocRef);

            if (friendDoc.exists()) {
              return { id: friendDoc.id, ...friendDoc.data() };
            }
            return null;
          })
        );

        setFriends(friendsData.filter((friend) => friend !== null)); // Filter out null values
      } catch (error) {
        console.error("Arkadaşlar alınırken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  // Arkadaşlıktan Çıkarma Fonksiyonu
  const handleRemoveFriend = async (friendId) => {
    const confirmation = window.confirm("Bu kişiyi arkadaşlıktan çıkarmak istediğinizden emin misiniz?");
    if (!confirmation) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Kullanıcının arkadaş listesinden sil
      const userFriendRef = doc(db, "users", user.uid, "friends", friendId);
      await deleteDoc(userFriendRef);

      // Arkadaşın listesinden de kullanıcıyı sil
      const friendUserRef = doc(db, "users", friendId, "friends", user.uid);
      await deleteDoc(friendUserRef);

      // UI'dan da arkadaş listesini güncelle
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));

      alert("Arkadaş başarıyla silindi.");
    } catch (error) {
      console.error("Arkadaş silinirken hata oluştu:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };



  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <p className="text-2xl font-extrabold">Arkadaşlar</p>
      <div className="flex flex-wrap">
        <ul className="flex w-full flex-wrap gap-4 ">
          {friends.map((user, index) => (
            <div key={user.id} className="p-4 flex flex-col md:flex-row text-md  items-center w-full md:w-auto hover:bg-slate-400 dark:hover:bg-neutral-800 rounded-xl">
              <motion.div
                layoutId={`card-${user.name}-${id}`}
                key={`card-${user.name}-${id}`}
                onClick={() => setActive(user)}
                className="flex md:w-80 w-full cursor-pointer"
              >
                <div className="flex gap-4 flex-row items-center ">
                  <motion.div layoutId={`image-${user.name}-${id}`}>
                    <img
                      className="w-16 h-16 rounded-full bg-gray-300 object-cover"
                      src={user.profileImage}
                      alt="profil resmi"
                    />
                  </motion.div>
                  <div className="">
                    <motion.h3
                      layoutId={`title-${user.name}-${id}`}
                      className="font-medium text-neutral-900 dark:text-neutral-200 text-left">
                      {user.name} {user.surname}
                    </motion.h3>
                  </div>
                </div>

              </motion.div>
            </div>
          ))}

        </ul>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              ref={ref}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-96 flex flex-col items-center gap-1"
            >
              <img
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                src={active.profileImage}
                alt="Profil Resmi"
              />
              <div className="flex flex-col items-center my-2">
                <p>{active.name} {active.surname}</p>
                <p> {active.phone || "Belirtilmemiş"}</p>
                <p> {active.position || "Belirtilmemiş"}</p>
              </div>

              <motion.button
                layoutId={`button-${active.name}-${id}`}
                className="px-4 w-full py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-red-500 hover:text-white text-black mt-4 md:mt-0"
                onClick={() => handleRemoveFriend(active.id)}
                disabled={active.id === auth.currentUser?.uid}
              >
                Arkadaşlıktan Çıkar
              </motion.button>

              <Button className="mt-4 w-full hover:bg-green-500" onClick={() => setActive(null)}>
                Kapat
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
