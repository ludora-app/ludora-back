interface EmailTemplate {
  subject: string;
  html: (data: any) => string;
}

export const VERIFICATION_LINK_TEMPLATE: EmailTemplate = {
  html: (data: { link: string }) => `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-bottom: 20px;">Bienvenue dans l'équipe Ludora</h2>
        <p style="font-size: 16px; line-height: 1.5;">Super de te compter parmi nous ! Pour valider ton inscription et commencer à bouger, clique simplement sur le bouton ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.link}" style="background-color: #f15924; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Vérifier mon email</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Attention, ce lien expire dans 15 minutes (le temps d'un bon échauffement).</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Si le bouton ne fonctionne pas, tu peux copier ce lien dans ton navigateur :<br>
            <span style="color: #f15924;">${data.link}</span>
        </p>
    </div>
  `,
  subject: 'Prêt pour le sport ? Valide ton compte Ludora',
};

export const WELCOME_EMAIL_TEMPLATE: EmailTemplate = {
  html: (data: { name: string }) => `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827;">Salut ${data.name}</h2>
        <p style="font-size: 16px; line-height: 1.5;">Ça y est, ton compte Ludora est prêt. On est vraiment ravis de te voir rejoindre la communauté.</p>
        <p style="font-size: 16px; line-height: 1.5;">Connecte-toi dès maintenant pour découvrir les prochaines sessions et rencontrer tes futurs partenaires de jeu.</p>
        <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">À très vite sur le terrain,<br>L'équipe Ludora</p>
        </div>
    </div>
  `,
  subject: 'Bienvenue dans la communauté Ludora',
};

export const PASSWORD_RESET_TEMPLATE: EmailTemplate = {
  html: (data: { name: string }) => `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827;">Check de sécurité</h2>
        <p style="font-size: 16px; line-height: 1.5;">Salut ${data.name},</p>
        <p style="font-size: 16px; line-height: 1.5;">On te confirme que le mot de passe de ton compte Ludora vient d'être modifié avec succès.</p>
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">Si tu n'as pas demandé ce changement, contacte-nous rapidement pour qu'on sécurise tout ça ensemble.</p>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Bon jeu !</p>
    </div>
  `,
  subject: 'Mot de passe modifié sur Ludora',
};

export const VERIFIED_EMAIL_TEMPLATE: EmailTemplate = {
  html: (data: { name: string }) => `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827;">C'est tout bon</h2>
        <p style="font-size: 16px; line-height: 1.5;">Salut ${data.name},</p>
        <p style="font-size: 16px; line-height: 1.5;">Ton adresse email a été vérifiée. Ton profil est maintenant opérationnel à 100%.</p>
        <p style="font-size: 16px;">À plus sur l'app !</p>
    </div>
  `,
  subject: 'Ton compte Ludora est validé',
};

export const PASSWORD_RESET_REQUEST_TEMPLATE: EmailTemplate = {
  html: (data: { name: string; code: string }) => `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827;">Besoin d'un nouveau mot de passe ?</h2>
        <p style="font-size: 16px; line-height: 1.5;">Pas de souci ${data.name}, ça arrive même aux meilleurs.</p>
        <p style="font-size: 16px; line-height: 1.5;">Voici ton code de vérification pour créer un nouveau mot de passe :</p>
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 12px; margin: 25px 0; border: 1px solid #f3f4f6;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; letter-spacing: 10px; font-weight: bold; color: #f15924;">${data.code}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Ce code est valable 15 minutes.</p>
        <p style="font-size: 13px; color: #9ca3af; margin-top: 25px;">Si tu n'as rien demandé, tu peux simplement ignorer ce mail. Ton mot de passe actuel restera inchangé.</p>
    </div>
  `,
  subject: 'Ton code de récupération Ludora',
};

export const NEW_FIELD_ADMINISTRATION_REQUEST_TEMPLATE: EmailTemplate = {
  html: (data: { link: string }) => `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827;">Nouvelle demande de création de terrain à valider</h2>
        <p style="font-size: 16px; line-height: 1.5;">Un nouveau terrain a été demandé à valider.</p>
        <p style="font-size: 16px; line-height: 1.5;">Pour le visualiser, clique sur le bouton ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.link}" style="background-color: #f15924; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Visualiser le terrain</a>
        </div>
    </div>
  `,
  subject: 'Nouvelle demande de création de terrain à valider',
};

// Objet qui regroupe tous les templates pour faciliter l'accès
export const emailTemplates = {
  emailVerified: VERIFIED_EMAIL_TEMPLATE,
  newFieldAdministrationRequest: NEW_FIELD_ADMINISTRATION_REQUEST_TEMPLATE,
  passwordReset: PASSWORD_RESET_TEMPLATE,
  passwordResetRequest: PASSWORD_RESET_REQUEST_TEMPLATE,
  verificationLink: VERIFICATION_LINK_TEMPLATE,
  welcomeEmail: WELCOME_EMAIL_TEMPLATE,
} as const;
