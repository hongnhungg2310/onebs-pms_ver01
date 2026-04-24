import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore, UserRole, roleLabel } from "@/lib/store";
import { Plus, Search, Lock, Unlock, Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function Users() {
  const { users, currentUser, addUser, updateUser, toggleLockUser } = useStore();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | UserRole>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "member" as UserRole });

  if (currentUser?.role !== "admin") {
    return (
      <Card className="p-12 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-3" />
        <h3 className="font-semibold">Không có quyền truy cập</h3>
        <p className="text-sm text-muted-foreground mt-1">Chỉ Quản trị viên mới có thể quản lý người dùng.</p>
      </Card>
    );
  }

  const filtered = useMemo(() => users.filter((u) => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const mr = filterRole === "all" || u.role === filterRole;
    return ms && mr;
  }), [users, search, filterRole]);

  const submit = () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error("Nhập đầy đủ thông tin"); return; }
    addUser(form);
    setForm({ name: "", email: "", role: "member" });
    setOpen(false);
    toast.success("Đã thêm người dùng");
  };

  const exportCsv = () => {
    const header = "Họ tên,Email,Vai trò,Trạng thái\n";
    const rows = users.map((u) => `"${u.name}","${u.email}","${roleLabel[u.role]}","${u.locked ? "Khóa" : "Hoạt động"}"`).join("\n");
    const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "danh-sach-nguoi-dung.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải danh sách");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm theo tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterRole} onValueChange={(v) => setFilterRole(v as any)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {(Object.keys(roleLabel) as UserRole[]).map((r) => <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> Tải danh sách</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary gap-2"><Plus className="h-4 w-4" /> Thêm người dùng</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Tạo người dùng mới</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2"><Label>Họ tên *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(roleLabel) as UserRole[]).map((r) => <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={submit} className="bg-gradient-primary">Tạo</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{u.name.split(" ").slice(-2).map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => { updateUser(u.id, { role: v as UserRole }); toast.success("Đã cập nhật vai trò"); }}>
                      <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(roleLabel) as UserRole[]).map((r) => <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {u.locked
                      ? <Badge className="bg-destructive/15 text-destructive">Đã khóa</Badge>
                      : <Badge className="bg-secondary/15 text-secondary">Hoạt động</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={u.locked ? "outline" : "ghost"} onClick={() => { toggleLockUser(u.id); toast.success(u.locked ? "Đã mở khóa" : "Đã khóa tài khoản"); }} className="gap-2">
                      {u.locked ? <><Unlock className="h-3.5 w-3.5" /> Mở khóa</> : <><Lock className="h-3.5 w-3.5" /> Khóa</>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Không có người dùng.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
