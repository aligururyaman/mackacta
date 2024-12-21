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
import { Input } from "../ui/input";

const ScheduledMatches = ({ matches }) => {
  if (!matches || matches.length === 0) {
    return <p></p>;
  }

  return (
    <div className="flex flex-wrap p-2 justify-center sm:justify-normal">
      {matches.map((match) => (
        <div key={match.id}>
          <div className="flex flex-col justify-center items-center bg-slate-500 rounded-xl p-4 gap-3 shadow-xl border border-slate-700 w-80 ">
            <div className="flex flex-row">
              <AsyncTeamDataFetcher teamId={match.senderTeamId} />
            </div>
            <div className="flex flex-col justify-center items-center text-sm font-semibold gap-2">
              <div className="flex flex-col justify-center items-center text-green-200 p-2 rounded-xl">
                <p className="text-lime-600">Saha :</p>
                {match.field}
              </div>
              <div className="flex flex-col justify-center items-center p-3  text-green-200 rounded-xl">
                <p className="text-lime-600">Zaman :</p>
                <div >
                  {match.date?.toDate().toLocaleDateString()}
                </div>
                <div className="flex ">
                  {match.time}
                </div>
              </div>
            </div>
            <div>
            </div>
          </div>

        </div>

      ))}

    </div>

  );
};

export default ScheduledMatches;
