interface EmailTemplate {
  subject: string;
  html: (data: any) => string;
}

export const VERIFICATION_CODE_TEMPLATE: EmailTemplate = {
  html: (data: { code: string }) => `
    <div style="font-family: Arial, sans-serif;">
        <h2>Bienvenue sur Ludora !</h2>
        <p>Voici votre code de vérification :</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
            ${data.code}
        </h1>
        <p>Ce code est valable pendant 15 minutes.</p>
        <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
    </div>
  `,
  subject: 'Code de vérification Ludora',
};

export const WELCOME_EMAIL_TEMPLATE: EmailTemplate = {
  html: (data: { name: string }) => `
    <div style="font-family: Arial, sans-serif;">
        <h2>Bienvenue ${data.name} !</h2>
        <p>Merci de vous être inscrit sur Ludora.</p>
        <p>Nous sommes ravis de vous compter parmi nos utilisateurs.</p>
    </div>
  `,
  subject: 'Bienvenue sur Ludora !',
};

export const PASSWORD_RESET_TEMPLATE: EmailTemplate = {
  html: (data: { name: string }) => `
    <div style="font-family: Arial, sans-serif;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${data.name},</p>
        <p>Le mot de passe de votre compte LUDORA a été modifié:</p>
        <p>Si vous n'êtes pas à l'origine de cette modification, veuillez contacter le support client.</p>
        <p>Merci de vérifier votre mot de passe et de le modifier si nécessaire.</p>
    </div>
  `,
  subject: 'LUDORA - Réinitialisation de votre mot de passe',
};

export const VERIFIED_EMAIL_TEMPLATE: EmailTemplate = {
  html: (data: { name: string }) => `
    <div style="font-family: Arial, sans-serif;">
        <h2>Votre email a été vérifié</h2>
        <p>Bonjour ${data.name},</p>
        <p>Votre email a été vérifié avec succès.</p>
        <p>Vous pouvez désormais accéder à votre compte.</p>
    </div>
  `,
  subject: 'LUDORA - Votre email a été vérifié',
};

// Objet qui regroupe tous les templates pour faciliter l'accès
export const emailTemplates = {
  passwordReset: PASSWORD_RESET_TEMPLATE,
  verificationCode: VERIFICATION_CODE_TEMPLATE,
  welcomeEmail: WELCOME_EMAIL_TEMPLATE,
} as const;
