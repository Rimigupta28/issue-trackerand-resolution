import "./globals.css";

export const metadata = {
  title: "IssueDesk — Issue Tracking",
  description: "A simple workspace for tracking and resolving team issues.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
