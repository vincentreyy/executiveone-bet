import { requirePermissionOrRedirect } from "@/lib/pageGuards";
import { getUsersList } from "@/lib/data/users";
import { getRolesList } from "@/lib/data/roles";
import { getRaceList } from "@/lib/data/races";
import { getPoolBetsForAdmin } from "@/lib/data/bets";
import { getRosterAndTeams } from "@/lib/data/roster";
import { EntrantProvider } from "@/lib/entrantContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminUsers } from "@/components/AdminExtra";

export default async function AdminUsersPage() {
  const admin = await requirePermissionOrRedirect("manage_users");
  const users = await getUsersList();
  const roles = await getRolesList();
  const { roster, teams } = await getRosterAndTeams();

  // Who-bet-on-whom is gated by the same permissions as /admin/bettors — a
  // manage_users-only admin gets no bet history in this modal.
  const canSeeBets = ["manage_races", "resolve_disputes"].some(p => admin.role.perms.includes(p));
  let betsByUser = null;
  let races = [];
  if (canSeeBets) {
    races = (await getRaceList()).map(r => ({ id: r.id, name: r.name }));
    betsByUser = {};
    for (const b of await getPoolBetsForAdmin()) {
      (betsByUser[b.uid] ||= []).push({ id: b.id, raceId: b.raceId, dId: b.dId, stake: b.stake, status: b.status, payout: b.payout, at: b.at });
    }
  }

  return (
    <ErrorBoundary>
      <EntrantProvider drivers={roster} teams={teams}>
        <AdminUsers S={{ users, roles, betsByUser, races }} />
      </EntrantProvider>
    </ErrorBoundary>
  );
}
