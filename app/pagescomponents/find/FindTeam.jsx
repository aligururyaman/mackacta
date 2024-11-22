'use client';
import { useState, useEffect } from "react";
import { auth, db } from "@/utils/firebase";
import { collection, query, where, getDocs, doc, setDoc, addDoc, getDoc } from "firebase/firestore";
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

const capitalizeWords = (str) => {
  return str
    ?.toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const FindTeam = () => {
  const [searchCity, setSearchCity] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchTeamName, setSearchTeamName] = useState("");
  const [teams, setTeams] = useState([]);
  const [districts, setDistricts] = useState([]);

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

  const handleCityDistrictSearch = async () => {
    try {
      const teamsRef = collection(db, "teams");
      const q = query(
        teamsRef,
        where("city", "==", searchCity),
        where("district", "==", searchDistrict)
      );

      const querySnapshot = await getDocs(q);
      const teamList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeams(teamList);
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  const handleTeamNameSearch = async () => {
    try {
      const teamsRef = collection(db, "teams");
      const q = query(teamsRef, where("name", "==", searchTeamName));

      const querySnapshot = await getDocs(q);
      const teamList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeams(teamList);
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  const handleJoinRequest = async (teamId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Giriş yapmalısınız.");
        return;
      }

      // Kullanıcının zaten bir takımı var mı kontrol et
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      if (userData.teamId) {
        alert("Zaten bir takıma üyeyseniz başka bir takıma istek gönderemezsiniz.");
        return;
      }

      // Takım isteklerine ekle
      await addDoc(collection(db, "teamRequests"), {
        teamId,
        senderId: user.uid,
        status: "pending",
        timestamp: new Date(),
      });

      alert("Takım isteği gönderildi.");
    } catch (error) {
      console.error("İstek gönderilirken hata oluştu:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold mb-4">Takım Arama</h2>

      <div className="mb-6">
        <h3>Şehir ve İlçe ile Ara</h3>
        <div className="flex items-center gap-4">
          <Select onValueChange={(value) => setSearchCity(value)}>
            <SelectTrigger className="w-40">
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
            <SelectTrigger className="w-40">
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

          <Button onClick={handleCityDistrictSearch}>Ara</Button>
        </div>
      </div>

      <div className="mb-6">
        <h3>Takım Adı ile Ara</h3>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Takım Adı"
            className="w-40 p-2 border rounded"
            value={searchTeamName}
            onChange={(e) => setSearchTeamName(e.target.value)}
          />
          <Button onClick={handleTeamNameSearch}>Ara</Button>
        </div>
      </div>

      <Table>
        <TableCaption>Arama sonuçları</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Takım Resmi</TableHead>
            <TableHead>Takım Adı</TableHead>
            <TableHead>Şehir</TableHead>
            <TableHead>İlçe</TableHead>
            <TableHead>Kaptan</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell>
                <img
                  src={team.teamImage || "/placeholder.png"}
                  alt="Takım Resmi"
                  className="w-10 h-10 rounded-full object-cover"
                />
              </TableCell>
              <TableCell>{capitalizeWords(team.name)}</TableCell>
              <TableCell>{capitalizeWords(team.city)}</TableCell>
              <TableCell>{capitalizeWords(team.district)}</TableCell>
              <TableCell>{team.captainName || "-"}</TableCell>
              <TableCell>{team.captainPhone || "-"}</TableCell>
              <TableCell>
                <Button onClick={() => handleJoinRequest(team.id)}>Ekle</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FindTeam;
