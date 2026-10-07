import { getOptionalUser } from "@/lib/permissions";
import { getRaceList } from "@/lib/data/races";
import { getPoolBets } from "@/lib/data/bets";
import { getRosterAndTeams } from "@/lib/data/roster";
import { EntrantProvider } from "@/lib/entrantContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Landing } from "@/components/UserScreens";

export default async function Page() {
  const user = await getOptionalUser();
  const races = await getRaceList({ publicOnly: true });
  const bets = await getPoolBets({ publicOnly: true });
  const { roster, teams } = await getRosterAndTeams();

  return (
    <ErrorBoundary>
      <EntrantProvider drivers={roster} teams={teams}>
        <Landing S={{ races, bets, roster }} sessionUser={user} />
      </EntrantProvider>
    </ErrorBoundary>
  );
}
