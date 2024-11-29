import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LuSwords } from "react-icons/lu";
import { IoPersonAdd } from "react-icons/io5";

const TeamTable = ({ teams, currentUserData, setPlaySetMatch, setSelectedTeamId }) => {
  const handleMatchSetup = (teamId) => {
    setSelectedTeamId(teamId); // Seçilen takımın ID'sini güncelle
    setPlaySetMatch(true); // Modal'ı aç
  }
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
              {currentUserData?.teamId !== team.id && (
                <Button
                  className="min-w-min justify-center items-center text-sm px-2 py-1"
                  onClick={() => handleMatchSetup(team.id)} // Butona tıklanınca işlemi tetikle
                >
                  <LuSwords />
                  Maç Ayarla
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


export default TeamTable;
