import Header from "../components/Header";
import Footer from "../components/Footer";
import SignForm from "../components/SignForm";
import { LOGIN_PAGE_PROP } from "../utilities/constants";


export default function Login() {
  const handleFormSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <Header />
      <SignForm onSubmit={handleFormSubmit} props={LOGIN_PAGE_PROP}/>
      <Footer />
    </>
  );
}
