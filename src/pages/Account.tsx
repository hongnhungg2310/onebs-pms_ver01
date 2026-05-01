import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useStore, roleLabel } from "@/lib/store";
import { LogOut, Save, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function Account() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, logout, changePassword } = useStore();
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [pwd, setPwd] = useState({ old: "", new1: "", new2: "" });

  if (!currentUser) return null;
  const initials = currentUser.name.split(" ").slice(-2).map((n) => n[0]).join("");

  const saveProfile = async () => {
    await updateProfile({ name, email });
    toast.success("Đã cập nhật thông tin");
  };
  const changePwd = async () => {
    if (!pwd.new1) { toast.error("Vui lòng nhập mật khẩu mới"); return; }
    if (pwd.new1 !== pwd.new2) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    if (pwd.new1.length < 8) { toast.error("Mật khẩu mới tối thiểu 8 ký tự"); return; }
    const ok = await changePassword(pwd.new1);
    if (ok) {
      setPwd({ old: "", new1: "", new2: "" });
      toast.success("Đã đổi mật khẩu");
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2 bg-gradient-card">
        <CardContent className="p-6 text-center">
          <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20 shadow-glow">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <h3 className="mt-4 font-semibold text-lg">{currentUser.name}</h3>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          <Badge className="mt-3 bg-primary/15 text-primary">{roleLabel[currentUser.role]}</Badge>
          <div className="mt-6 pt-6 border-t">
            <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive" onClick={() => { logout(); navigate("/login"); }}>
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <Tabs defaultValue="profile">
          <CardHeader className="pb-3">
            <TabsList className="inline-flex w-auto self-start">
              <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
              <TabsTrigger value="password">Đổi mật khẩu</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-0">
            <TabsContent value="profile" className="mt-0 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label className="text-xs">Họ và tên</Label><Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input className="h-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Vai trò</Label><Input className="h-9" value={roleLabel[currentUser.role]} disabled /></div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={saveProfile} className="bg-gradient-primary gap-2"><Save className="h-4 w-4" /> Lưu thay đổi</Button>
              </div>
            </TabsContent>
            <TabsContent value="password" className="mt-0 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Mật khẩu hiện tại</Label><Input className="h-9" type="password" value={pwd.old} onChange={(e) => setPwd({ ...pwd, old: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Mật khẩu mới</Label><Input className="h-9" type="password" value={pwd.new1} onChange={(e) => setPwd({ ...pwd, new1: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Xác nhận mật khẩu mới</Label><Input className="h-9" type="password" value={pwd.new2} onChange={(e) => setPwd({ ...pwd, new2: e.target.value })} /></div>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={changePwd} className="bg-gradient-primary gap-2"><KeyRound className="h-4 w-4" /> Đổi mật khẩu</Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
