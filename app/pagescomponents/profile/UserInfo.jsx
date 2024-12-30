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
import Image from "next/image";

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
  const [editMode, setEditMode] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [teamData, setTeamData] = useState(null);
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
        setTeamData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);

        if (data.teamId) {
          const teamDoc = await getDoc(doc(db, "teams", data.teamId));
          if (teamDoc.exists()) {
            setTeamData(teamDoc.data());
          }
        }
      }
    } catch (error) {
      console.error("Kullanıcı veya takım verisi alınırken hata oluştu:", error);
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageUrl = await uploadToCloudinary(file);
      const user = auth.currentUser;
      if (user) {
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
        const updatedData = {
          name: formData.name,
          surname: formData.surname,
          phone: formData.phone,
          city: formData.city,
          district: formData.district,
          position: formData.position,
        };

        await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });

        setUserData((prev) => ({ ...prev, ...updatedData }));
        setEditMode(false);
      }
    } catch (error) {
      console.error("Bilgiler kaydedilirken hata oluştu:", error);
    }
  };


  return (
    <div className="relative w-full max-w-4xl bg-white shadow-xl rounded-lg p-6">
      <div >
        <div className="relative h-48 w-full rounded-lg overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1604513896387-78c36ee80657?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3"
            alt="Background"
            className="object-cover"
            fill
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        <div className="relative -top-12 flex flex-col md:flex-row items-center gap-6">
          <img
            src={userData?.profileImage}
            alt="Profil Resmi"
            className="w-32 h-32 rounded-full border-4 border-white shadow-md cursor-pointer"
            onClick={() => document.getElementById("profileImageInput").click()}
          />
          <input
            type="file"
            id="profileImageInput"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800">
              {userData?.name || "Bilgi Yok"} {userData?.surname || "Bilgi Yok"}
            </h1>
          </div>
        </div>
      </div>

      {/* Kullanıcı Bilgileri */}
      <div className="w-full max-w-4xl bg-white  rounded-lg mt-6 p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bilgiler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 font-extrabold">Telefon:</p>
            <p className="text-gray-800">{userData?.phone || "Bilgi Yok"}</p>
          </div>
          <div>
            <p className="text-gray-600 font-extrabold">İl:</p>
            <p className="text-gray-800">{userData?.city || "Bilgi Yok"}</p>
          </div>
          <div>
            <p className="text-gray-600 font-extrabold">İlçe:</p>
            <p className="text-gray-800">{userData?.district || "Bilgi Yok"}</p>
          </div>
          <div>
            <p className="text-gray-600 font-extrabold">Mevki:</p>
            <p className="text-gray-800">{userData?.position || "Bilgi Yok"}</p>
          </div>
        </div>
      </div>

      <Sheet>
        <SheetTrigger asChild className="flex w-full justify-center">
          <div>
            <Button
              className="flex md:w-[40%] w-full bg-button border-none rounded-xl hover:bg-foreground hover:text-slate-700"
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
                <SelectTrigger className="w-full max-w-xs bg-foreground rounded-xl">
                  <SelectValue placeholder={formData.city || "Şehir Seç"} />
                </SelectTrigger>
                <SelectContent className="bg-foreground rounded-xl">
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
                <SelectTrigger className="w-full max-w-xs mt-4 bg-foreground rounded-xl">
                  <SelectValue placeholder={formData.district || "İlçe Seç"} />
                </SelectTrigger>
                <SelectContent className="bg-foreground rounded-xl">
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
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Mevki:</label>
              <Select
                onValueChange={(value) =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger className="w-full max-w-xs bg-foreground rounded-xl">
                  <SelectValue placeholder="Mevkinizi Seçin" />
                </SelectTrigger>
                <SelectContent className="bg-foreground rounded-xl">
                  <SelectGroup>
                    <SelectLabel>Mevkiler</SelectLabel>
                    <SelectItem value="Kaleci">Kaleci</SelectItem>
                    <SelectItem value="Defans">Defans</SelectItem>
                    <SelectItem value="Orta Saha">Ortasaha</SelectItem>
                    <SelectItem value="Forvet">Forvet</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </form>
          <SheetFooter>
            <SheetClose asChild className="flex items-center justify-center my-6">
              <Button type="submit" onClick={handleSave} className="rounded-xl bg-button hover:bg-foreground hover:text-slate-700">
                Kaydet
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  );
}
