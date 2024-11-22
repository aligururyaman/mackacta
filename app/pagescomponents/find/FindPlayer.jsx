'use client'
import { useState, useEffect } from "react";
import { getFirestore, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import cityData from "../../cityData/cityData.json";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { auth } from "@/utils/firebase";

// Helper function to capitalize the first letter of each word
const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const FindPlayer = () => {
  const [searchCity, setSearchCity] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchSurname, setSearchSurname] = useState("");
  const [users, setUsers] = useState([]);
  const [districts, setDistricts] = useState([]);

  const db = getFirestore();

  // Update districts when city changes
  useEffect(() => {
    if (searchCity) {
      const selectedCity = cityData.find(
        (city) => capitalizeWords(city.name) === searchCity
      );
      setDistricts(selectedCity ? selectedCity.counties.map(capitalizeWords) : []);
    } else {
      setDistricts([]);
    }
  }, [searchCity]);

  // Search users by city and district
  const handleCityDistrictSearch = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("city", "==", searchCity),
        where("district", "==", searchDistrict)
      );

      const querySnapshot = await getDocs(q);
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(userList);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Search users by name and surname
  const handleNameSearch = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("name", "==", searchName),
        where("surname", "==", searchSurname)
      );

      const querySnapshot = await getDocs(q);
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(userList);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSendFriendRequest = async (receiverId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Giriş yapmalısınız.");
        return;
      }

      const friendRequestRef = collection(db, "friendRequests");

      // Daha önce istek gönderilmiş mi kontrol et
      const existingRequest = await getDocs(
        query(
          friendRequestRef,
          where("senderId", "==", user.uid),
          where("receiverId", "==", receiverId)
        )
      );

      if (!existingRequest.empty) {
        alert("Bu kullanıcıya zaten bir istek gönderdiniz.");
        return;
      }

      // Yeni arkadaşlık isteği oluştur
      await addDoc(friendRequestRef, {
        senderId: user.uid,
        receiverId: receiverId,
        status: "pending",
        timestamp: new Date(),
      });

      alert("Arkadaşlık isteği gönderildi.");
    } catch (error) {
      console.error("Arkadaşlık isteği gönderilirken hata oluştu:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };


  return (
    <div className="flex flex-row p-5">
      <div className="flex flex-col w-96">
        <div>
          <h3>Şehir ve İlçe ile Ara</h3>

          <Select onValueChange={(value) => setSearchCity(value)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Şehir Seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Şehirler</SelectLabel>
                {cityData.map((city) => (
                  <SelectItem key={city.name} value={capitalizeWords(city.name)}>
                    {capitalizeWords(city.name)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => setSearchDistrict(value)}
            disabled={!searchCity}
          >
            <SelectTrigger className="w-full max-w-xs mt-4">
              <SelectValue placeholder="İlçe Seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>İlçeler</SelectLabel>
                {districts.map((district, index) => (
                  <SelectItem key={index} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="mt-5">
            <Button onClick={handleCityDistrictSearch}>Ara</Button>
          </div>
        </div>

        <div className="mt-6">
          <h3>Ad ve Soyad ile Ara</h3>
          <input
            type="text"
            placeholder="Ad"
            className="block w-full max-w-xs mt-2 p-2 border rounded"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Soyad"
            className="block w-full max-w-xs mt-2 p-2 border rounded"
            value={searchSurname}
            onChange={(e) => setSearchSurname(e.target.value)}
          />
          <div className="mt-5">
            <Button onClick={handleNameSearch}>Ara</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 ml-10">
        <Table>
          <TableCaption>Arama sonuçları</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Profil Resmi</TableHead>
              <TableHead>Ad</TableHead>
              <TableHead>Soyad</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>İlçe</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Pozisyon</TableHead>
              <TableHead>İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <img
                    src={user.profileImage || "/placeholder.png"}
                    alt="Profil Resmi"
                    className="w-10 h-10 rounded-full bg-gray-300 object-cover"
                  />
                </TableCell>
                <TableCell>{capitalizeWords(user.name)}</TableCell>
                <TableCell>{capitalizeWords(user.surname)}</TableCell>
                <TableCell>{capitalizeWords(user.city)}</TableCell>
                <TableCell>{capitalizeWords(user.district)}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell>{capitalizeWords(user.position || "Bilinmiyor")}</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSendFriendRequest(user.id)}
                    disabled={user.id === auth.currentUser?.uid} // Kendine istek gönderemezsin
                  >
                    Ekle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FindPlayer;
