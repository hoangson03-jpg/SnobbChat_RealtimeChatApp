import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "../ui/label"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router"
import { toast } from 'sonner'
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/useAuthStore"



export function VerifyOTPForm({ className, ...props }: React.ComponentProps<"div">) {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP, loading } = useAuthStore();
  const email = location.state?.email;

    useEffect(() => {
    if (!email) {
      toast.error("Thiếu thông tin email, vui lòng đăng ký lại!");
      navigate("/signup");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!email) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
        toast.error("Mã OTP phải gồm 6 chữ số");
        return;
    }

    const success = await verifyOTP(email, otp);
    if (success) {
        navigate("/signin");
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0 || loading) return;
    const success = await resendOTP(email);
    if (success) {
        setCountdown(60); 
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
      <div className={cn("flex flex-col gap-6 w-full max-w-md", className)} {...props}>
        <Card className="overflow-hidden border-border shadow-xl rounded-xl bg-card">
          <CardContent className="p-8 md:p-10">
            <form className="flex flex-col gap-8" onSubmit={onSubmit}>
              
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                    <img src="/logo.svg" alt="logo" className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Xác thực Email</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Mã OTP đã được gửi đến hòm thư: <br/> 
                  <span className="font-semibold text-foreground italic">{email}</span>
                </p>
              </div>

              <div className="flex flex-col gap-4">
                  <Label htmlFor="otp" className="text-sm font-medium text-center uppercase tracking-widest text-muted-foreground">
                    Nhập mã 6 chữ số
                  </Label>
                  <Input
                    className="rounded-lg text-center text-3xl font-bold tracking-[0.75em] h-16 border-2 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm"
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    disabled={loading}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    Không nhận được mã? {" "}
                    <button 
                      type="button" 
                      onClick={handleResendOTP}
                      disabled={countdown > 0 || loading}
                      className={cn(
                          "text-primary underline underline-offset-4 transition-all",
                          (countdown > 0 || loading) ? "opacity-50 cursor-not-allowed" : "hover:font-semibold"
                      )}
                    >
                      {countdown > 0 ? `Gửi lại sau (${countdown}s)` : "Gửi lại mã"}
                    </button>
                  </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98]"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Đang xử lý...
                    </div>
                ) : "Xác nhận tài khoản"}
              </Button>

              <div className="text-center text-sm">
                <button 
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Quay lại trang đăng ký
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground px-8">
            Vui lòng kiểm tra cả trong hòm thư rác (Spam) nếu không thấy mã gửi về.
        </p>
      </div>
    </div>
  )
}