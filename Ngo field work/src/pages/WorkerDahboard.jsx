import { useState, useEffect, useCallback } from "react";
import {
  Container, Title, Text, Button, Paper, Stack, Group, Select,
  NumberInput, Textarea, TextInput, Badge, Table, ActionIcon,
  Modal, Tabs, Box, Alert, Loader, Center, Divider,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconPlus, IconHistory, IconEdit, IconCheck,
  IconAlertCircle, IconClipboardList, IconX,
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import dayjs from "dayjs";

const STATUS_COLORS = { pending: "yellow", "in-progress": "blue", completed: "green" };

const emptyForm = {
  region: "", activityType: "", beneficiaryCount: 0,
  beneficiaryType: "", description: "", issues: "", location: "", date: null,
};

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [form, setForm]           = useState({ ...emptyForm, region: user?.region || "" });
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [editSub, setEditSub]         = useState(null);
  const [editStatus, setEditStatus]   = useState("");
  const [editRemark, setEditRemark]   = useState("");
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState("submit");

  const fetchSubmissions = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await api.get("/submissions/my");//fetch submissions for the logged in worker
      setSubmissions(res.data);
    } catch {
      notifications.show({ color: "red", title: "Error", message: "Could not load submissions" });
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useEffect(() => {
    api.get("/submissions/my")//fetch submissions for the logged in worker
      .then((res) => setSubmissions(res.data))
      .catch(() => notifications.show({ color: "red", title: "Error", message: "Could not load submissions" }))
      .finally(() => setLoadingSubs(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date) {
      notifications.show({ color: "red", title: "Missing date", message: "Please select a date" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, activityType: form.activityType === "other" ? (form.customActivity || "other") : form.activityType };
      await api.post("/submissions", payload);
      notifications.show({ color: "teal", title: "Submitted!", message: "Activity submitted successfully." });
      setForm({ ...emptyForm, region: user?.region || "" });
      fetchSubmissions();
      setActiveTab("history");
    } catch (err) {
      notifications.show({ color: "red", title: "Error", message: err.response?.data?.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (sub) => {
    setEditSub(sub);
    setEditStatus(sub.status);
    setEditRemark(sub.remark || "");
    openEdit();
  };

  const handleEditSave = async () => {
    try {
      await api.patch(`/submissions/${editSub._id}`, { status: editStatus, remark: editRemark });//update submission status and remark
      notifications.show({ color: "teal", title: "Updated!", message: "Submission updated." });
      closeEdit();
      fetchSubmissions();
    } catch {
      notifications.show({ color: "red", title: "Error", message: "Update failed" });
    }
  };
  return (
    <Box mih="100vh" bg="gray.0">
      <Navbar />
      <Container size="lg" py="xl">
        <Group mb="xl" align="center">
          <IconClipboardList size={32} color="var(--mantine-color-teal-6)" />
          <Box>
            <Title order={3} c="teal.7">Worker Dashboard</Title>
            <Text c="dimmed" size="sm">Welcome, {user?.name} · {user?.region || "No region set"}</Text>
          </Box>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} color="teal">
          <Tabs.List mb="lg">
            <Tabs.Tab value="submit" leftSection={<IconPlus size={16} />}>Submit Activity</Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              My History ({submissions.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* Submit Tab */}
          <Tabs.Panel value="submit">
            <Paper shadow="sm" radius="lg" p="xl" withBorder>
              <Title order={4} mb="lg" c="gray.7">New Activity Submission</Title>
              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  <Group grow>
                    <TextInput label="Region" placeholder="e.g. North Zone" required
                      value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                    <TextInput label="Location / Village" placeholder="e.g. Rampur Village" required
                      value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </Group>
                  <Group grow>
                    <Select label="Activity Type" placeholder="Select activity" required
                      data={[
                        { value: "training", label: "Training" },
                        { value: "distribution", label: "Distribution" },
                        { value: "survey", label: "Survey" },
                        { value: "meeting", label: "Meeting" },
                        { value: "other", label: "Other" },
                      ]}
                      value={form.activityType === "other" || !["training","distribution","survey","meeting","other",""].includes(form.activityType) ? form.activityType : form.activityType}
                      onChange={(val) => setForm({ ...form, activityType: val })}
                    />
                    {form.activityType === "other" && (
                      <TextInput label="Specify Activity" placeholder="Type your activity..." required
                        value={form.customActivity || ""}
                        onChange={(e) => setForm({ ...form, customActivity: e.target.value })} />
                    )}
                    <DateInput label="Activity Date" placeholder="Pick date" required
                      value={form.date} onChange={(val) => setForm({ ...form, date: val })}
                      maxDate={new Date()} />
                  </Group>
                  <Group grow>
                    <NumberInput label="Number of Beneficiaries" placeholder="e.g. 50" required min={0}
                      value={form.beneficiaryCount}
                      onChange={(val) => setForm({ ...form, beneficiaryCount: val })} />
                    <TextInput label="Beneficiary Type" placeholder="e.g. Farmers, Women" required
                      value={form.beneficiaryType}
                      onChange={(e) => setForm({ ...form, beneficiaryType: e.target.value })} />
                      </Group>
                  <Textarea label="Activity Description" placeholder="Describe what was done..." required
                    minRows={3} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <Textarea label="Issues / Challenges (optional)" placeholder="Any problems faced?"
                    minRows={2} value={form.issues}
                    onChange={(e) => setForm({ ...form, issues: e.target.value })} />
                  <Group justify="flex-end" mt="sm">
                    <Button type="button" variant="subtle" color="gray"
                      onClick={() => setForm({ ...emptyForm, region: user?.region || "" })}>
                      Clear
                    </Button>
                    <Button type="submit" color="teal" loading={submitting}
                      leftSection={<IconCheck size={16} />}>
                      Submit Activity
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Paper>
          </Tabs.Panel>

          {/* History Tab */}
          <Tabs.Panel value="history">
            <Paper shadow="sm" radius="lg" p="xl" withBorder>
              <Title order={4} mb="lg" c="gray.7">Submission History</Title>
              {loadingSubs ? (
                <Center py="xl"><Loader color="teal" /></Center>
              ) : submissions.length === 0 ? (
                <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                  No submissions yet. Submit your first activity!
                </Alert>
              ) : (
                <Box style={{ overflowX: "auto" }}>
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Activity</Table.Th>
                        <Table.Th>Location</Table.Th>
                        <Table.Th>Beneficiaries</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Remark</Table.Th>
                        <Table.Th>Edit</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {submissions.map((s) => (
                        <Table.Tr key={s._id}>
                          <Table.Td>{dayjs(s.date).format("DD MMM YYYY")}</Table.Td>
                          <Table.Td>
                            <Badge variant="light" color="teal" size="sm">{s.activityType}</Badge>
                          </Table.Td>
                          <Table.Td>{s.location}</Table.Td>
                          <Table.Td>{s.beneficiaryCount} {s.beneficiaryType}</Table.Td>
                          <Table.Td>
                            <Badge color={STATUS_COLORS[s.status]} size="sm">{s.status}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed" maw={150} truncate>{s.remark || "—"}</Text>
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon variant="light" color="teal" size="sm"
                              onClick={() => openEditModal(s)}>
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              )}
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Container>

      {/* Edit Modal */}
      <Modal opened={editOpened} onClose={closeEdit} title="Update Submission" centered radius="lg">
        {editSub && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Activity: <b>{editSub.activityType}</b> on {dayjs(editSub.date).format("DD MMM YYYY")}
            </Text>
            <Divider />
            <Select label="Status"
              data={[
                { value: "pending", label: "Pending" },
                { value: "in-progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
              ]}
              value={editStatus} onChange={setEditStatus}
            />
            <Textarea label="Remark / Notes" placeholder="Add any remarks..."
              minRows={3} value={editRemark}
              onChange={(e) => setEditRemark(e.target.value)} />
            <Group justify="flex-end">
              <Button variant="subtle" color="gray" onClick={closeEdit}
                leftSection={<IconX size={14} />}>Cancel</Button>
              <Button color="teal" onClick={handleEditSave}
                leftSection={<IconCheck size={14} />}>Save Changes</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}