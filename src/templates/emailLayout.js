const footerText = "This is an automated email. Please do not reply to this message.";

function emailHtmlLayout(title, content) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; padding: 40px; border-radius: 8px;">
          <header>
            <h1 style="margin-top: 0;">${title}</h1>
          </header>
          <main>
            ${content}
          </main>
          <footer>
            <hr />
            <p style="font-size: 12px; color: #777;">${footerText}</p>
          </footer>
        </div>
      </body>
    </html>
  `.trim();
}

function emailTextLayout(title, content) {
  return `${title}\n\n${content}\n\n${footerText}`;
}

module.exports = { emailHtmlLayout, emailTextLayout };