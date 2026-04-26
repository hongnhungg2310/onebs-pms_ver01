import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses recovery hash automatically; wait for session
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) { toast.error("Mật khẩu tối thiểu 8 ký tự"); return; }
    if (pwd !== pwd2) { toast.error("Xác nhận mật khẩu không khớp"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã đặt lại mật khẩu");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-6">
      <Card className="w-full max-w-md p-8 shadow-brand">
        <div className="flex justify-center mb-6"><Logo className="h-10" /></div>
        <h1 className="text-2xl font-bold text-center">Đặt lại mật khẩu</h1>
        {!ready ? (
          <p className="text-sm text-muted-foreground text-center mt-4">Đang xác thực liên kết...</p>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Mật khẩu mới</Label>
              <Input type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Xác nhận mật khẩu mới</Label>
              <Input type="password" required value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
              {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
