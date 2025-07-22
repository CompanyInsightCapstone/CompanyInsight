import Header from "../components/Header";
import Footer from "../components/Footer";
import RecommendationResults from "../components/RecommendationResults";
import RecommendationContextProvider from "../contexts/RecommendationContext";

export default function Recommendations() {
  return (
    <>
      <Header />
      <RecommendationContextProvider>
        <RecommendationResults />
      </RecommendationContextProvider>
      <Footer />
    </>
  );
}
