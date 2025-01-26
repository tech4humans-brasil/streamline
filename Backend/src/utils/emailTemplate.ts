import AdminRepository from "../repositories/Admin";
import { connectAdmin } from "../services/mongo";
import BlobUploader from "../services/upload";

const LOGO =
  "https://devforceflowfiles.blob.core.windows.net/email/streamline.png?sp=r&st=2024-10-04T01:17:44Z&se=2031-09-11T09:17:44Z&spr=https&sv=2022-11-02&sr=b&sig=lGg52w4OT2bWpwgxAHa8GmcmWHMGV5Y3dcCOqcz4LNY%3D";

const MAX_TIME = 8640000;

const html = `
<div class="email-container">
    <div class="header">
        <img src="{{logo}}" alt="Streamline" />
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
width: 50%;
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
padding-top: 20px;
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

const emailTemplate = async ({
  content,
  contentCss = "",
  slug,
}: {
  content: string;
  contentCss?: string;
  slug?: string;
}) => {
  let logo = LOGO;
  if (slug) {
    const connAdmin = await connectAdmin();
    const admin = await new AdminRepository(connAdmin).findOne({
      where: {
        acronym: slug,
      },
      select: {
        logo: 1,
      },
    });

    logo = admin?.logo?.url?.split("?")[0] ?? LOGO;
  }

  console.log(logo);

  return {
    html: html.replace("{{content}}", content).replace("{{logo}}", logo),
    css: css + contentCss,
  };
};

export default emailTemplate;
