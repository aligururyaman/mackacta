'use client';
import AsyncTeamDataFetcher from "@/components/AsyncTeamDataFetcher";
import { Button } from "../ui/button";

const ScheduledMatches = ({ matches, ownTeamId }) => {
  if (!matches || matches.length === 0) {
    return (
      <p className="text-center text-gray-500 text-lg font-medium mt-10">
        Henüz planlanmış maç yok.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap p-6 justify-center md:justify-start gap-8 bg-foreground">
      {matches.map((match) => {
        const opponentTeamId =
          match.senderTeamId === ownTeamId ? match.receiverTeamId : match.senderTeamId;

        return (
          <div
            key={match.id}
            className="bg-foreground rounded-lg shadow-lg border border-gray-200 w-full max-w-sm p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center gap-6">
              <AsyncTeamDataFetcher teamId={opponentTeamId} />

              <div className="w-full border-t border-gray-300"></div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Saha</h3>
                <p className="text-sm text-gray-600">{match.field || "Bilinmiyor"}</p>
              </div>

              <div className="w-full border-t border-gray-300"></div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Zaman</h3>
                <p className="text-sm text-gray-600">
                  {match.date
                    ? `${match.date.toDate().toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                    })} ${match.date.toDate().toLocaleDateString("tr-TR", { weekday: "long" })}`
                    : "Tarih Yok"}
                </p>
                <p className="text-sm text-gray-600">{match.time || "Saat Yok"}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScheduledMatches;