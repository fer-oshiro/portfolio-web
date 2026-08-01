import github from '../../../assets/github.png'
import linkedin from '../../../assets/linkedin.png'

const socialLinks = [
  {
    href: 'https://www.linkedin.com/in/fernanda-oshiro/',
    icon: linkedin,
  },
  {
    href: 'https://github.com/fer-oshiro/',
    icon: github,
  },
]

interface SocialLinksProps {
  layout?: 'list' | 'inline'
}

const renderSocialLink = ({ href, icon }: (typeof socialLinks)[number]) => (
  <a
    key={href}
    href={href}
    target="_blank"
    className="connection-panel__social-link"
  >
    <img src={icon} className="connection-panel__social-icon" />
  </a>
)

export const SocialLinks = ({ layout = 'list' }: SocialLinksProps) => {
  if (layout === 'inline') {
    return <div>{socialLinks.map(renderSocialLink)}</div>
  }

  return (
    <ul className="connection-panel__social-list">
      {socialLinks.map((socialLink) => (
        <li key={socialLink.href}>{renderSocialLink(socialLink)}</li>
      ))}
    </ul>
  )
}
