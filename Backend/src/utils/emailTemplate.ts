const html = `
<div class="email-container">
    <div class="header">
        <img src="https://github.com/user-attachments/assets/f7d60e5e-e784-4d85-9608-65f6425927ae" alt="Streamline" />
        <h1>Streamline</h1>
    </div>
    <div class="content">
        {{content}}
        <p>Atenciosamente,</p>
        <p>Equipe Streamline</p>
    </div>
    <div class="footer">
        <p>&copy; 2024 Streamline. Todos os direitos reservados.</p>
    </div>
</div>
`;

const css = `
body {
font-family: 'Roboto Mono', sans-serif;
background-color: #f4f4f4;
margin: 0;
padding: 0;
color: #333;
}
img {
max-width: 100px;
}
.email-container {
margin: 0 auto;
background-color: #fff;
padding: 20px;
border-radius: 8px;
box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
max-width: 600px;
}
.header {
text-align: center;
padding-bottom: 20px;
background-color: #292F45;
border-radius: 8px 8px 0 0;
margin-bottom: 5px;
}
.header h1 {
margin: 0;
color: #FFF;
}
.content {
font-size: 16px;
line-height: 1.6;
color: #2E384D;
}
.content p {
margin: 10px 0;
}
.button-container {
text-align: center;
margin: 20px 0;
}
.button-container a {
text-align: center;
text-decoration: none;
color: #383838;
}
.button {
background-color: #90CDF4;
color: white;
padding: 15px 25px;
text-decoration: none;
border-radius: 5px;
font-size: 16px;
}
.footer {
text-align: center;
margin-top: 20px;
font-size: 12px;
color: #999;
}
`;

type renderTemplateType = (
  content: string,
  contentCss?: string
) => {
  html: string;
  css: string;
};

const emailTemplate: renderTemplateType = (content, contentCss = "") => {
  return {
    html: html.replace("{{content}}", content),
    css: css + contentCss,
  };
};

export default emailTemplate;
