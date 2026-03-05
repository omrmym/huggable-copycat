import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  usePoliceStations,
  useCreatePoliceStation,
  useUpdatePoliceStation,
  useDeletePoliceStation,
  PoliceStation,
} from '@/hooks/usePoliceStations';
import { useHasPermission } from '@/hooks/useHasPermission';

export default function PoliceStationPage() {
  const { hasPermission } = useHasPermission();
  const canManage = hasPermission('users.police_station.manage');
  const { data: stations = [], isLoading } = usePoliceStations();
  const createStation = useCreatePoliceStation();
  const updateStation = useUpdatePoliceStation();
  const deleteStation = useDeletePoliceStation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<PoliceStation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ name: '', is_active: true });
    setEditingStation(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (station: PoliceStation) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      is_active: station.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      is_active: formData.is_active,
    };

    if (editingStation) {
      await updateStation.mutateAsync({ id: editingStation.id, ...payload });
    } else {
      await createStation.mutateAsync(payload);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (station: PoliceStation) => {
    if (confirm(`Are you sure you want to delete "${station.name}"?`)) {
      await deleteStation.mutateAsync(station.id);
    }
  };

  const isPending = createStation.isPending || updateStation.isPending;

  return (
    <DashboardLayout title="Police Station" subtitle="Manage police station assignments">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Police Stations
            </CardTitle>
            <CardDescription>
              Define and manage police station coverage areas.
            </CardDescription>
          </div>
          {canManage && (
            <Button className="bg-gradient-primary text-primary-foreground" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Police Station
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : stations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No police stations defined yet.</p>
              <p className="text-sm">Add police stations to organize users by jurisdiction.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                    {canManage && <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station) => (
                    <tr key={station.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{station.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          station.is_active ? 'bg-online/20 text-online' : 'bg-muted text-muted-foreground'
                        }`}>
                          {station.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(station)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(station)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingStation ? 'Edit Police Station' : 'Add Police Station'}</DialogTitle>
            <DialogDescription>
              {editingStation ? 'Update police station details.' : 'Create a new police station.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Police station name"
                className="bg-secondary border-border"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={isPending || !formData.name.trim()}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingStation ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}