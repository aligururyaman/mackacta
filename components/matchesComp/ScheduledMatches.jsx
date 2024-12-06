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
    <div className="flex flex-col justify-center p-2">
      {matches.map((match) => (
        <div key={match.id} className="flex flex-col p-5 w-full mb-2 items-center bg-green-300 rounded-xl ">
          <div className="flex p-2 w-[95%] justify-center items-center gap-10 bg-green-200 rounded-xl shadow-xl">
            <div>
              <AsyncTeamDataFetcher teamId={match.senderTeamId} />
            </div>
            <div className="flex flex-col justify-center items-center text-sm font-semibold gap-2">
              <div className="flex bg-green-800 text-green-200 p-2 rounded-xl">
                {match.field}
              </div>
              <div className="flex flex-col justify-center items-center p-3 bg-green-800 text-green-200 rounded-xl">
                <div >
                  {match.date?.toDate().toLocaleDateString()}
                </div>
                <div className="flex ">
                  {match.time}
                </div>
              </div>
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
