import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { signUp } from '@/features/auth/authSlice'
import { useForm } from 'react-hook-form'

function SignUpPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const dispatch = useDispatch()

  // 2. This only runs if RHF validates everything successfully
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      await dispatch(signUp(data)).unwrap();

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[140px] rounded-full" />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <header className="px-6 py-5 flex items-center justify-between border-b border-border">
        <Link
          to="/"
          className="font-display text-2xl tracking-tighter uppercase text-primary"
        >
          Videoflow
        </Link>

        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to site
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-widest uppercase mb-6">
              Create Account
            </div>

            <h1 className="font-display text-4xl uppercase tracking-tight">
              Join The Studio
            </h1>

            <p className="text-muted-foreground mt-3 text-sm">
              Start hosting cinematic-grade video in minutes.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-8">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Email Field Group */}
              {/* Email Field Group */}
              <div className="flex flex-col">
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Please enter a valid email",
                    },
                  })}
                  type="email"
                  placeholder="Email"
                  className="w-full h-11 px-4 rounded-md bg-background border border-border"
                />
                {/* The container always exists, keeping a fixed height of 20px (h-5) */}
                <div className="h-5 min-h-[20px] pt-1 pl-1">
                  <p className={`text-xs text-red-400 transition-opacity duration-200 ${errors.email ? "opacity-100" : "opacity-0"}`}>
                    {errors.email?.message || ""}
                  </p>
                </div>
              </div>

              {/* Password Field Group */}
              <div className="flex flex-col">
                <input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type="password"
                  placeholder="Password"
                  className="w-full h-11 px-4 rounded-md bg-background border border-border"
                />
                {/* Same layout reservoir here */}
                <div className="h-5 min-h-[20px] pt-1 pl-1">
                  <p className={`text-xs text-red-400 transition-opacity duration-200 ${errors.password ? "opacity-100" : "opacity-0"}`}>
                    {errors.password?.message || ""}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50
disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link
                to="/auth/signin"
                className="text-foreground hover:text-primary"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SignUpPage;