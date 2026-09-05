import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const GoogleLoginButton = ({ role }) => {
  const googleButtonRef = useRef(null);

  const navigate = useNavigate();

  const { googleLogin } = useAuth();

  useEffect(() => {
    let interval;

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) {
        return false;
      }

      // Prevent duplicate rendering
      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

        callback: async (response) => {
          try {
            await googleLogin(response.credential, role);

            toast.success("Google login successful");

            navigate("dashboard");
          } catch (error) {
            toast.error(error.response?.data?.error || "Google login failed");
          }
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 400,
        text: "continue_with",
        shape: "rectangular",
      });

      return true;
    };

    if (!initializeGoogle()) {
      interval = setInterval(() => {
        if (initializeGoogle()) {
          clearInterval(interval);
        }
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [googleLogin, navigate, role]);

  return <div ref={googleButtonRef} className="w-full flex justify-center" />;
};

export default GoogleLoginButton;
