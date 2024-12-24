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
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();

      if (userData.teamId) {
        const teamDoc = await getDoc(doc(db, "teams", userData.teamId));
        if (!teamDoc.exists()) return;

        const teamData = teamDoc.data();
        setTeamData({ ...teamData, id: teamDoc.id });

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

        const requestsQuery = query(
          collection(db, "teamRequests"),
          where("teamId", "==", teamDoc.id),
          where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsList = await Promise.all(
          requestsSnapshot.docs.map(async (requestDoc) => {
            const requestData = requestDoc.data();
            const senderDoc = await getDoc(doc(db, "users", requestData.senderId));
            return {
              id: requestDoc.id,
              ...requestData,
              senderName: senderDoc.data().name || "Bilinmiyor",
              senderSurname: senderDoc.data().surname || "Bilinmiyor",
            };
          })
        );
        setTeamRequests(requestsList);
      } else {
        setTeamData(null);
      }
    } catch (error) {
      console.error("Takım verileri alınırken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };


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
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-center ">

            <div className="p-4 flex flex-col items-center justify-center bg-foreground text-slate-800 sm:w-96 rounded-xl  shadow-xl relative ">

              <div className="flex flex-col justify-center items-center">
                <img
                  src={teamData.teamImage}
                  alt="Takım Resmi"
                  className="w-32 h-32 rounded-full object-cover  shadow-xl "
                />
                <div className="flex flex-col items-center">
                  <p className="text-4xl font-black">{teamData.name}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-lg font-light">{teamData.city}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-lg font-light">{teamData.district}</p>
                </div>
              </div>
            </div>
          </div>


          {members.length > 0 && (
            <div>
              <h2 className="text-lg font-bold">Takımım</h2>
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
                                src={member.profileImage || "/placeholder.png"}
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
                          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                          src={selectedMember.profileImage || "/placeholder.png"}
                          alt="Profil Resmi"
                        />
                        <div className="flex flex-col items-center my-2">
                          <p>
                            {capitalizeWords(selectedMember.name)} {capitalizeWords(selectedMember.surname)}
                          </p>
                          <p>Telefon: {selectedMember.phone || "Belirtilmemiş"}</p>
                          <p>Mevki: {selectedMember.position || "Belirtilmemiş"}</p>
                        </div>
                        <div className="flex flex-row gap-4">
                          {auth.currentUser?.uid === teamData?.captainId &&
                            selectedMember.id !== teamData?.captainId && (
                              <motion.button
                                className="rounded-xl p-2 bg-button hover:bg-background hover:text-white border-none"
                                onClick={() => handleRemovePlayer(selectedMember.id, selectedMember.name)}
                              >
                                Oyuncuyu At
                              </motion.button>
                            )}
                          <Button
                            className="rounded-xl bg-button hover:bg-background hover:text-white border-none"
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