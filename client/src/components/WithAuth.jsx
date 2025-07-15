import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { options, METHOD_ENUM, SERVER_ADDRESS } from "../api/util";

const WithAuth = (WrappedComponent) => {
  return function ProtectedComponent(props) {
    const { user, setUser, setUserSettings } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
      if (!user) {
        fetch(`${SERVER_ADDRESS}/check-session`, {
          ...options(METHOD_ENUM.GET),
          credentials: "include",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.id) {
              setUser({
                id: data.id,
                username: data.username,
                email: data.email,
              });
              setUserSettings(data.settings);
            } else {
              navigate("/login");
            }
          })
          .catch(() => {
            navigate("/login");
          });
      }
    }, [user, setUser, navigate]);

    if (!user) {
      return <p className="auth-loading">Loading...</p>;
    }

    return <WrappedComponent {...props} />;
  };
};

export default WithAuth;
