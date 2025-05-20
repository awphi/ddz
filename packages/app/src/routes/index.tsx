import {
  Button,
  DataList,
  Flex,
  Heading,
  RadioCards,
  ScrollArea,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

const GAME_CARDS: GameCardProps[] = [
  {
    id: "doudizhu",
    title: "👑 Dou Di Zhu (Fight the Landlord) (斗地主)",
    desc: "Popular 3-player climbing card game. Simple, fun and balanced!",
    origin: "Hubei, China 🇨🇳",
    players: "3 (2v1)",
    cards: "54",
  },
  {
    id: "guandan",
    title: "🥚 Guan Dan (Throwing Eggs) (掼蛋)",
    desc: "The most popular climbing card game in China. Features significant tactical depth and co-operative elements.",
    origin: "Jiangsu, China 🇨🇳",
    players: "4 (2v2)",
    cards: "108",
    disabled: true,
  },
  {
    id: "ride-the-bus",
    title: "🚌 Ride the Bus",
    desc: "Simple draw and discard game played in the USA and UK with many regional variations.",
    origin: "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    players: "2-9",
    cards: "52",
    disabled: true,
  },
];

interface GameCardProps {
  id: string;
  title: string;
  desc: string;
  origin: string;
  players: string;
  cards: string;
  disabled?: boolean;
}

function GameCard({
  id,
  title,
  desc,
  origin,
  players,
  cards,
  disabled = false,
}: GameCardProps) {
  const card = (
    <RadioCards.Item value={id} disabled={disabled}>
      <Flex gap="2" direction="column">
        <Heading size="4">{title}</Heading>
        <Text color="gray">{desc}</Text>
        <Separator size="4" />
        <DataList.Root>
          <DataList.Item>
            <DataList.Label>Players</DataList.Label>
            <DataList.Value>{players}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Cards</DataList.Label>
            <DataList.Value>{cards}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Origin</DataList.Label>
            <DataList.Value>{origin}</DataList.Value>
          </DataList.Item>
        </DataList.Root>
      </Flex>
    </RadioCards.Item>
  );

  if (disabled) {
    return (
      <Tooltip content="Coming soon!" disableHoverableContent={true}>
        {card}
      </Tooltip>
    );
  }

  return card;
}

function Index() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  return (
    <Flex
      m="auto"
      height="100vh"
      justify="center"
      direction="column"
      maxWidth="500px"
      minWidth="350px"
      gap="2"
      p="4"
    >
      <Heading size="8">@ddz/app</Heading>
      <Text>
        Easily play popular card games from around the world with friends
        in-person or online!
      </Text>
      <Separator size="4"></Separator>
      <Heading>Select a game:</Heading>
      <ScrollArea style={{ flex: 1 }} type="auto" scrollbars="vertical">
        <RadioCards.Root onValueChange={setSelectedGame}>
          <Flex direction="column" pr="4" gap="2">
            {GAME_CARDS.map((game) => (
              <GameCard {...game} key={game.id} />
            ))}
          </Flex>
        </RadioCards.Root>
      </ScrollArea>
      <Flex gap="2">
        <Tooltip content="Coming soon!" disableHoverableContent={true}>
          <Button style={{ flex: 1 }} disabled={true}>
            🚀 Play online
          </Button>
        </Tooltip>
        {/* TODO link to /lobby/${selectedGame} */}
        <Button
          style={{ flex: 1 }}
          disabled={selectedGame === null}
          color="green"
          asChild
        >
          📱 Play locally
        </Button>
      </Flex>
    </Flex>
  );
}
