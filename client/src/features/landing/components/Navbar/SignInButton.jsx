import { Link } from "react-router-dom";
function SignInButton() {

  return (
    
    <Link
      to="/auth/signin"
      className="text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
    >
      Sign In
    </Link>
  );
}

export default SignInButton;