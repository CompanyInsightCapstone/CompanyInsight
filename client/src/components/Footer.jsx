import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <section className="footer-about">
        <h3 className="footer-heading">About</h3>
        <p className="footer-text">
          Company Insights is a web-app that allows you to research companies
          that are publicly traded, in order to help you informed decisions when
          trading.
        </p>
      </section>
      <p className="footer-copyright">© 2025 Company Insights</p>
    </footer>
  );
}
