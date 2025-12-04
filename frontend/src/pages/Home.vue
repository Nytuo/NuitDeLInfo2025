<script setup lang="ts">
import ChatWidget from '@/components/ChatWidget.vue';

const year = new Date().getFullYear();
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <header class="hero">
      <div class="hero-content">
        <div class="logo">🌐</div>
        <h1 class="hero-title">Le Nexus</h1>
        <p class="hero-subtitle">Bienvenue dans notre univers numérique</p>
        <p class="hero-year">{{ year }}</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <section class="intro-section">
        <h2>Notre Mission</h2>
        <p>
          Nous sommes une communauté dédiée à l'innovation et au partage. 
          Notre objectif est de créer des liens durables entre les passionnés 
          de technologie et ceux qui souhaitent contribuer à un monde meilleur.
        </p>
      </section>

      <section class="features-section">
        <h2>Comment nous soutenir ?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <span class="feature-icon">📞</span>
            <h3>Nous contacter</h3>
            <p>Une question ? Besoin d'aide ? Notre équipe est là pour vous.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">💰</span>
            <h3>Faire un don</h3>
            <p>Soutenez nos projets et aidez-nous à grandir.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">🛡️</span>
            <h3>Devenir bénévole</h3>
            <p>Rejoignez notre équipe et participez à l'aventure.</p>
          </div>
          <div class="feature-card">
            <span class="feature-icon">❓</span>
            <h3>En savoir plus</h3>
            <p>Découvrez nos actions et nos projets en cours.</p>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <div class="cta-content">
          <h2>Besoin d'aide ?</h2>
          <p>Cliquez sur l'icône <span class="axolotl-inline">🦎</span> en bas à droite pour discuter avec Axolotl, notre assistant virtuel !</p>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="page-footer">
      <p>© {{ year }} Le Nexus • Nuit de l'Info</p>
    </footer>

    <!-- Chat Widget flottant -->
    <ChatWidget />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #050508;
  color: #fff;
}

/* Hero */
.hero {
  padding: 80px 20px;
  text-align: center;
  border-bottom: 1px solid #1a1a2e;
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.logo {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hero-title {
  font-size: 3rem;
  margin: 0 0 10px;
  color: #fff;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: #888;
  margin: 0 0 20px;
}

.hero-year {
  display: inline-block;
  padding: 8px 24px;
  background-color: #1a1a2e;
  border: 2px solid #646cff;
  border-radius: 25px;
  color: #00d9ff;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Main Content */
.main-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 20px;
}

.intro-section {
  text-align: center;
  margin-bottom: 60px;
}

.intro-section h2 {
  font-size: 2rem;
  color: #00d9ff;
  margin: 0 0 20px;
}

.intro-section p {
  font-size: 1.1rem;
  color: #ccc;
  line-height: 1.8;
  max-width: 700px;
  margin: 0 auto;
}

/* Features */
.features-section {
  margin-bottom: 60px;
}

.features-section h2 {
  text-align: center;
  font-size: 2rem;
  color: #00d9ff;
  margin: 0 0 40px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}

.feature-card {
  background-color: #0f0f1a;
  border: 2px solid #1a1a2e;
  border-radius: 16px;
  padding: 30px 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  border-color: #646cff;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(100, 108, 255, 0.2);
}

.feature-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 1.2rem;
  color: #fff;
  margin: 0 0 10px;
}

.feature-card p {
  font-size: 0.9rem;
  color: #888;
  margin: 0;
  line-height: 1.5;
}

/* CTA */
.cta-section {
  background-color: #1a1a2e;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.cta-content h2 {
  font-size: 1.8rem;
  color: #fff;
  margin: 0 0 15px;
}

.cta-content p {
  font-size: 1.1rem;
  color: #ccc;
  margin: 0;
}

.axolotl-inline {
  font-size: 1.4rem;
  animation: bounce 1s ease infinite;
  display: inline-block;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* Footer */
.page-footer {
  text-align: center;
  padding: 30px 20px;
  border-top: 1px solid #1a1a2e;
  color: #666;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 640px) {
  .hero {
    padding: 50px 20px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .logo {
    font-size: 3rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .cta-section {
    padding: 30px 20px;
  }
}
</style>
