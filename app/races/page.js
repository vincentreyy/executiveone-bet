import { getRaceList } from "@/lib/data/races";
import { getPoolBets } from "@/lib/data/bets";
import { RacesIndex } from "@/components/UserScreens";

export default async function RacesIndexPage() {
  const races = await getRaceList({ publicOnly: true });
  const bets = await getPoolBets({ publicOnly: true });

  return <RacesIndex S={{ races, bets }} />;
}
