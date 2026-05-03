import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "../ui/label"
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from '@hookform/resolvers/zod'; 
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router"
import { Link } from "react-router-dom"


const signInSchema = z.object({
  username: z.string().min(2, 'Tên đăng nhập phải có 6 ký tự đổ lên'),
  password: z.string().min(2, 'Mật khẩu phải có ít nhất 8 ký tự')
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

    const {signIn} = useAuthStore();

    const navigate = useNavigate();

    const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema)
      });

      const onSubmit = async(data: SignInFormValues) => {
      // gọi api từ backend
      const {username, password} = data;
      await signIn(username, password);
      navigate("/");

  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border rounded-md">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            {/* header - logo */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center gap-2"> {/* flex flex - col để xếp nội dung theo cột/ items-center để căn giữa theo chiều ngang, text-center để căn giữa chữ và gap-2 giúp tạo khoảng cách nhỏ giữa các phần tử */}
              <a href="/"
              className="mx-auto block w-fit text-center"> {/* margin x auto để căn giữa theo chiều ngang, block để phần tử chiếm 1 dòng, width fit để scale kích thước, text-center căn giữa nội dung*/}
                <img src="/logo.svg" alt="logo" />
              </a>
              <h1 className="text-2xl font-bold">
                Chào mừng bạn
              </h1>
              <p className="text-muted-foreground text-balance">
                Đăng nhập vào SnobbChat và bắt đầu trò chuyện nào!
              </p>
              </div>

              {/* username */}
              <div className="flex flex-col gap-3">
                  <Label htmlFor="username" className="block text-sm">
                    Tên đăng nhập
                  </Label>
                  <Input
                  className="rounded-md"
                  type="text"
                  id="username"
                  {...register("username")}
                  />
                  {errors.username && (
                    <p className="error-message">
                      {errors.username.message}
                    </p>
                  )}
                </div>

              {/* password */}
              <div className="flex flex-col gap-3">
                  <Label htmlFor="password" className="block text-sm">
                    Mật khẩu
                  </Label>
                  <Input
                  className="rounded-md"
                  type="password"
                  id="password"
                  {...register("password")}
                  />
                  {errors.password && (
                    <p className="error-message">
                      {errors.password.message}
                    </p>
                  )}
                </div>

              {/* nút đăng nhập */}
              <Button
              type="submit"
              className="w-full h-10 rounded-md cursor-pointer"
              disabled={isSubmitting}
              >
                Đăng nhập
              </Button>
              <div className="text-center text-sm">
                  Chưa có tài khoản? {""}
                  <Link to="/signup"
                  className="underline underline-offset-4">
                    Đăng ký 
                  </Link>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}