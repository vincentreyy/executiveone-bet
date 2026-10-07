import { requireUserOrRedirect } from "@/lib/pageGuards";
import { getMyBets } from "@/lib/data/bets";
import { getRaceList } from "@/lib/data/races";
import { getRosterAndTeams } from "@/lib/data/roster";
import { EntrantProvider } from "@/lib/entrantContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MyBets } from "@/components/UserScreens";

export default async function BetsPage() {
  const user = await requireUserOrRedirect();
  const bets = await getMyBets(user.id);
  // Hidden races stay off every public page, but a player who already bet on one
  // still sees it here so their own bet history isn't silently emptied.
  const races = await getRaceList({ publicOnly: true, includeIds: [...new Set(bets.map(b => b.raceId))] });
  const { roster, teams } = await getRosterAndTeams();

  return (
    <ErrorBoundary>
      <EntrantProvider drivers={roster} teams={teams}>
        <MyBets S={{ bets, races }} />
      </EntrantProvider>
    </ErrorBoundary>
  );
}
