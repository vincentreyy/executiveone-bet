import { getRaceList } from "@/lib/data/races";
import { getPoolBets } from "@/lib/data/bets";
import { ChampionshipsIndex } from "@/components/UserScreens";

export default async function ChampionshipIndexPage() {
  const races = await getRaceList({ publicOnly: true });
  const bets = await getPoolBets({ publicOnly: true });

  return <ChampionshipsIndex S={{ races, bets }} />;
}
