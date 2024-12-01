import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LuSwords } from "react-icons/lu";
import { IoPersonAdd } from "react-icons/io5";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "@/utils/firebase";

const TeamTable = ({ teams, currentUserData, setPlaySetMatch, setSelectedTeamId, db }) => {
  const handleMatchSetup = (teamId) => {
    setSelectedTeamId(teamId); // Seçilen takımın ID'sini güncelle
    setPlaySetMatch(true); // Modal'ı aç
  };
  const handleJoinTeam = async (teamId) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Giriş yapmalısınız.");
        return;
      }

      if (!teamId) {
        alert("Geçersiz takım.");
        return;
      }

      const userId = user.uid; // Kullanıcı UID'si
      console.log("Kullanıcı UID:", userId);
      console.log("Takım ID:", teamId);

      // Kullanıcı daha önce istek göndermiş mi kontrol et
      const requestQuery = query(
        collection(db, "teamRequests"),
        where("senderId", "==", userId), // UID kullanılıyor
        where("teamId", "==", teamId),
        where("status", "==", "pending")
      );

      const existingRequest = await getDocs(requestQuery);
      if (!existingRequest.empty) {
        alert("Bu takıma zaten bir istek gönderdiniz.");
        return;
      }

      // İstek gönder
      const requestRef = doc(collection(db, "teamRequests"));
      await setDoc(requestRef, {
        senderId: userId, // UID ile istek oluşturuluyor
        teamId,
        status: "pending",
        timestamp: new Date(),
      });

      alert("Takıma katılma isteği gönderildi.");
    } catch (error) {
      console.error("Takıma katılma isteği gönderilirken hata oluştu:", error);
      alert("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  };




  return (
    <Table>
      <TableCaption>Arama sonuçları</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Takım Resmi</TableHead>
          <TableHead>Takım Adı</TableHead>
          <TableHead>Şehir</TableHead>
          <TableHead>İlçe</TableHead>
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
            <TableCell>{team.name}</TableCell>
            <TableCell>{team.city}</TableCell>
            <TableCell>{team.district}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>
              {currentUserData?.teamId === null ? (
                // Kullanıcının takımı yoksa "Takıma Katıl" düğmesi
                <Button
                  className="min-w-min justify-center items-center text-sm px-2 py-1"
                  onClick={() => handleJoinTeam(team.id)}
                >
                  <IoPersonAdd />
                  Takıma Katıl
                </Button>
              ) : currentUserData?.teamId === team.id && currentUserData?.id === team.captainId ? (
                // Kullanıcı takımın kaptanıysa "Maç Ayarla" düğmesi
                <Button
                  className="min-w-min justify-center items-center text-sm px-2 py-1"
                  onClick={() => handleMatchSetup(team.id)}
                >
                  <LuSwords />
                  Maç Ayarla
                </Button>
              ) : null /* Kullanıcı bir takıma üyeyse hiçbir şey gösterme */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TeamTable;
