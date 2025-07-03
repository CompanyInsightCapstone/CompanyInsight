const nodemailer = require("nodemailer");
const process = require("process");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.VITE_CI_EMAIL_ADDRESS,
    pass: process.env.VITE_CI_EMAIL_APP_PASS,
  },
});

class Emailer {
  /**
   * Creates a new Emailer instance with configured transporter.
   * Initializes the nodemailer transporter for sending emails.
   */
  constructor() {
    this.transporter = transporter;
  }

  /**
   * Sends an email to the specified recipient with subject and body.
   * Uses the configured transporter to deliver the email message.
   * @param {string} email - The recipient's email address
   * @param {string} subject - The email subject line
   * @param {string} body - The email body content
   * @returns {Object} Information about the email sending result
   */
  sendEmail(email, subject, body) {
    const mailOptions = {
      from: process.env.VITE_CI_EMAIL_ADDRESS,
      to: email,
      subject: subject,
      text: body,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return info;
      } else {
        return info;
      }
    });
  }
}

module.exports = Emailer;
