import Header from "../components/Header";
import Footer from "../components/Footer";
import SForm from "../components/SForm";
import { LOGIN_PAGE_PROP } from "../utilities/constants";

export default function Login() {
  const handleFormSubmit = (event) => {
    event.preventDefault();
    console.log(1)
  };

  return (
    <>
      <Header />
      <SForm onSubmit={handleFormSubmit} props={LOGIN_PAGE_PROP}>
        {" "}
      </SForm>
      <Footer />
    </>
  );
}
