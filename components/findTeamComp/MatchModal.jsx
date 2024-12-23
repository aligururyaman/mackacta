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
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const timeSlots = [
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "22:00-23:00",
    "23:00-24:00",
    "00:00-01:00",
    "01:00-02:00",
    "02:00-03:00",
    "03:00-04:00",
    "04:00-05:00",
    "05:00-06:00",
    "06:00-07:00",
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10-00",
    "10:00-11-00",
    "11:00-12:00",
    "12:00-13:00",
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

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setPopoverOpen(false); // Tarih seçildiğinde popover'ı kapat
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-background p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Maç İsteği Gönder</h2>

        <div className="mb-4">
          <label className="block font-bold mb-2">Tarih Seç</label>
          <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal bg-white",
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
                onSelect={handleDateSelect}
                initialFocus
                className="bg-foreground"
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
          <Button className="rounded-xl bg-button hover:bg-foreground hover:text-white" variant="secondary" onClick={onClose}>
            Kapat
          </Button>
          <Button className="rounded-xl bg-button hover:bg-foreground hover:text-white" onClick={handleSendMatchRequest}>Gönder</Button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
