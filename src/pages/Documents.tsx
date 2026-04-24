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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore, Document } from "@/lib/store";
import { Plus, Search, Pencil, Trash2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const categories = ["Quy trình", "Template", "Tiêu chuẩn", "Hướng dẫn", "Khác"];

interface Form { name: string; category: string; size: string; uploadedBy: string; }

export default function Documents() {
  const { documents, currentUser, addDocument, updateDocument, deleteDocument } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [form, setForm] = useState<Form>({ name: "", category: "Quy trình", size: "—", uploadedBy: currentUser?.name || "" });

  const filtered = useMemo(() => documents.filter((d) => {
    const ms = d.name.toLowerCase().includes(search.toLowerCase());
    const mc = filter === "all" || d.category === filter;
    return ms && mc;
  }), [documents, search, filter]);

  const openCreate = () => { setEditing(null); setForm({ name: "", category: "Quy trình", size: "—", uploadedBy: currentUser?.name || "" }); setOpen(true); };
  const openEdit = (d: Document) => { setEditing(d); setForm({ name: d.name, category: d.category, size: d.size, uploadedBy: d.uploadedBy }); setOpen(true); };
  const submit = () => {
    if (!form.name.trim()) { toast.error("Nhập tên tài liệu"); return; }
    if (editing) { updateDocument(editing.id, form); toast.success("Đã cập nhật"); }
    else { addDocument(form); toast.success("Đã tải lên"); }
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm tài liệu..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-primary gap-2"><Plus className="h-4 w-4" /> Tải tài liệu</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Sửa tài liệu" : "Thêm tài liệu"}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2"><Label>Tên tài liệu *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="vd: Hướng dẫn sử dụng.pdf" /></div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Kích thước</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="vd: 1.2 MB" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button onClick={submit} className="bg-gradient-primary">{editing ? "Lưu" : "Thêm"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tài liệu</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead>Người tải</TableHead>
                <TableHead>Ngày tải</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.size}</TableCell>
                  <TableCell className="text-sm">{d.uploadedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.uploadedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Xóa tài liệu?</AlertDialogTitle><AlertDialogDescription>Hành động không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={() => { deleteDocument(d.id); toast.success("Đã xóa"); }} className="bg-destructive">Xóa</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Không có tài liệu.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
