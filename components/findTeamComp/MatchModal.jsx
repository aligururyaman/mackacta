'use client';
import { CalendarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { auth, db } from "@/utils/firebase";
import { collection, addDoc, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";

const MatchModal = ({ teamId, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [date, setDate] = useState(null)

  const timeSlots = [
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
  ]; // Saat dilimleri

  const handleSendMatchRequest = async () => {
    try {
      const user = auth.currentUser;

      if (!user || !user.uid) {
        alert("Giriş yapmalısınız.");
        return;
      }

      if (!selectedDate || !selectedTime || !selectedField) {
        alert("Lütfen tüm alanları doldurun.");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        alert("Kullanıcı verisi bulunamadı.");
        return;
      }

      const senderTeamId = userDoc.data().teamId;
      if (!senderTeamId) {
        alert("Takımınız yok, maç isteği gönderemezsiniz.");
        return;
      }

      const matchRequestRef = collection(db, "matchRequests");

      await addDoc(matchRequestRef, {
        senderTeamId, // Gönderen takımın ID'si
        receiverTeamId: teamId, // Alıcı takımın ID'si
        date: selectedDate,
        time: selectedTime,
        field: selectedField,
        status: "pending",
        timestamp: new Date(),
      });

      alert("Maç isteği gönderildi.");
      onClose();
    } catch (error) {
      console.error("Maç isteği gönderilirken hata oluştu:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Maç İsteği Gönder</h2>

        <div className="mb-4">
          <label className="block font-bold mb-2">Tarih Seç</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Tarih seçin</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>


        <div className="mb-4">
          <label className="block font-bold mb-2">Saat Seç</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="" disabled>
              Saat Dilimi Seçin
            </option>
            {timeSlots.map((slot, index) => (
              <option key={index} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-bold mb-2">Halı Saha</label>
          <input
            type="text"
            placeholder="Halı Saha Adı"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Kapat
          </Button>
          <Button onClick={handleSendMatchRequest}>Gönder</Button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
