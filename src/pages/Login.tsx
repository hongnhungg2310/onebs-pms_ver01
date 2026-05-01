import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("an.nguyen@onebs.vn");
  const [password, setPassword] = useState("Demo@1234");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message === "Invalid login credentials" ? "Email hoặc mật khẩu không đúng" : error.message);
      return;
    }
    // Check locked status
    const { data: profile } = await supabase.from("profiles").select("locked").eq("id", data.user.id).maybeSingle();
    if (profile?.locked) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("Tài khoản đã bị khóa. Liên hệ quản trị viên.");
      return;
    }
    setLoading(false);
    toast.success("Đăng nhập thành công");
    navigate("/");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-hero relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative">
          <Logo className="h-12" />
        </div>
        <div className="relative space-y-4">
          <h2 className="text-4xl font-bold leading-tight">
            Hệ thống <span className="text-gradient-brand">Quản lý dự án CNTT</span>
          </h2>
          <p className="text-muted-foreground max-w-md">
            Nền tảng quản trị dự án nội bộ của OneBS — theo dõi tiến độ, công việc, tài liệu và đội nhóm trong một giao diện duy nhất.
          </p>
          <div className="flex gap-2 pt-4">
            <span className="h-2 w-12 rounded-full bg-accent" />
            <span className="h-2 w-12 rounded-full bg-primary" />
            <span className="h-2 w-12 rounded-full bg-secondary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground relative">© 2026 Công ty Cổ phần OneBS</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-brand border-border/50">
          <div className="lg:hidden mb-6 flex justify-center"><Logo className="h-10" /></div>
          <h1 className="text-2xl font-bold">Đăng nhập</h1>
          <p className="text-sm text-muted-foreground mt-1">Sử dụng tài khoản nhân sự OneBS để truy cập hệ thống.</p>

          <form onSubmit={submit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@onebs.vn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input id="password" type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm text-primary hover:underline">Quên mật khẩu?</button>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 transition-smooth">
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-6 rounded-md bg-muted/50 border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Tài khoản demo:</p>
            <p>Quản trị viên: an.nguyen@onebs.vn</p>
            <p>Quản lý dự án: binh.tran@onebs.vn</p>
            <p>Thành viên: cuong.le@onebs.vn</p>
            <p>Ban Giám đốc: giamdoc.hoang@onebs.vn</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
