'use client';
import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import cityData from "../../cityData/cityData.json";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};




export default function UserInfo() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false); // Düzenleme modu
  const [friendRequests, setFriendRequests] = useState([]);
  const [teamData, setTeamData] = useState(null); // Takım bilgisi için state
  const [searchCity, setSearchCity] = useState("");
  const [districts, setDistricts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    phone: "",
    city: "",
    district: "",
    position: "",
  });

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
        // Yalnızca düzenlenebilir alanları güncelle
        const updatedData = {
          name: formData.name,
          surname: formData.surname,
          phone: formData.phone,
          city: formData.city,
          district: formData.district,
          position: formData.position,
        };

        await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });

        // Kullanıcı verilerini güncel haliyle set edin
        setUserData((prev) => ({ ...prev, ...updatedData }));
        setEditMode(false); // Düzenleme modundan çık
      }
    } catch (error) {
      console.error("Bilgiler kaydedilirken hata oluştu:", error);
    }
  };


  return (
    <div className="flex flex-col font-poppinsLight justify-center ">

      <div className="flex flex-col justify-center items-center gap-5">
        <div className="flex h-56 w-full bg-green-600 rounded-xl relative border-2 border-white">
          {/* Orta Çizgi */}
          <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-1 bg-white"></div>

          {/* Merkez Çember */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full"></div>

          {/* Kale ve Ceza Sahaları (Sağ) */}
          <div className="absolute top-1/4 right-12 border-r-0 transform translate-x-full w-12 h-1/2 border-2 border-white rounded-l-lg"></div>
          <div className="absolute top-1/3 right-6 border-r-0 transform translate-x-full w-6 h-1/3 border-2 border-white rounded-l-lg"></div>
          <div className="absolute top-2/4 -right-6 border-r-0 border-t-0 border-b-0 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white rounded-full"></div>

          {/* Kale ve Ceza Sahaları (Sol) */}
          <div className="absolute top-1/4 left-12 border-l-0 transform -translate-x-full w-12 h-1/2 border-2 border-white rounded-r-lg"></div>
          <div className="absolute top-1/3 left-6 border-l-0 transform -translate-x-full w-6 h-1/3 border-2 border-white rounded-r-lg"></div>
          <div className="absolute top-2/4 left-10 border-l-0 border-t-0 border-b-0 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white rounded-full"></div>
        </div>

        <div className="flex justify-center">
          <img
            src={userData?.profileImage || "/placeholder.svg"}
            alt="Profil Resmi"
            width="250"
            height="250"
            className="rounded-full bg-gray-300 cursor-pointer border border-slate-400 shadow-xl absolute top-24 items-center"
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
          <div className="space-y-1 items-center justify-center mt-40">
            <h1 className="text-4xl font-bold">{userData?.name || "Bilgi Yok"} {userData?.surname || "Bilgi Yok"}</h1>
          </div>
        </div>

        <div className="flex flex-row bg-slate-500 rounded-xl shadow-2xl my-7 h-56 w-full md:w-[40%] text-xl items-center justify-center">
          <div className="flex flex-col gap-4 p-7 font-extrabold">
            <p>Telefon :</p>
            <p>il :</p>
            <p>ilçe :</p>
            <p>Mevki :</p>
          </div>
          <div className="flex flex-col gap-4 p-7">
            <p>{userData?.phone || "Bilgi Yok"}</p>
            <p>{userData?.city || "Bilgi Yok"}</p>
            <p>{userData?.position || "Bilgi Yok"}</p>
            <p>{teamData ? teamData.name : "Takım Yok"}</p>
          </div>
        </div>


        <Sheet>
          <SheetTrigger asChild className="flex w-full justify-center">
            <div>
              <Button
                className="flex md:w-[40%] w-full bg-lime-400 border-none rounded-xl hover:bg-slate-400 "
                variant="outline"
                onClick={() => {
                  // Formu userData ile doldur
                  setFormData({
                    name: userData?.name || "",
                    surname: userData?.surname || "",
                    phone: userData?.phone || "",
                    city: userData?.city || "",
                    district: userData?.district || "",
                    position: userData?.position || "",
                  });

                  // Eğer şehir seçilmişse ilçeleri güncelle
                  if (userData?.city) {
                    const selectedCity = cityData.find(
                      (city) => capitalizeWords(city.name) === userData.city
                    );
                    setDistricts(
                      selectedCity ? selectedCity.counties.map(capitalizeWords) : []
                    );
                  }
                }}
              >
                Düzenle
              </Button>
            </div>

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
                <Select
                  onValueChange={(value) => {
                    setFormData({ ...formData, city: value, district: "" });

                    // İlçe listesini güncelle
                    const selectedCity = cityData.find(
                      (city) => capitalizeWords(city.name) === value
                    );
                    setDistricts(
                      selectedCity ? selectedCity.counties.map(capitalizeWords) : []
                    );
                  }}
                >
                  <SelectTrigger className="w-full max-w-xs bg-green-300 rounded-xl">
                    <SelectValue placeholder={formData.city || "Şehir Seç"} />
                  </SelectTrigger>
                  <SelectContent className="bg-green-300 rounded-xl">
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
              </div>

              <div>
                <Label>İlçe:</Label>
                <Select
                  onValueChange={(value) =>
                    setFormData({ ...formData, district: value })
                  }
                  disabled={!formData.city} // Şehir seçilmeden ilçe seçilemesin
                >
                  <SelectTrigger className="w-full max-w-xs mt-4 bg-green-300 rounded-xl">
                    <SelectValue placeholder={formData.district || "İlçe Seç"} />
                  </SelectTrigger>
                  <SelectContent className="bg-green-300 rounded-xl">
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
                <Button type="submit" onClick={handleSave}>
                  Kaydet
                </Button>
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
    </div>
  );
}
