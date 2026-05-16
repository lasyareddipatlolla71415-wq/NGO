import { useState } from "react";
import {
  TextInput, PasswordInput, Button, Paper, Title, Text,
  Stack, Center, Box, Alert, Group, Divider,
} from "@mantine/core";
import { IconLeaf, IconAlertCircle } from "@tabler/icons-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../Context/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api/axios";

export default function Login() {
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);//login api call
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === "admin" ? "/admin" : "/worker");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await api.post("/auth/google", { credential: credentialResponse.credential });//google login api call
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === "admin" ? "/admin" : "/worker");//redirect based on role
    } catch {
      setError("Google login failed");
    }
  };

  return (
    <Center mih="100vh" bg="gray.0">
      <Box w="100%" maw={420} px="md">
        <Stack align="center" mb="xl" gap="xs">
          <IconLeaf size={48} color="var(--mantine-color-teal-6)" />
          <Title order={2} ta="center" c="teal.7">NGO Field Hub</Title>
          <Text c="dimmed" size="sm" ta="center">
            Sign in to access your dashboard
          </Text>
        </Stack>

        <Paper shadow="md" radius="lg" p="xl" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  {error}
                </Alert>
              )}
              <TextInput
                label="Email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <PasswordInput
                label="Password"
                placeholder="Your password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <Button type="submit" color="teal" fullWidth loading={loading} mt="sm">
                Sign In
              </Button>
              <Divider label="or" labelPosition="center" />
              <Center>
                <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google login failed")} />
              </Center>
            </Stack>
          </form>
        </Paper>

        <Group justify="center" mt="md">
          <Text size="sm" c="dimmed">
            Don't have an account?{" "}
            <Text component={Link} to="/register" c="teal.6" fw={500}>
              Register
            </Text>
          </Text>
        </Group>
      </Box>
    </Center>
  );
}