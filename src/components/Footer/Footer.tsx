import { brand } from '../../config/brand';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <img
            src={brand.logoNegative}
            alt={brand.name}
            className={styles.logo}
            width={1671}
            height={496}
            loading="lazy"
          />
          <p>Expansão de franquias com modelo validado e suporte completo ao franqueado.</p>
        </div>

        <div>
          <h4 className={styles.heading}>Contato</h4>
          <ul className={styles.list}>
            <li><a href={`mailto:${brand.email}`}>{brand.email}</a></li>
            <li><a href={`tel:${brand.phone.replace(/\D/g, '')}`}>{brand.phone}</a></li>
            <li>{brand.address}</li>
          </ul>
        </div>

        <div>
          <h4 className={styles.heading}>Redes sociais</h4>
          <ul className={styles.list}>
            <li><a href={brand.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href={brand.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href={brand.social.youtube} target="_blank" rel="noopener noreferrer">YouTube</a></li>
          </ul>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p>
          © {year} {brand.name}. Todos os direitos reservados. <span className={styles.mono}>CNPJ {brand.cnpj}</span>
        </p>
        <a href="#">Política de Privacidade</a>
      </div>
    </footer>
  );
}
