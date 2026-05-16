import { useState, useEffect } from "react";
import {
  Container, Title, Text, Button, Paper, Stack, Group, Select,
  TextInput, Badge, Table, ActionIcon, Modal, Tabs, Box,
  Alert, Loader, Center, Divider, SimpleGrid, Progress, Card, List,
  ThemeIcon,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { BarChart, PieChart } from "@mantine/charts";
import { useDisclosure } from "@mantine/hooks";
import {
  IconClipboardList, IconChartBar, IconBrain, IconSearch, IconEye,
  IconAlertTriangle, IconMapPin, IconBulb,
} from "@tabler/icons-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import dayjs from "dayjs";

const STATUS_COLORS = { pending: "yellow", "in-progress": "blue", completed: "green" };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", region: "", status: "", activityType: "", startDate: null });
  const [activeTab, setActiveTab] = useState("records");
  const [viewSub, setViewSub] = useState(null);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiDates, setAiDates] = useState({ start: null, end: null });

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.region) params.region = filters.region;
      if (filters.status) params.status = filters.status;
      if (filters.activityType) params.activityType = filters.activityType;
      if (filters.startDate) params.startDate = filters.startDate;
      const res = await api.get("/submissions/all", { params });//fetch submissions with filters and fetch summary data for analytics
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchSubmissions(); }, []);

  const handleViewDetails = (sub) => { setViewSub(sub); openView(); };

  const handleAiSummary = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post("/ai/summary", { start: aiDates.start, end: aiDates.end });//call AI summary API
      setAiResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const regionMap = submissions.reduce((acc, s) => { acc[s.region] = (acc[s.region] || 0) + 1; return acc; }, {});
  const barData = Object.entries(regionMap).map(([name, Submissions]) => ({ name, Submissions }));
  const activityMap = submissions.reduce((acc, s) => { acc[s.activityType] = (acc[s.activityType] || 0) + 1; return acc; }, {});
  const pieData = Object.entries(activityMap).map(([name, value]) => ({ name, value, color: "violet.6" }));
  const completedCount = submissions.filter((s) => s.status === "completed").length;
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <Box mih="100vh" bg="gray.0">
      <Navbar />
      <Container size="xl" py="xl">
        <Group mb="xl">
          <IconClipboardList size={32} color="var(--mantine-color-violet-6)" />
          <Box>
            <Title order={3} c="violet.7">Admin Dashboard</Title>
            <Text c="dimmed" size="sm">Welcome, {user?.name}</Text>
          </Box>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} color="violet">
<Tabs.List mb="lg">
<Tabs.Tab value="records" leftSection={<IconClipboardList size={16} />}>All Records</Tabs.Tab>
<Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>Analytics</Tabs.Tab>
<Tabs.Tab value="ai" leftSection={<IconBrain size={16} />}>AI Reports</Tabs.Tab>
</Tabs.List>

{/* Records Tab */}
<Tabs.Panel value="records">
<Paper shadow="sm" radius="lg" p="xl" withBorder>
<SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} mb="md">

<TextInput placeholder="Search..." leftSection={<IconSearch size={14} />}//search input for filtering submissions
value={filters.search}
onChange={(e) => setFilters({ ...filters, search: e.target.value })} />

<TextInput placeholder="Region" value={filters.region}//region filter input
onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
<Select placeholder="Status" clearable
data={[
{ value: "pending", label: "Pending" },
{ value: "in-progress", label: "In Progress" },
{ value: "completed", label: "Completed" },
]}
value={filters.status}
onChange={(val) => setFilters({ ...filters, status: val || "" })} />
<Select placeholder="Activity" clearable
data={["training","distribution","survey","meeting","other"].map((a) => ({
value: a, label: a.charAt(0).toUpperCase() + a.slice(1),
}))}
value={["training","distribution","survey","meeting","other",""].includes(filters.activityType) ? filters.activityType : "other"}
onChange={(val) => setFilters({ ...filters, activityType: val || "", customActivity: "" })} />
{filters.activityType === "other" && (
  <TextInput placeholder="Specify activity..." value={filters.customActivity || ""}//input for custom activity type when "other" is selected
    onChange={(e) => setFilters({ ...filters, customActivity: e.target.value, activityType: e.target.value })} />
)}
<DateInput placeholder="From date" value={filters.startDate} clearable
onChange={(val) => setFilters({ ...filters, startDate: val })} />
<Button color="violet" leftSection={<IconSearch size={14} />}
onClick={fetchSubmissions}>Search</Button>
</SimpleGrid>

{loading ? (
<Center py="xl"><Loader color="violet" /></Center>
) : submissions.length === 0 ? (
<Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
No submissions found.
</Alert>
) : (
<Box style={{ overflowX: "auto" }}>
<Table striped highlightOnHover withTableBorder withColumnBorders>
<Table.Thead>
<Table.Tr>
<Table.Th>Date</Table.Th><Table.Th>Worker</Table.Th>
<Table.Th>Region</Table.Th><Table.Th>Activity</Table.Th>
<Table.Th>Location</Table.Th><Table.Th>Beneficiaries</Table.Th>
<Table.Th>Status</Table.Th><Table.Th>Details</Table.Th>
</Table.Tr>
</Table.Thead>
<Table.Tbody>
{submissions.map((s) => (
<Table.Tr key={s._id}>
<Table.Td>{dayjs(s.date).format("DD MMM YYYY")}</Table.Td>
<Table.Td>
<Text size="sm" fw={500}>{s.workerName}</Text>
<Text size="xs" c="dimmed">{s.workerEmail}</Text>
</Table.Td>
<Table.Td>{s.region}</Table.Td>
<Table.Td><Badge variant="light" color="violet" size="sm">{s.activityType}</Badge></Table.Td>
<Table.Td>{s.location}</Table.Td>
<Table.Td>{s.beneficiaryCount} {s.beneficiaryType}</Table.Td>
<Table.Td><Badge color={STATUS_COLORS[s.status]} size="sm">{s.status}</Badge></Table.Td>
<Table.Td>
<ActionIcon variant="light" color="violet" size="sm"
onClick={() => handleViewDetails(s)}>
<IconEye size={14} />
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

{/* Analytics Tab */}
<Tabs.Panel value="analytics">
<SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
<Paper shadow="sm" radius="lg" p="xl" withBorder>
<Title order={5} mb="md" c="gray.7">Submissions by Region</Title>
{barData.length === 0 ? <Text c="dimmed" size="sm">No data</Text> : (
<BarChart h={250} data={barData} dataKey="name"
series={[{ name: "Submissions", color: "violet.6" }]} tickLine="y" />
)}
</Paper>
<Paper shadow="sm" radius="lg" p="xl" withBorder>
<Title order={5} mb="md" c="gray.7">Activity Type Breakdown</Title>
{pieData.length === 0 ? <Text c="dimmed" size="sm">No data</Text> : (
<PieChart h={250} data={pieData} withLabels withTooltip labelsType="percent" />//pie chart for activity type distribution
)}
</Paper>
<Paper shadow="sm" radius="lg" p="xl" withBorder>
<Title order={5} mb="md" c="gray.7">Status Overview</Title>
<Stack gap="sm">
{[
{ label: "Completed", value: completedCount, color: "green" },
{ label: "In Progress", value: submissions.filter((s) => s.status === "in-progress").length, color: "blue" },
{ label: "Pending", value: pendingCount, color: "yellow" },
].map((item) => (
<Box key={item.label}>
<Group justify="space-between" mb={4}>
<Text size="sm">{item.label}</Text>
<Text size="sm" fw={600}>{item.value}</Text>
</Group>
<Progress
value={submissions.length ? (item.value / submissions.length) * 100 : 0}
color={item.color} radius="xl" size="md" />
</Box>
))}
</Stack>
</Paper>
<Paper shadow="sm" radius="lg" p="xl" withBorder>
<Title order={5} mb="md" c="gray.7">Region Engagement</Title>
<Stack gap="xs">
{Object.entries(regionMap).sort((a, b) => b[1] - a[1]).map(([region, count]) => (
<Group key={region} justify="space-between">
<Group gap="xs">
<IconMapPin size={14} color="var(--mantine-color-violet-6)" />
<Text size="sm">{region}</Text>
</Group>
<Badge color="violet" variant="light">{count} submissions</Badge>
</Group>
))}
{Object.keys(regionMap).length === 0 && <Text c="dimmed" size="sm">No data</Text>}
</Stack>
</Paper>
</SimpleGrid>
</Tabs.Panel>

{/* AI Tab */}
<Tabs.Panel value="ai">
<Paper shadow="sm" radius="lg" p="xl" withBorder mb="lg">
<Group mb="md">
<IconBrain size={24} color="var(--mantine-color-violet-6)" />
<Title order={5} c="gray.7">AI Summary Report Generator</Title>
</Group>
<Text size="sm" c="dimmed" mb="md">
Select an optional date range and generate an AI-powered summary with actionable insights.
</Text>
<Group mb="md" align="flex-end">
<DateInput label="From Date (optional)" placeholder="Start date" clearable
value={aiDates.start} onChange={(val) => setAiDates({ ...aiDates, start: val })} />
<DateInput label="To Date (optional)" placeholder="End date" clearable
value={aiDates.end} onChange={(val) => setAiDates({ ...aiDates, end: val })} />
<Button color="violet" leftSection={<IconBrain size={16} />}
onClick={handleAiSummary} loading={aiLoading}>
Generate AI Report
</Button>
</Group>
</Paper>

{aiLoading && (
<Center py="xl">
<Stack align="center">
<Loader color="violet" size="lg" />
<Text c="dimmed">Generating AI insights...</Text>
</Stack>
</Center>
)}

{aiResult && !aiLoading && (
<Stack gap="lg">
<Paper shadow="sm" radius="lg" p="xl" withBorder
style={{ borderLeft: "4px solid var(--mantine-color-violet-6)" }}>
<Group mb="sm">
<IconBrain size={20} color="var(--mantine-color-violet-6)" />
<Title order={5} c="violet.7">Executive Summary</Title>
</Group>
<Text size="sm" style={{ lineHeight: 1.8 }}>{aiResult.summary}</Text>
</Paper>

{aiResult.stats && (
<SimpleGrid cols={{ base: 2, sm: 4 }}>
{[
{ label: "Total Submissions", value: aiResult.stats.totalSubmissions },
{ label: "Beneficiaries", value: aiResult.stats.totalBeneficiaries?.toLocaleString() },
{ label: "Top Region", value: aiResult.stats.topRegion || "N/A" },
{ label: "Low Engagement", value: aiResult.stats.lowEngagementRegion || "N/A" },
].map((s) => (
<Card key={s.label} shadow="sm" radius="lg" withBorder>
<Text size="xl" fw={700} c="violet.7">{s.value}</Text>
<Text size="xs" c="dimmed">{s.label}</Text>
</Card>
))}
</SimpleGrid>
)}

{aiResult.insights?.length > 0 && (
<Paper shadow="sm" radius="lg" p="xl" withBorder>
<Group mb="md">
<IconBulb size={20} color="var(--mantine-color-yellow-6)" />
<Title order={5} c="gray.7">Actionable Insights</Title>
</Group>
<List spacing="sm" icon={
<ThemeIcon color="yellow" variant="light" size="sm" radius="xl">
<IconBulb size={12} />
</ThemeIcon>
}>
{aiResult.insights.map((insight, i) => (
<List.Item key={i}><Text size="sm">{insight}</Text></List.Item>
))}
</List>
</Paper>
)}
</Stack>
)}
</Tabs.Panel>
</Tabs>
</Container>

{/* View Detail Modal */}
<Modal opened={viewOpened} onClose={closeView} title="Submission Details"
centered size="lg" radius="lg">
{viewSub && (
<Stack gap="md">
<SimpleGrid cols={2}>
<Box>
<Text size="xs" c="dimmed" fw={600}>WORKER</Text>
<Text size="sm" fw={500}>{viewSub.workerName}</Text>
<Text size="xs" c="dimmed">{viewSub.workerEmail}</Text>
</Box>
<Box><Text size="xs" c="dimmed" fw={600}>REGION</Text><Text size="sm">{viewSub.region}</Text></Box>
<Box>
<Text size="xs" c="dimmed" fw={600}>ACTIVITY TYPE</Text>
<Badge color="violet" variant="light">{viewSub.activityType}</Badge>
</Box>
<Box>
<Text size="xs" c="dimmed" fw={600}>DATE</Text>
<Text size="sm">{dayjs(viewSub.date).format("DD MMMM YYYY")}</Text>
</Box>
<Box><Text size="xs" c="dimmed" fw={600}>LOCATION</Text><Text size="sm">{viewSub.location}</Text></Box>
<Box>
<Text size="xs" c="dimmed" fw={600}>STATUS</Text>
<Badge color={STATUS_COLORS[viewSub.status]}>{viewSub.status}</Badge>
</Box>
<Box>
<Text size="xs" c="dimmed" fw={600}>BENEFICIARIES</Text>
<Text size="sm">{viewSub.beneficiaryCount} {viewSub.beneficiaryType}</Text>
</Box>
<Box>
<Text size="xs" c="dimmed" fw={600}>SUBMITTED</Text>
<Text size="sm">{dayjs(viewSub.createdAt).format("DD MMM YYYY HH:mm")}</Text>
</Box>
</SimpleGrid>
<Divider />
<Box>
<Text size="xs" c="dimmed" fw={600} mb={4}>DESCRIPTION</Text>
<Text size="sm">{viewSub.description}</Text>
</Box>
{viewSub.issues && (
<Box>
<Text size="xs" c="dimmed" fw={600} mb={4}>ISSUES</Text>
<Alert icon={<IconAlertTriangle size={14} />} color="orange" variant="light">
{viewSub.issues}
</Alert>
</Box>
)}
{viewSub.remark && (
<Box>
<Text size="xs" c="dimmed" fw={600} mb={4}>REMARK</Text>
<Text size="sm" c="gray.6">{viewSub.remark}</Text>
</Box>
)}
{viewSub.worker && typeof viewSub.worker === "object" && (
<>
<Divider />
<Box>
<Text size="xs" c="dimmed" fw={600} mb={4}>WORKER PROFILE</Text>
<SimpleGrid cols={2}>
<Text size="sm">Phone: {viewSub.worker.phone || "—"}</Text>
<Text size="sm">Region: {viewSub.worker.region || "—"}</Text>
</SimpleGrid>
</Box>
</>
)}
</Stack>
)}
</Modal>
</Box>
);
}
