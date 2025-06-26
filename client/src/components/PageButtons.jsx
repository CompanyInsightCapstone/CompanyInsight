import { useContext } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";

export default function PageButtons() {
  const { handleLoadPage } = useContext(CompanyListContext);

  return (
    <>
      <button value={-1} onClick={handleLoadPage}>
        PREVIOUS PAGE
      </button>
      <button value={1} onClick={handleLoadPage}>
        NEXT PAGE
      </button>
    </>
  );
}
