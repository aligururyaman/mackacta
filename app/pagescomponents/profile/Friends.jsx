'use client';
import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold mb-4">Arkadaşlarım</h2>
      <Table>
        <TableCaption>Arkadaşlarınız</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Profil Resmi</TableHead>
            <TableHead>Ad</TableHead>
            <TableHead>Soyad</TableHead>
            <TableHead>Şehir</TableHead>
            <TableHead>İlçe</TableHead>
            <TableHead>Telefon</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {friends.map((friend) => (
            <TableRow key={friend.id}>
              <TableCell>
                <img
                  src={friend.profileImage || "/placeholder.png"}
                  alt="Profil Resmi"
                  className="w-10 h-10 rounded-full bg-gray-300 object-cover"
                />
              </TableCell>
              <TableCell>{capitalizeWords(friend.name)}</TableCell>
              <TableCell>{capitalizeWords(friend.surname)}</TableCell>
              <TableCell>{capitalizeWords(friend.city)}</TableCell>
              <TableCell>{capitalizeWords(friend.district)}</TableCell>
              <TableCell>{friend.phone || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
