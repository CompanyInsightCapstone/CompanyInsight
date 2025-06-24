import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useContext } from "react";
import { METHOD_ENUM, options, SERVER_ADDRESS } from "../api/util";

export default function Header() {
    const { user, setUser} = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogout= (event) => {
        event.preventDefault();
        try {
            const response = fetch(`${SERVER_ADDRESS}/logout`, {...options(METHOD_ENUM.GET), credentials: "include"})
            if (response.ok) {
                setUser(null);
                navigate("/login");
            } else {
                console.log(response)
            }
        } catch (error) {
            console.log(error)
        }
    }
    return (
        <header>
        <h1>Company Insights</h1>
        <img src="NYSETradingFloor.jpg" alt="NYSETradingFloor" />
        <button onClick={handleLogout}>Logout</button>
        </header>
  );
}
