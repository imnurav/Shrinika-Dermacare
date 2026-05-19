export const forgotPasswordTemplate = (resetLink: string) => {
  return `
    <div
      style="
        font-family: Arial;
        max-width: 600px;
        margin: auto;
      "
    >
      <h2>Reset Password</h2>

      <p>
        Click below to reset your password.
      </p>

      <a
        href="${resetLink}"
        style="
          display: inline-block;
          padding: 12px 20px;
          background: #020887;
          color: white;
          text-decoration: none;
          border-radius: 6px;
        "
      >
        Reset Password
      </a>

      <p
        style="
          margin-top: 20px;
          color: #666;
          font-size: 14px;
        "
      >
        This link expires in 15 minutes.
      </p>
    </div>
  `;
};
