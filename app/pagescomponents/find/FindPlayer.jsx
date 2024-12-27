'use client'
import React, { useEffect, useId, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { auth } from "@/utils/firebase";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Search } from "lucide-react";



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
  const [active, setActive] = useState(null);
  const ref = useRef(null);
  const id = useId();


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

  useOutsideClick(ref, () => setActive(null));



  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <div className="flex flex-col w-96">
        <div className="flex flex-col gap-3">
          <h3>Şehir ve İlçe ile Ara</h3>
          <div className="flex flex-row gap-2 items-center">
            <Select onValueChange={(value) => setSearchCity(value)}>
              <SelectTrigger className="w-40 bg-foreground border-none rounded-xl">
                <SelectValue placeholder="Şehir Seç" />
              </SelectTrigger>
              <SelectContent className="bg-foreground border-none rounded-xl">
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
              <SelectTrigger className="w-40 bg-foreground border-none rounded-xl">
                <SelectValue placeholder="İlçe Seç" />
              </SelectTrigger>
              <SelectContent className="bg-foreground border-none rounded-xl">
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
            <Button onClick={handleCityDistrictSearch} variant="outline" size="icon" className="rounded-xl bg-button">
              <Search size={40} strokeWidth={2.75} />
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <h3>Ad ve Soyad ile Ara</h3>
          <div className="flex flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Ad"
              className="w-40 p-2 bg-foreground border-none placeholder-slate-500 rounded-xl"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Soyad"
              className="w-40 p-2 bg-foreground border-none placeholder-slate-500 rounded-xl"
              value={searchSurname}
              onChange={(e) => setSearchSurname(e.target.value)}
            />
            <Button onClick={handleNameSearch} variant="outline" size="icon" className="rounded-xl bg-button">
              <Search size={40} strokeWidth={2.75} />
            </Button>
          </div>
          <div className="mt-5">

          </div>
        </div>
      </div>
      <p className="flex  font-extrabold text-lg">Arama Sonuçları</p>
      <div className="flex">
        <ul className="flex flex-col gap-4 ">
          {users.map((user, index) => (
            <div key={user.id} className="p-4 flex flex-col md:flex-row  hover:bg-neutral-400 dark:hover:bg-neutral-800 rounded-xl">
              <motion.div
                layoutId={`card-${user.name}-${id}`}
                key={`card-${user.name}-${id}`}
                onClick={() => setActive(user)}
                className="flex w-40 md:w-96 cursor-pointer"
              >
                <div className="flex gap-4 flex-row  ">
                  <motion.div layoutId={`image-${user.name}-${id}`}>
                    <img
                      className="w-10 h-10 rounded-full bg-gray-300 object-cover"
                      src={user.profileImage}
                      alt="profil resmi"
                    />
                  </motion.div>
                  <div className="">
                    <motion.h3
                      layoutId={`title-${user.name}-${id}`}
                      className="font-medium text-neutral-900 dark:text-neutral-200 text-left">
                      {user.name}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${user.name}-${id}`}
                      className="text-neutral-800 dark:text-neutral-400 text-left">
                      {user.surname}
                    </motion.p>
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
              className="bg-white dark:bg-neutral-800 p-6 rounded-lg w-80 md:96 flex flex-col items-center gap-1"
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
                className="px-4 w-full py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-green-500 hover:text-white text-black mt-4 md:mt-0"
                onClick={() => handleSendFriendRequest(active.id)}
                disabled={active.id === auth.currentUser?.uid}
              >
                Arkadaş Ekle
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
};

export default FindPlayer;
