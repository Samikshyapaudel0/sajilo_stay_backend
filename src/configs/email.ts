// src/config/email.ts
import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "./constant";

export const transporter = nodemailer.createTransport({
  service: "gmail", // we are using gmail service to send email
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: `Mero app <${EMAIL_USER}>`, // sender address
    to, // recipient address
    subject, // subject of the email
    html, // html body of the email
  };
  await transporter.sendMail(mailOptions);
};
