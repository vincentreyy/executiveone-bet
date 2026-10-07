import { Suspense } from "react";
import { requireAnyPermissionOrRedirect } from "@/lib/pageGuards";
import { getRaceList } from "@/lib/data/races";
import { getPoolBetsForAdmin } from "@/lib/data/bets";
import { getRosterAndTeams } from "@/lib/data/roster";
import { EntrantProvider } from "@/lib/entrantContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminBettors } from "@/components/AdminBettors";

export default async function AdminBettorsPage() {
  await requireAnyPermissionOrRedirect(["manage_races", "resolve_disputes"], { to: "/admin" });

  // Unfiltered on purpose: admins see every race, and real player names (not
  // the public "Player" placeholder) — never reuse this on a player-facing page.
  const races = await getRaceList();
  const bets = await getPoolBetsForAdmin();
  const { roster, teams } = await getRosterAndTeams();

  return (
    <ErrorBoundary>
      <EntrantProvider drivers={roster} teams={teams}>
        <Suspense>
          <AdminBettors S={{ races, bets }} />
        </Suspense>
      </EntrantProvider>
    </ErrorBoundary>
  );
}
