import type { Lang } from './types';
import { AUTHOR } from './i18n';

const UPDATED_ES = '10 de agosto de 2026';
const UPDATED_EN = 'August 10, 2026';

const SITE_NAME = 'Rice Tech News';
const SITE_URL = 'https://rice-tech-news.vercel.app';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
}

export const legalContent = {
  privacy: {
    es: {
      title: 'Política de Privacidad',
      updatedLabel: `Última actualización: ${UPDATED_ES}`,
      intro: `Esta Política de Privacidad describe cómo ${SITE_NAME} (${SITE_URL}) trata la información cuando visitas el sitio. ${SITE_NAME} es un proyecto personal y no requiere registro ni recopila datos personales de forma directa.`,
      sections: [
        {
          heading: 'Información que tratamos',
          paragraphs: [
            'No solicitamos ni almacenamos datos personales identificables (nombre, correo, etc.). El sitio no tiene cuentas de usuario ni formularios de registro.',
            'Guardamos algunas preferencias únicamente en tu navegador mediante <em>localStorage</em>: el idioma seleccionado, el filtro de fuentes y tu preferencia de mostrar u ocultar la publicidad. Esta información permanece en tu dispositivo y no se envía a nuestros servidores.',
          ],
        },
        {
          heading: 'Cookies y tecnologías similares',
          paragraphs: [
            'El sitio en sí no usa cookies propias de seguimiento. Sin embargo, los proveedores externos de publicidad pueden usar cookies y tecnologías similares para mostrar y medir anuncios.',
          ],
        },
        {
          heading: 'Publicidad de Google (AdSense)',
          paragraphs: [
            'Este sitio muestra anuncios a través de Google AdSense. Google, como proveedor externo, utiliza cookies para publicar anuncios en función de tus visitas a este y otros sitios web.',
            'El uso de la cookie de publicidad de Google le permite a Google y a sus socios mostrar anuncios basados en tus visitas. Puedes obtener más información y gestionar tus preferencias en la <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">página de políticas de Google para sitios asociados</a>.',
            'Puedes inhabilitar la publicidad personalizada visitando la <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Configuración de anuncios de Google</a>, o desactivar las cookies de terceros de proveedores externos en <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.',
            'Además, este sitio incluye un interruptor propio en la cabecera que te permite ocultar la publicidad en cualquier momento; tu elección se guarda en tu navegador.',
          ],
        },
        {
          heading: 'Enlaces a terceros',
          paragraphs: [
            'Las noticias enlazan a sitios externos (sus fuentes originales). No somos responsables de las prácticas de privacidad ni del contenido de esos sitios.',
          ],
        },
        {
          heading: 'Cambios en esta política',
          paragraphs: [
            'Podemos actualizar esta Política de Privacidad ocasionalmente. Los cambios se publicarán en esta misma página con una nueva fecha de actualización.',
          ],
        },
        {
          heading: 'Contacto',
          paragraphs: [
            `Para cualquier consulta sobre privacidad puedes contactar al autor a través de <a href="${AUTHOR.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>.`,
          ],
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      updatedLabel: `Last updated: ${UPDATED_EN}`,
      intro: `This Privacy Policy explains how ${SITE_NAME} (${SITE_URL}) handles information when you visit the site. ${SITE_NAME} is a personal project and does not require sign-up or directly collect personal data.`,
      sections: [
        {
          heading: 'Information we handle',
          paragraphs: [
            'We do not request or store personally identifiable data (name, email, etc.). The site has no user accounts or sign-up forms.',
            'We store a few preferences solely in your browser via <em>localStorage</em>: the selected language, the source filter, and your choice to show or hide advertising. This data stays on your device and is never sent to our servers.',
          ],
        },
        {
          heading: 'Cookies and similar technologies',
          paragraphs: [
            'The site itself does not use first-party tracking cookies. However, third-party advertising vendors may use cookies and similar technologies to serve and measure ads.',
          ],
        },
        {
          heading: 'Google Advertising (AdSense)',
          paragraphs: [
            'This site displays ads through Google AdSense. Google, as a third-party vendor, uses cookies to serve ads based on your visits to this and other websites.',
            "Google's use of advertising cookies enables it and its partners to serve ads based on your visits. Learn more and manage your preferences on <a href=\"https://policies.google.com/technologies/partner-sites\" target=\"_blank\" rel=\"noopener noreferrer\">Google's policies for partner sites</a>.",
            'You may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>, or opt out of third-party vendor cookies at <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.',
            'Additionally, this site includes its own toggle in the header that lets you hide advertising at any time; your choice is saved in your browser.',
          ],
        },
        {
          heading: 'Third-party links',
          paragraphs: [
            'News items link to external sites (their original sources). We are not responsible for the privacy practices or content of those sites.',
          ],
        },
        {
          heading: 'Changes to this policy',
          paragraphs: [
            'We may update this Privacy Policy from time to time. Changes will be posted on this page with a new update date.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            `For any privacy inquiries you can reach the author via <a href="${AUTHOR.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>.`,
          ],
        },
      ],
    },
  },
  terms: {
    es: {
      title: 'Términos y Condiciones',
      updatedLabel: `Última actualización: ${UPDATED_ES}`,
      intro: `Al acceder y usar ${SITE_NAME} (${SITE_URL}) aceptas estos Términos y Condiciones. Si no estás de acuerdo, por favor no utilices el sitio.`,
      sections: [
        {
          heading: 'Uso del sitio',
          paragraphs: [
            `${SITE_NAME} es un proyecto personal de carácter informativo que agrega y resume noticias de tecnología y programación mediante inteligencia artificial. El contenido se ofrece "tal cual", con fines informativos y educativos.`,
          ],
        },
        {
          heading: 'Exactitud del contenido',
          paragraphs: [
            'Los resúmenes se generan automáticamente con IA y pueden contener errores, imprecisiones u omisiones. No garantizamos la exactitud, integridad ni actualidad de la información. Consulta siempre la fuente original antes de tomar decisiones basadas en el contenido.',
          ],
        },
        {
          heading: 'Propiedad intelectual',
          paragraphs: [
            'Los titulares, enlaces y contenidos originales pertenecen a sus respectivas fuentes y autores. Los resúmenes generados por IA se ofrecen para facilitar el acceso a la información y siempre enlazan al artículo original.',
          ],
        },
        {
          heading: 'Enlaces y publicidad de terceros',
          paragraphs: [
            'El sitio contiene enlaces a sitios externos y muestra publicidad de terceros (Google AdSense). No respaldamos ni somos responsables del contenido, productos o servicios de terceros.',
          ],
        },
        {
          heading: 'Limitación de responsabilidad',
          paragraphs: [
            'El uso del sitio es bajo tu propio riesgo. En la máxima medida permitida por la ley, no seremos responsables de daños derivados del uso o la imposibilidad de uso del sitio.',
          ],
        },
        {
          heading: 'Cambios en los términos',
          paragraphs: [
            'Podemos modificar estos Términos en cualquier momento. El uso continuado del sitio tras los cambios implica su aceptación.',
          ],
        },
        {
          heading: 'Contacto',
          paragraphs: [
            `Para consultas sobre estos Términos puedes contactar al autor a través de <a href="${AUTHOR.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>.`,
          ],
        },
      ],
    },
    en: {
      title: 'Terms and Conditions',
      updatedLabel: `Last updated: ${UPDATED_EN}`,
      intro: `By accessing and using ${SITE_NAME} (${SITE_URL}) you agree to these Terms and Conditions. If you do not agree, please do not use the site.`,
      sections: [
        {
          heading: 'Use of the site',
          paragraphs: [
            `${SITE_NAME} is a personal, informational project that aggregates and summarizes tech and programming news using artificial intelligence. Content is provided "as is" for informational and educational purposes.`,
          ],
        },
        {
          heading: 'Content accuracy',
          paragraphs: [
            'Summaries are generated automatically with AI and may contain errors, inaccuracies, or omissions. We do not guarantee the accuracy, completeness, or timeliness of the information. Always consult the original source before making decisions based on the content.',
          ],
        },
        {
          heading: 'Intellectual property',
          paragraphs: [
            'Original headlines, links, and content belong to their respective sources and authors. AI-generated summaries are provided to ease access to information and always link to the original article.',
          ],
        },
        {
          heading: 'Third-party links and advertising',
          paragraphs: [
            'The site contains links to external sites and displays third-party advertising (Google AdSense). We do not endorse and are not responsible for third-party content, products, or services.',
          ],
        },
        {
          heading: 'Limitation of liability',
          paragraphs: [
            'Use of the site is at your own risk. To the maximum extent permitted by law, we shall not be liable for any damages arising from the use of, or inability to use, the site.',
          ],
        },
        {
          heading: 'Changes to the terms',
          paragraphs: [
            'We may modify these Terms at any time. Continued use of the site after changes constitutes acceptance.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            `For questions about these Terms you can reach the author via <a href="${AUTHOR.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>.`,
          ],
        },
      ],
    },
  },
} satisfies Record<'privacy' | 'terms', Record<Lang, LegalDoc>>;
