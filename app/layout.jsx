import './globals.css';

export const metadata = {
  title: 'DarazEA — handloom, home and everyday essentials',
  description: 'A single-seller online store: browse the catalogue, search by keyword, pay by card or cash on delivery, and track every order from placed to delivered.',
};

/** The one place `globals.css` is imported: a stylesheet imported from a page loads on that route only. */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
