import { useContext, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import User from "../api/user";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function UserSettings() {
  const { setUserSettings, userSettings } = useContext(UserContext);
  const [infiniteScroll, setInfiniteScroll] = useState(
    userSettings.infiniteScroll,
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!event.target.infiniteScroll.checked) {
      return;
    }
    User.updateUserSettings(userSettings.id, {
      infiniteScroll: !infiniteScroll,
    });
    setUserSettings({ ...userSettings, infiniteScroll: !infiniteScroll });
    setInfiniteScroll(!infiniteScroll);
  };

  return (
    <>
      <Header />
      <section className="home-container">
        <h2>Settings</h2>
        <div
          className="settings-container"
          styles={{ display: "flex", flexDirection: "column" }}
        >
          <form onSubmit={handleSubmit}>
            <label htmlFor="infiniteScroll">
              Turn Infinite Scroll {infiniteScroll ? "Off" : "On"}?
            </label>
            <input type="checkbox" name="infiniteScroll" />
            <button type="submit">Update your Settings</button>
          </form>
        </div>
      </section>
      <Footer />
    </>
  );
}
