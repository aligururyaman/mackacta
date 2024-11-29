'use client';
import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";

export default function UserInfo() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false); // Düzenleme modu
  const [friendRequests, setFriendRequests] = useState([]);
  const [teamData, setTeamData] = useState(null); // Takım bilgisi için state
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    phone: "",
    city: "",
    district: "",
    position: "",
  });


  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const requestsRef = collection(db, "friendRequests");
        const q = query(
          requestsRef,
          where("receiverId", "==", user.uid),
          where("status", "==", "pending") // Yalnızca bekleyen istekler
        );
        const querySnapshot = await getDocs(q);

        const requests = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const requestData = docSnapshot.data();
            const senderDocRef = doc(db, "users", requestData.senderId);
            const senderDoc = await getDoc(senderDocRef);

            return {
              id: docSnapshot.id,
              ...requestData,
              senderName: senderDoc.exists() ? senderDoc.data().name : "Bilinmiyor",
              senderSurname: senderDoc.exists() ? senderDoc.data().surname : "Bilinmiyor",
            };
          })
        );

        setFriendRequests(requests);
      } catch (error) {
        console.error("Arkadaşlık istekleri alınırken hata oluştu:", error);
      }
    };

    fetchFriendRequests();
  }, []);



  const handleFriendRequestResponse = async (requestId, status) => {
    try {
      const requestRef = doc(db, "friendRequests", requestId);

      if (status === "accepted") {
        // Arkadaşlık ilişkisi kur
        const request = friendRequests.find((req) => req.id === requestId);

        await setDoc(
          doc(db, "users", request.senderId, "friends", request.receiverId),
          { friendId: request.receiverId, timestamp: new Date() }
        );
        await setDoc(
          doc(db, "users", request.receiverId, "friends", request.senderId),
          { friendId: request.senderId, timestamp: new Date() }
        );
      }

      // İsteği sil veya durumu güncelle
      await setDoc(requestRef, { status }, { merge: true });
      setFriendRequests((prev) =>
        prev.filter((request) => request.id !== requestId)
      );
    } catch (error) {
      console.error("İstek yönetimi sırasında hata oluştu:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          // Eğer takım ID'si varsa, takım bilgilerini çek
          if (data.teamId) {
            const teamDoc = await getDoc(doc(db, "teams", data.teamId));
            if (teamDoc.exists()) {
              setTeamData(teamDoc.data());
            }
          }
        }
      } catch (error) {
        console.error("Kullanıcı veya takım verisi alınırken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;



    try {
      const imageUrl = await uploadToCloudinary(file);
      const user = auth.currentUser;
      if (user) {
        // Firestore'de kullanıcının profil resmini güncelle
        await setDoc(
          doc(db, "users", user.uid),
          { profileImage: imageUrl },
          { merge: true }
        );
        setUserData((prev) => ({ ...prev, profileImage: imageUrl }));
      }
    } catch (error) {
      console.error("Resim yüklenirken hata oluştu:", error);
    }
  };



  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, "users", user.uid), formData);
        setUserData(formData);
        setEditMode(false); // Kaydettikten sonra düzenleme modundan çık
      }
    } catch (error) {
      console.error("Bilgiler kaydedilirken hata oluştu:", error);
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="p-10 font-poppinsLight">
      <header className="flex">
        <div className="flex items-center space-x-6">
          <img
            src={userData?.profileImage || "/placeholder.svg"}
            alt="Profil Resmi"
            width="96"
            height="96"
            className="rounded-full bg-gray-300 cursor-pointer"
            onClick={() => document.getElementById("profileImageInput").click()}
            style={{ aspectRatio: "96/96", objectFit: "cover" }}
          />
          <input
            type="file"
            id="profileImageInput"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <div className="space-y-1 items-center justify-center">
            <h1 className="text-2xl font-bold">{userData?.name || "Bilgi Yok"} {userData?.surname || "Bilgi Yok"}</h1>
          </div>
        </div>
      </header>
      <div className="flex flex-col h-52 w-96 rounded-2xl p-4 gap-2">
        <div className="flex ">
          <p><span className="font-semibold">Telefon :</span> {userData?.phone || "Bilgi Yok"}</p>
        </div>
        <div className="flex gap-10">
          <p><span className="font-semibold">İl:</span> {userData?.city || "Bilgi Yok"}</p>
          <p><span className="font-semibold">İlçe: </span> {userData?.district || "Bilgi Yok"}</p>
        </div>
        <div>
          <p> <span className="font-semibold">Mevki:</span> {userData?.position || "Bilgi Yok"}</p>
        </div>
        <div>
          <p> <span className="font-semibold">Takım:</span> {teamData ? teamData.name : "Takım Yok"}</p>
        </div>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Düzenle</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Profili Düzenle</SheetTitle>
            <SheetDescription>
              Diğer kullanıcıların bilmesini istediği bilgileri giriniz.
            </SheetDescription>
          </SheetHeader>
          <form>
            <div>
              <Label>Ad:</Label>
              <Input
                type="text"
                placeholder="Adınız"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Soyad:</Label>
              <Input
                type="text"
                placeholder="Soyadınız"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefon:</Label>
              <Input
                type="text"
                placeholder="Telefon Numaranız"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Şehir:</Label>
              <Input
                type="text"
                placeholder="Şehriniz"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label>İlçe:</Label>
              <Input
                type="text"
                placeholder="İlçeniz"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>
            <div>
              <Label>Mevki:</Label>
              <Input
                type="text"
                placeholder="Mevkiniz"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </form>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit" onClick={handleSave}>Save changes</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <div>
        <ul>
          {friendRequests.map((request) => (
            <div key={request.id} className="py-10">
              <h3 className="font-semibold font-poppinsSemiBold ">Bekleyen Arkadaşlık İstekleri</h3>
              <li className="flex items-center justify-between">
                <span className="font-poppinsLight">
                  {request.senderName} {request.senderSurname} size arkadaşlık isteği gönderdi.
                </span>
                <div className="flex flex-row gap-2">
                  <Button className="bg-green-600 w-10 h-10 rounded-full text-2xl"
                    onClick={() => handleFriendRequestResponse(request.id, "accepted")}
                  >
                    ✓
                  </Button>
                  <Button className="bg-red-600 w-10 h-10 rounded-full text-2xl"
                    onClick={() => handleFriendRequestResponse(request.id, "rejected")}
                  >
                    X
                  </Button>
                </div>
              </li>
            </div>
          ))}
        </ul>
      </div>


    </div>

  );
}
