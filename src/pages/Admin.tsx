import { useState } from "react";
import { useGym } from "@/context/GymContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Trash2, LayoutDashboard, TrendingUp, Dumbbell, ClipboardList, Trophy, CalendarDays, Wrench, Megaphone } from "lucide-react";
import EquipmentTicketList from "@/components/EquipmentTicketList";
import CapacityReminderAlert from "@/components/CapacityReminderAlert";
import CapacityTrends from "@/components/CapacityTrends";
import ReservationRequestsAdmin from "@/components/ReservationRequestsAdmin";
import AdminKpiCards from "@/components/admin/AdminKpiCards";
import AdminOverview from "@/components/admin/AdminOverview";
import ClassesManager from "@/components/admin/ClassesManager";
import ClassPopularity from "@/components/admin/ClassPopularity";
import StudentAttendance from "@/components/admin/StudentAttendance";
import EventsManager from "@/components/admin/EventsManager";
import IntramuralsSummary from "@/components/admin/IntramuralsSummary";

const Admin = () => {
  const { announcement, setAnnouncement, clearAnnouncement } = useGym();
  const [draft, setDraft] = useState(announcement);
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncement(draft.trim());
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleClear = () => {
    clearAnnouncement();
    setDraft("");
  };

  return (
    <div className="container max-w-7xl py-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Operations across capacity, classes, reservations, intramurals, and events.</p>
        </div>
      </div>

      <div className="mt-5">
        <CapacityReminderAlert />
      </div>

      <div className="mt-5">
        <AdminKpiCards />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="capacity" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Capacity</TabsTrigger>
          <TabsTrigger value="classes" className="gap-1.5"><Dumbbell className="h-3.5 w-3.5" /> Classes</TabsTrigger>
          <TabsTrigger value="reservations" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Reservations</TabsTrigger>
          <TabsTrigger value="intramurals" className="gap-1.5"><Trophy className="h-3.5 w-3.5" /> Intramurals</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Events</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1.5"><Wrench className="h-3.5 w-3.5" /> Tickets</TabsTrigger>
          <TabsTrigger value="announcement" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Announcement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <AdminOverview />
        </TabsContent>

        <TabsContent value="capacity" className="mt-4">
          <CapacityTrends />
        </TabsContent>

        <TabsContent value="classes" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Manage classes</CardTitle>
              <p className="text-xs text-muted-foreground">Edit times and instructors, or cancel classes.</p>
            </CardHeader>
            <CardContent>
              <ClassesManager />
            </CardContent>
          </Card>
          <ClassPopularity />
          <StudentAttendance />
        </TabsContent>

        <TabsContent value="reservations" className="mt-4">
          <ReservationRequestsAdmin />
        </TabsContent>

        <TabsContent value="intramurals" className="mt-4">
          <IntramuralsSummary />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <EventsManager />
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <EquipmentTicketList mode="admin" />
        </TabsContent>

        <TabsContent value="announcement" className="mt-4">
          <form onSubmit={handleSave} className="max-w-md space-y-4">
            <div>
              <Label htmlFor="announcement">Announcement</Label>
              <Textarea
                id="announcement"
                rows={4}
                placeholder="e.g. The pool area is closed for maintenance until Friday."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">Save Announcement</Button>
              {announcement && (
                <Button type="button" variant="outline" onClick={handleClear}>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Clear
                </Button>
              )}
            </div>

            {success && (
              <div className="flex items-center gap-2 rounded-md bg-capacity-low-bg p-3 text-sm font-medium text-capacity-low">
                <CheckCircle className="h-4 w-4" /> Announcement saved!
              </div>
            )}
          </form>

          {announcement && (
            <div className="mt-6 max-w-md rounded-lg border border-border bg-secondary/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Announcement</p>
              <p className="mt-2 text-sm text-foreground">{announcement}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
