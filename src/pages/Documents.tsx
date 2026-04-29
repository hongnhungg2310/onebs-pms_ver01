import { useMemo, useRef, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore, Document } from "@/lib/store";
import { Plus, Search, Pencil, Trash2, FileText, Eye, Link as LinkIcon, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const categories = ["Quy trình", "Template", "Tiêu chuẩn", "Hướng dẫn", "Khác"];

interface Form {
  name: string;
  category: string;
  size: string;
  uploadedBy: string;
  kind: "file" | "link";
  url: string | null;
}

const formatBytes = (b: number) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

export default function Documents() {
  const { documents, currentUser, addDocument, updateDocument, deleteDocument } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [tab, setTab] = useState<"file" | "link">("file");
  const [uploading, setUploading] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Form>({
    name: "", category: "Quy trình", size: "—",
    uploadedBy: currentUser?.name || "", kind: "file", url: null,
  });

  const filtered = useMemo(() => documents.filter((d) => {
    const ms = d.name.toLowerCase().includes(search.toLowerCase());
    const mc = filter === "all" || d.category === filter;
    return ms && mc;
  }), [documents, search, filter]);

  const openCreate = () => {
    setEditing(null);
    setTab("file");
    setForm({ name: "", category: "Quy trình", size: "—", uploadedBy: currentUser?.name || "", kind: "file", url: null });
    setOpen(true);
  };
  const openEdit = (d: Document) => {
    setEditing(d);
    setTab(d.kind);
    setForm({ name: d.name, category: d.category, size: d.size, uploadedBy: d.uploadedBy, kind: d.kind, url: d.url });
    setOpen(true);
  };

  const handleFile = async (file: File) => {
    if (!currentUser) { toast.error("Cần đăng nhập"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("documents").upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (error) { toast.error(error.message); return; }
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      setForm((f) => ({
        ...f,
        name: f.name || file.name,
        size: formatBytes(file.size),
        url: data.publicUrl,
        kind: "file",
      }));
      toast.success("Đã tải file lên");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Nhập tên tài liệu"); return; }
    const payload: Form = { ...form, kind: tab };
    if (tab === "link") {
      if (!form.url || !/^https?:\/\//i.test(form.url)) {
        toast.error("Nhập đường dẫn hợp lệ (http/https)");
        return;
      }
    } else {
      if (!form.url) { toast.error("Hãy tải file lên"); return; }
    }
    if (editing) {
      await updateDocument(editing.id, payload);
      toast.success("Đã cập nhật");
    } else {
      await addDocument(payload);
      toast.success(tab === "link" ? "Đã thêm liên kết" : "Đã tải lên");
    }
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

            <Tabs value={tab} onValueChange={(v) => setTab(v as "file" | "link")} className="mt-2">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="file" className="gap-2"><Upload className="h-4 w-4" /> Tải file</TabsTrigger>
                <TabsTrigger value="link" className="gap-2"><LinkIcon className="h-4 w-4" /> Đính kèm link</TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label>Tệp tài liệu *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileRef}
                      type="file"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                      disabled={uploading}
                    />
                  </div>
                  {form.kind === "file" && form.url && (
                    <p className="text-xs text-muted-foreground truncate">Đã tải lên: {form.url.split("/").pop()}</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="link" className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label>Đường dẫn (Google Drive, Dropbox...) *</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={tab === "link" ? form.url ?? "" : ""}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-3 pt-2">
              <div className="space-y-2"><Label>Tên tài liệu *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="vd: Hướng dẫn sử dụng.pdf" /></div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
              <Button onClick={submit} disabled={uploading} className="bg-gradient-primary">{editing ? "Lưu" : "Thêm"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tài liệu</TableHead>
                <TableHead>Loại</TableHead>
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
                      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                        {d.kind === "link" ? <LinkIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.kind === "link" ? "secondary" : "outline"} className="gap-1">
                      {d.kind === "link" ? <><LinkIcon className="h-3 w-3" /> Link</> : <><FileText className="h-3 w-3" /> File</>}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.kind === "link" ? "—" : d.size}</TableCell>
                  <TableCell className="text-sm">{d.uploadedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.uploadedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Xem"
                        onClick={() => {
                          if (!d.url) { toast.error("Tài liệu không có đường dẫn"); return; }
                          if (d.kind === "link") window.open(d.url, "_blank", "noopener,noreferrer");
                          else setViewDoc(d);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
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
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Không có tài liệu.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b flex-row items-center justify-between space-y-0">
            <DialogTitle className="truncate">{viewDoc?.name}</DialogTitle>
            {viewDoc?.url && (
              <Button asChild size="sm" variant="outline" className="gap-2 mr-8">
                <a href={viewDoc.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Mở tab mới
                </a>
              </Button>
            )}
          </DialogHeader>
          <div className="flex-1 bg-muted/30">
            {viewDoc?.url && (
              <iframe
                src={viewDoc.url}
                className="w-full h-full"
                title={viewDoc.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
