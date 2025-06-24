import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

const routes = createBrowserRouter([
  {path: "/", element: <Login/>},
  { path: "/signup", element: <Signup/> },
  { path: "/login", element: <Login/> },
]);




function App() {
  return (
    <>
      <RouterProvider router={routes} />
    </>
  );
}

export default App;
