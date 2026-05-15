import { Group, Text, Button, Avatar, Badge, Box, Burger, Drawer, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLeaf, IconLogout } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [opened, { toggle, close }] = useDisclosure(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    close();
  };

  return (
    <Box px="xl" py="sm" style={{
      borderBottom: "1px solid var(--mantine-color-gray-2)",
      background: "white",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconLeaf size={28} color="var(--mantine-color-teal-6)" />
          <Text fw={700} size="lg" c="teal.7">NGO Field Hub</Text>
        </Group>

        {/* Desktop */}
        <Group gap="md" visibleFrom="sm">
          <Badge color={user?.role === "admin" ? "violet" : "teal"} variant="light" size="md">
            {user?.role?.toUpperCase()}
          </Badge>
          <Avatar color="teal" radius="xl" size="sm">
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Text size="sm" fw={500} c="gray.7">{user?.name}</Text>
          <Button variant="subtle" color="red" size="xs"
            leftSection={<IconLogout size={14} />} onClick={handleLogout}>
            Logout
          </Button>
        </Group>

        {/* Mobile */}
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
      </Group>

      <Drawer opened={opened} onClose={close} title="Menu" hiddenFrom="sm">
        <Stack p="md">
          <Text size="sm">Logged in as <b>{user?.name}</b></Text>
          <Badge color={user?.role === "admin" ? "violet" : "teal"} variant="light">
            {user?.role?.toUpperCase()}
          </Badge>
          <Button color="red" variant="outline" leftSection={<IconLogout size={14} />}
            onClick={handleLogout} fullWidth>
            Logout
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}