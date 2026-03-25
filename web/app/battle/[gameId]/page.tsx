import { BattleClient } from "@/components/battle/BattleClient";

type BattlePageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export default async function BattlePage({ params }: BattlePageProps) {
  const { gameId } = await params;
  return <BattleClient gameId={gameId} />;
}
