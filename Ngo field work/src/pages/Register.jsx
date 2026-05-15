import { useState } from "react";
import {
  TextInput, PasswordInput, Button, Paper, Title, Text,
  Stack, Center, Box, Alert, Select, Group, Divider,
} from "@mantine/core";
import { IconLeaf, IconAlertCircle } from "@tabler/icons-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "worker", region: "", phone: "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === "admin" ? "/admin" : "/worker");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await api.post("/auth/google", { credential: credentialResponse.credential });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === "admin" ? "/admin" : "/worker");
    } catch {
      setError("Google login failed");
    }
  };

  return (
    <Center mih="100vh" bg="gray.0">
      <Box w="100%" maw={460} px="md">
        <Stack align="center" mb="xl" gap="xs">
          <IconLeaf size={48} color="var(--mantine-color-teal-6)" />
          <Title order={2} ta="center" c="teal.7">Create Account</Title>
          <Text c="dimmed" size="sm" ta="center">
            Register as a field worker or admin
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
              <TextInput label="Full Name" placeholder="John Doe" required
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextInput label="Email" placeholder="you@example.com" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <PasswordInput label="Password" placeholder="Min 6 characters" required
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <Select
                label="Role"
                data={[{ value: "worker", label: "Field Worker" }, { value: "admin", label: "Admin" }]}
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val })}
              />
              <TextInput label="Region" placeholder="e.g. North Zone"
                value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              <TextInput label="Phone" placeholder="+91 98765 43210"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Button type="submit" color="teal" fullWidth loading={loading} mt="sm">
                Create Account
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
            Already have an account?{" "}
            <Text component={Link} to="/login" c="teal.6" fw={500}>Sign In</Text>
          </Text>
        </Group>
      </Box>
    </Center>
  );
}