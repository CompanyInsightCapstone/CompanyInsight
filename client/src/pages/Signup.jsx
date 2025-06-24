import Header from "../components/Header";
import Footer from "../components/Footer";
import { SIGNUP_PAGE_PROP } from "../utilities/constants";
import SignForm from "../components/SignForm";

export default function Signup() {
  const handleFormSubmit = (event) => {
    event.preventDefault();
   };

  return (
    <>
      <Header />
      <SignForm onSubmit={handleFormSubmit} props={SIGNUP_PAGE_PROP}/>
      <Footer />
    </>
  );
}
