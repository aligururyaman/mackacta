'use client';
import { useState, useEffect } from "react";
import { auth, db } from "@/utils/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
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
import TeamTable from "@/components/findTeamComp/TeamTable";
import MatchModal from "@/components/findTeamComp/MatchModal";
import { Search } from 'lucide-react';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [playSetMatch, setPlaySetMatch] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);


  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      setCurrentUser(user);

      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      }
    };
    fetchCurrentUser();
  }, []);

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

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = auth.currentUser;
      setCurrentUser(user);

      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentUserData({ ...userDoc.data(), id: user.uid });
        }
      }
    };
    fetchCurrentUser();
  }, []);


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

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold mb-4">Takım Arama</h2>

      {/* Şehir ve İlçe Arama */}
      <div className="mb-6 flex flex-col gap-2">
        <h3>Şehir ve İlçe ile Ara</h3>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2  items-center">
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
                  {cityData
                    .find((city) => capitalizeWords(city.name) === searchCity)
                    ?.counties.map((district, index) => (
                      <SelectItem key={index} value={capitalizeWords(district)}  >
                        {capitalizeWords(district)}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button onClick={handleCityDistrictSearch} variant="outline" size="icon" className="rounded-xl bg-button hover:bg-background hover:text-slate-700 border-none" >
              <Search size={40} strokeWidth={2.75} />
            </Button>
          </div>
        </div>
      </div>

      {/* Takım Adı ile Arama */}
      <div className="mb-6 flex flex-col gap-2">
        <h3>Takım Adı ile Ara</h3>
        <div className="flex items-center gap-4 ">
          <input
            type="text"
            placeholder="Takım Adı"
            className="w-40 p-2 border rounded-xl bg-foreground border-none placeholder-slate-500"
            value={searchTeamName}
            onChange={(e) => setSearchTeamName(e.target.value)}
          />
          <Button onClick={handleTeamNameSearch} variant="outline" size="icon" className="rounded-xl bg-button hover:bg-background hover:text-slate-700 border-none" >
            <Search size={40} strokeWidth={2.75} />
          </Button>
        </div>
      </div>

      {/* Takım Tablosu */}


      <TeamTable
        teams={teams}
        currentUserData={currentUserData}
        setPlaySetMatch={setPlaySetMatch}
        setSelectedTeamId={setSelectedTeamId}
        db={db} // Firestore bağlantısını gönderiyoruz
      />


      {/* Modal */}
      {playSetMatch && selectedTeamId && (
        <MatchModal
          teamId={selectedTeamId} // Seçilen takımın ID'si
          onClose={() => setPlaySetMatch(false)} // Modal'ı kapatma
          db={db} // Firestore bağlantısı
        />

      )}
    </div>
  );
};

export default FindTeam;
