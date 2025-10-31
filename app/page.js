import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Welcome to Vercel!</h1>
        <p>This is a simple Next.js application ready to be deployed.</p>

        <div className={styles.grid}>
          <a href="#" className={styles.card}>
            <h2>Deploy &rarr;</h2>
            <p>Deploy this app to Vercel with one click.</p>
          </a>

          <a href="#" className={styles.card}>
            <h2>Learn &rarr;</h2>
            <p>Learn more about Next.js and Vercel.</p>
          </a>
        </div>
      </div>
    </main>
  )
}
