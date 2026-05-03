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


const signUpSchema = z.object({
  firstname: z.string().min(1, 'Họ bắt buộc phải có'),
  lastname: z.string().min(1, 'Tên bắt buộc phải có'),
  username: z.string().min(6, 'Tên đăng nhập phải có 6 ký tự đổ lên'),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
});

type SignUpFromValues = z.infer<typeof signUpSchema>;
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {signUp} = useAuthStore();

  const navigate = useNavigate();

  const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<SignUpFromValues>({
    resolver: zodResolver(signUpSchema)
  });

  const onSubmit = async(data: SignUpFromValues) => {
    const {firstname, lastname, username, email, password} = data;

    // gọi api từ backend  
    await signUp(username, password, email, firstname, lastname);

    navigate("/signin");
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
                Tạo mới tài khoản SnobbChat
              </h1>
              <p className="text-muted-foreground text-balance">
                Hãy bắt đầu cuộc trò chuyện bựa thôi nào
              </p>
              </div>

              {/* họ và tên*/}
              <div className="grid grid-cols-2 gap-3"> {/* grid grid-cols-2 để dùng grid chia làm 2 cột */}
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="block text-sm">
                    Họ
                  </Label>
                  <Input
                  className="rounded-md"
                  type="text"
                  id="firstname"
                  {...register("firstname")}
                  />
                  {errors.firstname && (
                    <p className="error-message">
                      {errors.firstname.message}
                    </p>
                  )}
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="lastname" className="block text-sm">
                    Tên
                  </Label>
                  <Input
                  className="rounded-md"
                  type="text"
                  id="lastname"
                  {...register("lastname")}
                  />
                  {errors.lastname && (
                    <p className="error-message">
                      {errors.lastname.message}
                    </p>
                  )}
                </div>
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
                  placeholder="nguyenvanA"
                  {...register("username")}
                  />
                  {errors.username && (
                    <p className="error-message">
                      {errors.username.message}
                    </p>
                  )}
                </div>

              {/* email */}
              <div className="flex flex-col gap-3">
                  <Label htmlFor="email" className="block text-sm">
                    Email
                  </Label>
                  <Input
                  className="rounded-md"
                  type="text"
                  id="email"
                  placeholder="johndoe@gmail.com"
                  {...register("email")}
                  />
                  {errors.email && (
                    <p className="error-message">
                      {errors.email.message}
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

              {/* nút đăng ký */}
              <Button
              type="submit"
              className="w-full h-10 rounded-md cursor-pointer"
              disabled={isSubmitting}
              >
                Tạo tài khoản
              </Button>

              <div className="text-center text-sm">
                Đã có tài khoản? {" "}
                <Link to="/signin"
                className="underline underline-offset-4">Đăng nhập</Link>

              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholderSignUp.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className="px-6 text-center text-xs text-balance *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-3"> {/* chọn toàn bộ thẻ a trong cụm diV này thì khi hover vào sẽ đổi màu sang primary */}
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a>{" "}
        và <a href="#">Chính sách bảo mật của chúng tôi</a>.
      </div>
    </div>
  )
}
