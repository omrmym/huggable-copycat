import { useState } from "react";
import { useAllConnectivityTypes, useCreateConnectivityType, useUpdateConnectivityType, useDeleteConnectivityType } from "@/hooks/useConnectivityTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ConnectivityTypeManagement() {
  const { data: connectivityTypes = [], isLoading } = useAllConnectivityTypes();
  const createConnectivityType = useCreateConnectivityType();
  const updateConnectivityType = useUpdateConnectivityType();
  const deleteConnectivityType = useDeleteConnectivityType();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<{ id: string; name: string; code: string; is_active: boolean } | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormData({ name: "", code: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (type: { id: string; name: string; code: string | null; is_active: boolean }) => {
    setEditingType({ id: type.id, name: type.name, code: type.code || "", is_active: type.is_active });
    setFormData({ name: type.name, code: type.code || "" });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (editingType) {
      await updateConnectivityType.mutateAsync({
        id: editingType.id,
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
      });
    } else {
      await createConnectivityType.mutateAsync({
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
      });
    }

    setIsDialogOpen(false);
    setFormData({ name: "", code: "" });
    setEditingType(null);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await updateConnectivityType.mutateAsync({
      id,
      is_active: !currentStatus,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteConnectivityType.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wifi className="w-5 h-5 text-primary" />
          Connectivity Types
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit Connectivity Type" : "Add Connectivity Type"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., Fiber Optic"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Code (optional)</Label>
                <Input
                  placeholder="e.g., fiber"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name.trim() || createConnectivityType.isPending || updateConnectivityType.isPending}
              >
                {(createConnectivityType.isPending || updateConnectivityType.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingType ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connectivityTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No connectivity types found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              connectivityTypes.map((type) => (
                <TableRow key={type.id} className="border-border">
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-muted-foreground">{type.code || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={() => handleToggleActive(type.id, type.is_active)}
                      />
                      <Badge variant={type.is_active ? "default" : "secondary"}>
                        {type.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(type)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Connectivity Type</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{type.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(type.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
