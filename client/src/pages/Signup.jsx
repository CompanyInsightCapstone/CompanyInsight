import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router";
import { useState } from "react";
import { SIGNUP_PAGE_PROP } from "../utilities/constants";
import SForm from "../components/SForm";

export default function Signup() {
  const handleFormSubmit = (event) => {
    event.preventDefault();
    console.log("Submitting form");
  };

  return (
    <>
      <Header />
      <SForm onSubmit={handleFormSubmit} props={SIGNUP_PAGE_PROP}></SForm>
      <Footer />
    </>
  );
}
