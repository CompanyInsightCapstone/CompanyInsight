import { Link } from "react-router";

export default function SignForm({props, onSubmit}) {
  return (
    <>
      <main className="form-container">
        <form className="sign-form">
          <h2 className="form-typography-h2">{props.h2}</h2>
          <p className="form-typography">{props.usernameText}</p>
          <input required type="text" name="username" placeholder="Username" />
          <p className="form-typography">{props.passwordText}</p>
          <input
            required
            type="password"
            name="password"
            placeholder="Password"
          />
          <p className="form-typography">
            {props.accountText}
            <Link to={props.link}>{props.linkText}</Link>
          </p>
          <button className="form-submit-button" onSubmit={onSubmit}>
            {props.accountText}
          </button>
        </form>
      </main>
    </>
  );
}
