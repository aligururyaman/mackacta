'use client';
import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
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
  const [openNotification, setOpenNotification] = useState(null);

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
  const handleAcceptRequest = async (requestId, senderId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // İstek durumunu 'accepted' olarak güncelle
      await updateDoc(doc(db, "teamRequests", requestId), {
        status: "accepted",
      });

      // İstek gönderen kullanıcıyı takım üyelerine ekle
      await updateDoc(doc(db, "users", senderId), {
        teamId: teamData.id,
      });

      alert("İstek kabul edildi.");
      fetchTeamData(); // Verileri tekrar yükle
    } catch (error) {
      console.error("İstek kabul edilirken hata oluştu:", error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      // İsteği sil
      await deleteDoc(doc(db, "teamRequests", requestId));
      alert("İstek reddedildi.");
      fetchTeamData(); // Verileri tekrar yükle
    } catch (error) {
      console.error("İstek reddedilirken hata oluştu:", error);
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
          <Sheet>
            <SheetTrigger asChild>
              <Button>Takım Kur</Button>
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
                />
                <Label>Şehir:</Label>
                <Select
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, city: value, district: "" }));
                  }}
                >
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
                <Label>İlçe:</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, district: value }))
                  }
                  disabled={!formData.city}
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
                <Label>Takım Resmi:</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>
              <SheetFooter>
                <Button onClick={handleCreateTeam}>Kaydet</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <div className="flex items-center justify-center ">

            <div className="p-4 flex flex-col items-center justify-center bg-slate-500 sm:w-96 rounded-xl  shadow-xl relative ">
              {teamRequests.length > 0 && auth.currentUser?.uid === teamData?.captainId && (
                <div
                  key={teamRequests}
                  className="flex h-10 w-10 absolute top-[-10px] right-[-10px] rounded-full bg-red-500 justify-center items-center cursor-pointer"
                  onClick={() => setOpenNotification(true)} // Bildirim panelini aç
                >
                  <p className="font-bold text-2xl text-white">{teamRequests.length}</p>
                </div>
              )}


              {/* Bildirim Paneli */}
              <Sheet open={openNotification} onOpenChange={setOpenNotification}>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Takıma Katılma İstekleri</SheetTitle>
                  </SheetHeader>
                  <ul>
                    {teamRequests.map((request) => (
                      <li
                        key={request.id}
                        className="flex justify-between items-center mt-4 p-2 border-2 rounded-md"
                      >
                        <span>
                          <strong>{request.senderName} {request.senderSurname}</strong> takıma katılmak istiyor.
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
                    ))}
                  </ul>
                </SheetContent>
              </Sheet>

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
              {members.length > 0 && (
                <div className="mt-6 font-semibold">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-400">
                        <TableHead>Profil Resmi</TableHead>
                        <TableHead>Ad</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead className="hidden md:flex">İl</TableHead>
                        <TableHead className="hidden md:flex">İlçe</TableHead>
                        <TableHead>Rol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members
                        .sort((a, b) => (a.id === teamData.captainId ? -1 : b.id === teamData.captainId ? 1 : 0)).map((member) => (
                          <TableRow
                            key={member.id}
                            onClick={() => setSelectedMember(member)}
                            className="cursor-pointer"
                          >
                            <TableCell>
                              <img
                                src={member.profileImage || "/placeholder.png"}
                                alt="Profil Resmi"
                                className="sm:w-14 sm:h-14 w-10 h-10 rounded-full object-cover"
                              />
                            </TableCell>
                            <TableCell>
                              {capitalizeWords(member.name)} {capitalizeWords(member.surname)}
                            </TableCell>
                            <TableCell >{member.phone || "Belirtilmemiş"}</TableCell>
                            <TableCell className="hidden md:flex">{capitalizeWords(member.city)}</TableCell>
                            <TableCell className="hidden md:flex">{capitalizeWords(member.district)}</TableCell>
                            <TableCell>
                              {member.id === teamData.captainId ? (
                                <span className="text-green-700 font-bold">Kaptan</span>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => handleRemovePlayer(member.id, member.name)}
                                >
                                  Oyuncuyu At
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Sheet for Selected Member */}
              {selectedMember && (
                <Sheet open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{capitalizeWords(selectedMember.name)} {capitalizeWords(selectedMember.surname)}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col items-center">
                      <img
                        src={selectedMember.profileImage || "/placeholder.png"}
                        alt="Profil Resmi"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                      <p><strong>Telefon:</strong> {selectedMember.phone || "Bilgi Yok"}</p>
                      <p><strong>İl:</strong> {capitalizeWords(selectedMember.city)}</p>
                      <p><strong>İlçe:</strong> {capitalizeWords(selectedMember.district)}</p>
                      <p><strong>Mevki:</strong> {selectedMember.position || "Bilgi Yok"}</p>
                    </div>
                    {auth.currentUser.uid === selectedMember.id ? (
                      <p className="mt-4 text-blue-500"></p>
                    ) : (
                      <div className="mt-4 flex items-center justify-center">
                        <Button
                          disabled={selectedMember.isFriend} // Eğer arkadaşsa buton devre dışı
                          onClick={() => handleSendFriendRequest(selectedMember.id)}
                        >
                          {selectedMember.isFriend ? "Arkadaşsınız" : "Arkadaş Ekle"}
                        </Button>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}