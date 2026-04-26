import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Liên kết đặt lại đã được gửi");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-6">
      <Card className="w-full max-w-md p-8 shadow-brand">
        <div className="flex justify-center mb-6"><Logo className="h-10" /></div>
        {!sent ? (
          <>
            <h1 className="text-2xl font-bold text-center">Quên mật khẩu</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
            </p>
            <form onSubmit={submit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@onebs.vn" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
                {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-secondary/15 flex items-center justify-center">
              <MailCheck className="h-7 w-7 text-secondary" />
            </div>
            <h2 className="text-xl font-semibold">Đã gửi email</h2>
            <p className="text-sm text-muted-foreground">
              Nếu địa chỉ <strong className="text-foreground">{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn trong vài phút.
            </p>
          </div>
        )}
        <button onClick={() => navigate("/login")} className="mt-6 flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary transition-smooth">
          <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
        </button>
      </Card>
    </div>
  );
}
