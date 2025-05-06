import { Flex, Text, Button } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <Flex direction="column" gap="2">
      <Text>Hello from Radix Themes</Text>
      <Button>Let's go</Button>
    </Flex>
  );
}
