'use client';
import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import cityData from "../../cityData/cityData.json"; // Şehir ve ilçe verileri için JSON
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import Image from "next/image";

const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function MyTeam() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [formData, setFormData] = useState({ name: "", city: "", district: "" });
  const [districts, setDistricts] = useState([]);
  const [teamImage, setTeamImage] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (formData.city) {
      const selectedCity = cityData.find(
        (city) => capitalizeWords(city.name) === formData.city
      );
      setDistricts(selectedCity ? selectedCity.counties.map(capitalizeWords) : []);
    } else {
      setDistricts([]);
    }
  }, [formData.city]);

  useEffect(() => {
    if (user) {
      fetchTeamData(user.uid);
    }
  }, [user]);



  const handleCreateTeam = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      let imageUrl = null;

      if (teamImage) {
        alert("Resim yükleniyor, lütfen bekleyin...");
        try {
          imageUrl = await uploadToCloudinary(teamImage);
        } catch (error) {
          console.error("Resim yüklenirken hata oluştu:", error);
          alert("Resim yüklenemedi, lütfen tekrar deneyin.");
          return;
        }
      }

      const newTeamRef = doc(collection(db, "teams"));
      await setDoc(newTeamRef, {
        ...formData,
        captainId: user.uid,
        teamImage: imageUrl || null,
      });

      await updateDoc(doc(db, "users", user.uid), { teamId: newTeamRef.id });
      alert("Takım başarıyla oluşturuldu!");
      fetchTeamData();
    } catch (error) {
      console.error("Takım oluşturulurken hata oluştu:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTeamImage(file);
      alert("Resim seçildi, kaydet butonuna basarak yükleyebilirsiniz.");
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

      await setDoc(doc(friendRequestRef), {
        senderId: user.uid,
        receiverId: receiverId,
        status: "pending",
        timestamp: new Date(),
      });

      alert("Arkadaşlık isteği gönderildi.");
    } catch (error) {
      console.error("Arkadaşlık isteği gönderilirken hata oluştu:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchTeamData(currentUser.uid);
      } else {
        setUser(null);
        setTeamData(null);
        setMembers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const fetchTeamData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        console.error("Kullanıcı verisi bulunamadı.");
        return;
      }

      const userData = userDoc.data();
      if (!userData?.teamId) {
        console.warn("Kullanıcının bir takımı yok.");
        setTeamData(null);
        return;
      }

      const teamDoc = await getDoc(doc(db, "teams", userData.teamId));
      if (!teamDoc.exists()) {
        console.error("Takım verisi bulunamadı.");
        setTeamData(null);
        return;
      }

      const teamData = teamDoc.data();
      setTeamData({ id: teamDoc.id, ...teamData });

      // Takım üyelerini getir
      const membersQuery = query(
        collection(db, "users"),
        where("teamId", "==", teamDoc.id)
      );
      const membersSnapshot = await getDocs(membersQuery);
      const membersList = membersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(membersList);
    } catch (error) {
      console.error("Takım verileri alınırken hata oluştu:", error);
    }
  };




  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
          className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full"
        ></motion.div>
      </div>
    );
  }

  const handleRemovePlayer = async (memberId, memberName) => {
    try {
      const confirmation = window.confirm(
        `${memberName} oyuncusunu takımdan çıkarmak istediğinize emin misiniz?`
      );
      if (!confirmation) return;

      // Kullanıcının `teamId` bilgisini null yap
      await updateDoc(doc(db, "users", memberId), {
        teamId: null,
      });

      alert(`${memberName} oyuncusu takımdan çıkarıldı.`);
      fetchTeamData(); // Verileri güncelle
    } catch (error) {
      console.error("Oyuncu takımdan çıkarılırken hata oluştu:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };


  return (
    <div className="w-">
      {!teamData ? (
        <div>
          <h2 className="text-lg font-bold">Takımınız yok</h2>
          <p>Takım oluşturmak için TAKIM KUR seçeneğini kullanabilirsiniz.</p>
          <Sheet className="bg-foreground">
            <SheetTrigger asChild>
              <Button className="rounded-xl bg-button hover:bg-foreground hover:text-white border-none">Takım Kur</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Takım Kur</SheetTitle>
              </SheetHeader>
              <div>
                <Label>Takım Adı:</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Takım adı girin"
                  className="w-full p-2 border rounded-xl bg-button border-none placeholder-slate-500"
                />
                <Label>Şehir:</Label>
                <Select
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, city: value, district: "" }));
                  }}
                >
                  <SelectTrigger className="w-full bg-button border-none rounded-xl">
                    <SelectValue placeholder="Şehir Seç" />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-button border-none rounded-xl">
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
                <Label>İlçe:</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, district: value }))
                  }
                  disabled={!formData.city}
                >
                  <SelectTrigger className="w-full bg-button border-none rounded-xl">
                    <SelectValue placeholder="İlçe Seç" />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-button border-none rounded-xl">
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
                <Label>Takım Resmi:</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-button border-none rounded-xl text-slate-800" />
              </div>
              <div className="flex justify-center p-4">
                <SheetFooter className="">
                  <Button className="rounded-xl bg-button hover:bg-background hover:text-white border-none" onClick={handleCreateTeam}>Kaydet</Button>
                </SheetFooter>
              </div>

            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex  flex-col gap-10">

          <div className="relative flex justify-center py-8">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src="https://images.unsplash.com/photo-1604513896387-78c36ee80657?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Background"
                layout="fill"
                objectFit="cover"
                className="rounded-xl"
                priority
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between  p-6 rounded-2xl shadow-lg w-full max-w-5xl">
              <img
                src={teamData.teamImage}
                alt="Takım Resmi"
                className="w-40 h-40 rounded-full object-cover"
              />
              <div className="text-center md:text-left mt-4 md:mt-0 md:ml-6 text-slate-200 ">
                <p className="text-3xl font-extrabold">{teamData.name}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <p className="text-lg">{teamData.city}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-lg">{teamData.district}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {members.length > 0 && (
            <div>
              <h2 className="text-lg font-bold items-center justify-center flex">Oyuncular</h2>
              <div className="h-0.5 w-full bg-slate-500 my-5"></div>
              <div className="flex flex-wrap">
                <ul className="flex w-full flex-wrap gap-4">
                  {members
                    .sort((a, b) => (a.id === teamData.captainId ? -1 : b.id === teamData.captainId ? 1 : 0))
                    .map((member, index) => (
                      <div
                        key={member.id}
                        className="p-4 flex flex-col md:flex-row text-md  items-center w-full md:w-auto hover:bg-slate-400 dark:hover:bg-neutral-800 rounded-xl"
                      >
                        <motion.div
                          layoutId={`card-${member.name}-${member.id}`}
                          key={`card-${member.name}-${member.id}`}
                          onClick={() => setSelectedMember(member)}
                          className="flex md:w-80 w-full cursor-pointer"
                        >
                          <div className="flex gap-4 flex-row">
                            <motion.div layoutId={`image-${member.name}-${member.id}`}>
                              <img
                                className="w-16 h-16 rounded-full bg-gray-300 object-cover"
                                src={member.profileImage}
                                alt="Profil Resmi"
                              />
                            </motion.div>
                            <div className="">
                              <motion.h3
                                layoutId={`title-${member.name}-${member.id}`}
                                className="font-medium text-neutral-900 dark:text-neutral-200 text-left"
                              >
                                {capitalizeWords(member.name)} {capitalizeWords(member.surname)}
                              </motion.h3>
                              <p className="text-sm text-gray-600">
                                {member.id === teamData.captainId ? (
                                  <span className="text-green-700 font-bold">Kaptan</span>
                                ) : (
                                  "Oyuncu"
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    ))}
                </ul>
                <AnimatePresence>
                  {selectedMember && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                      onClick={() => setSelectedMember(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        className="bg-white rounded-xl dark:bg-neutral-800 p-6 w-96 flex flex-col items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-slate-200"
                          src={selectedMember.profileImage || "/placeholder.png"}
                          alt="Profil Resmi"
                        />
                        <div className="flex flex-col items-center my-2">
                          <p className="font-bold text-lg">
                            {capitalizeWords(selectedMember.name)} {capitalizeWords(selectedMember.surname)}
                          </p>
                          <p className="font-bold">Telefon: <span className="font-medium">{selectedMember.phone || "Belirtilmemiş"}</span> </p>
                          <p className="font-bold">Mevki: <span className="font-medium">{selectedMember.position || "Belirtilmemiş"}</span></p>
                        </div>
                        <div className="flex flex-row gap-4">
                          {auth.currentUser?.uid === teamData?.captainId &&
                            selectedMember.id !== teamData?.captainId && (
                              <motion.button
                                className="rounded-xl p-2 bg-button hover:bg-background hover:text-slate-700 border-none"
                                onClick={() => handleRemovePlayer(selectedMember.id, selectedMember.name)}
                              >
                                Oyuncuyu At
                              </motion.button>
                            )}
                          <Button
                            className="rounded-xl bg-button hover:bg-background hover:text-slate-700 border-none"
                            onClick={() => setSelectedMember(null)}
                          >
                            Kapat
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}