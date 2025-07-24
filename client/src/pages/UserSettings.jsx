import { useContext, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import User from "../api/user";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/UserSettings.css";

export default function UserSettings() {
  const { setUserSettings, userSettings } = useContext(UserContext);
  const [infiniteScroll, setInfiniteScroll] = useState(
    userSettings.infiniteScroll,
  );
  const [updateSuccess, setUpdateSuccess] = useState(false);

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
    setUpdateSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setUpdateSuccess(false);
    }, 3000);
  };

  return (
    <>
      <Header />
      <main className="home-container">
        <h2 className="home-title">Settings</h2>

        <div className="settings-container">
          <div className="settings-card">
            <h3 className="settings-card-title">Display Preferences</h3>

            <form onSubmit={handleSubmit} className="settings-form">
              <div className="settings-form-group">
                <label htmlFor="infiniteScroll" className="settings-label">
                  Infinite Scroll
                </label>
                <div className="settings-control-group">
                  <span className="settings-description">
                    {infiniteScroll
                      ? "Currently enabled. Companies will load automatically as you scroll."
                      : "Currently disabled. Use pagination buttons to load more companies."}
                  </span>
                  <div className="toggle-container">
                    <input
                      type="checkbox"
                      id="infiniteScroll"
                      name="infiniteScroll"
                      className="toggle-input"
                    />
                    <label htmlFor="infiniteScroll" className="toggle-label">
                      Turn {infiniteScroll ? "Off" : "On"}
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="settings-button">
                Save Changes
              </button>

              {updateSuccess && (
                <div className="settings-success">
                  Settings updated successfully!
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
