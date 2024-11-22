'use client';
import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  const [teamImage, setTeamImage] = useState(null); // Takım resmi için state

  // Takım ve kullanıcı verilerini çekme
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

  const handleCreateTeam = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      let imageUrl = null;

      // Resim yüklüyse Cloudinary'e yükle
      if (teamImage) {
        const loading = alert("Resim yükleniyor, lütfen bekleyin...");
        try {
          imageUrl = await uploadToCloudinary(teamImage); // Resmi yükle
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
        teamImage: imageUrl || null, // Yüklenen resim URL'sini ekle
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
      setTeamImage(file); // Dosyayı kaydet ama hemen yükleme
      alert("Resim seçildi, kaydet butonuna basarak yükleyebilirsiniz.");
    }
  };


  const handleDeleteTeam = async () => {
    try {
      if (!teamData) return;
      const confirmation = confirm("Bu takımı silmek istediğinize emin misiniz?");
      if (!confirmation) return;

      // Takım üyelerinin `teamId`'sini null yap
      const membersQuery = query(
        collection(db, "users"),
        where("teamId", "==", teamData.id)
      );
      const membersSnapshot = await getDocs(membersQuery);
      for (const member of membersSnapshot.docs) {
        await updateDoc(doc(db, "users", member.id), { teamId: null });
      }

      // Takımı sil
      await deleteDoc(doc(db, "teams", teamData.id));

      setTeamData(null);
      setMembers([]);
      alert("Takım başarıyla silindi.");
    } catch (error) {
      console.error("Takım silinirken hata oluştu:", error);
    }
  };


  useEffect(() => {
    fetchTeamData();
  }, []);


  const handleAcceptRequest = async (requestId, senderId) => {
    try {
      await updateDoc(doc(db, "users", senderId), { teamId: teamData.id });
      await deleteDoc(doc(db, "teamRequests", requestId));
      alert("Kullanıcı takıma eklendi.");
      fetchTeamData();
    } catch (error) {
      console.error("İstek kabul edilirken hata oluştu:", error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, "teamRequests", requestId));
      alert("İstek reddedildi.");
      fetchTeamData();
    } catch (error) {
      console.error("İstek reddedilirken hata oluştu:", error);
    }
  };




  const handleRemovePlayer = async (playerId, playerName) => {
    const confirmation = window.confirm(`${playerName} adlı oyuncuyu takımdan çıkarmak istediğinize emin misiniz?`);
    if (!confirmation) return;

    try {
      await setDoc(doc(db, "users", playerId), { teamId: null }, { merge: true });
      alert(`${playerName} takımdan çıkarıldı.`);
      fetchTeamData(); // Takım verilerini yenileyin
    } catch (error) {
      console.error("Oyuncu takımdan çıkarılırken hata oluştu:", error);
      alert("Oyuncu çıkarılamadı, lütfen tekrar deneyin.");
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }


  return (
    <div>
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
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Şehir girin"
                />
                <Label>İlçe:</Label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="İlçe girin"
                />
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
        <div>
          <h2 className="text-lg font-bold">Takımım</h2>
          <div className="p-4 border rounded-md">
            <img
              src={teamData.teamImage || "/placeholder.png"}
              alt="Takım Resmi"
              className="w-32 h-32 rounded-md object-cover"
            />
            <p><strong>Takım Adı:</strong> {teamData.name}</p>
            <p><strong>Şehir:</strong> {teamData.city}</p>
            <p><strong>İlçe:</strong> {teamData.district}</p>
          </div>
          {teamData.captainId === auth.currentUser?.uid && (
            <Button variant="destructive" onClick={handleDeleteTeam}>
              Takımı Sil
            </Button>
          )}


          {teamRequests.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold">Gelen İstekler</h3>
              <ul>
                {teamRequests.map((request) => (
                  <li key={request.id} className="flex justify-between items-center mt-4 p-2 border rounded-md">
                    <span>
                      <strong>{request.senderName} {request.senderSurname}</strong> takıma katılmak istiyor.
                    </span>
                    <div>
                      <Button className="mr-2" onClick={() => handleAcceptRequest(request.id, request.senderId)}>
                        Kabul Et
                      </Button>
                      <Button variant="destructive" onClick={() => handleRejectRequest(request.id)}>
                        Reddet
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {members.length > 0 && (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profil Resmi</TableHead>
                    <TableHead>Ad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>İl</TableHead>
                    <TableHead>İlçe</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members
                    .sort((a, b) => (a.id === teamData.captainId ? -1 : b.id === teamData.captainId ? 1 : 0))
                    .map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <img
                            src={member.profileImage || "/placeholder.png"}
                            alt="Profil Resmi"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </TableCell>
                        <TableCell>
                          {capitalizeWords(member.name)} {capitalizeWords(member.surname)}
                        </TableCell>
                        <TableCell>{member.phone || "Belirtilmemiş"}</TableCell>
                        <TableCell>{capitalizeWords(member.city)}</TableCell>
                        <TableCell>{capitalizeWords(member.district)}</TableCell>
                        <TableCell>
                          {member.id === teamData.captainId ? (
                            <span className="text-green-500 font-bold">Kaptan</span>
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
        </div>
      )}
    </div>
  );
}
