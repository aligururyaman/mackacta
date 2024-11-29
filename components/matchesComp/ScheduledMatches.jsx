'use client';
import AsyncTeamDataFetcher from "@/components/AsyncTeamDataFetcher";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const ScheduledMatches = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return <p>Planlanmış maç yok.</p>;
  }

  return (
    <div className="flex flex-col w-full ">
      <h3 className="font-bold">Planlanmış Maçlar</h3>
      {matches.map((match) => (
        <div key={match.id} className="flex flex-col p-2 mb-2 border-2 items-center">
          <p className="font-bold"><span >Maç Yeri :</span> {match.field}</p>
          <p className="font-extrabold">
            {match.date?.toDate().toLocaleDateString()} - Saat: {match.time}
          </p>

          <div className="flex gap-4">
            <div>
              <AsyncTeamDataFetcher teamId={match.senderTeamId} />
            </div>
            <div>
              <AsyncTeamDataFetcher teamId={match.receiverTeamId} />
            </div>
          </div>

        </div>

      ))}

    </div>

  );
};

export default ScheduledMatches;
