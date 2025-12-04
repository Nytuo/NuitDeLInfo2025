<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { MissionType } from '@/shared/models/FormTypes';
import { AIService } from '@/shared/services/AIService';

const route = useRoute();
const router = useRouter();

const name = computed(() => (route.query.name as string) || 'Voyageur');
const mission = computed(() => (route.query.mission as MissionType) || 'contact');
const amount = computed(() => route.query.amount as string);
const recurrence = computed(() => route.query.recurrence as string);

const year = new Date().getFullYear();
const showConfetti = ref(false);

const missionLabels: Record<MissionType, string> = {
  contact: 'Message Transmis',
  donation: 'Don Enregistré',
  volunteer: 'Candidature Reçue',
  information: 'Demande Envoyée',
};

const missionIcons: Record<MissionType, string> = {
  contact: '📡',
  donation: '💎',
  volunteer: '🛡️',
  information: '📚',
};

const missionMessages = computed(() => {
  const messages: Record<MissionType, string[]> = {
    contact: [
      `Ton message a été acheminé vers nos serveurs centraux.`,
      `Nos Agents de Support te répondront sous peu.`,
    ],
    donation: [
      `Ton Don de ${amount.value}€ ${recurrence.value === 'monthly' ? 'mensuel' : recurrence.value === 'yearly' ? 'annuel' : ''} est une bénédiction pour notre cause.`,
      `Il permettra de financer ${AIService.calculateDonationImpact(parseInt(amount.value || '25'))}.`,
    ],
    volunteer: [
      `Tu fais maintenant partie de notre Guilde des Bénévoles !`,
      `Nous te contacterons très bientôt pour ta première mission.`,
    ],
    information: [
      `Ta demande d'information a été enregistrée.`,
      `Tu recevras une réponse détaillée par email.`,
    ],
  };
  return messages[mission.value];
});

const impactStats = computed(() => {
  if (mission.value === 'donation' && amount.value) {
    const amt = parseInt(amount.value);
    return {
      meals: Math.floor(amt / 5),
      hours: Math.floor(amt / 15),
      projects: Math.floor(amt / 100) || 1,
    };
  }
  return null;
});

function goHome() {
  router.push('/');
}

function share() {
  const text = `Je viens de soutenir le Nexus en ${year} ! 🦎 #NuitDeLInfo`;
  if (navigator.share) {
    navigator.share({
      title: 'Le Nexus Connecté',
      text,
      url: window.location.origin,
    });
  } else {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  }
}

onMounted(() => {
  setTimeout(() => {
    showConfetti.value = true;
  }, 300);
});
</script>

<template>
  <div class="confirmation-page">
    <!-- Confetti Animation -->
    <div v-if="showConfetti" class="confetti-container">
      <div 
        v-for="i in 50" 
        :key="i" 
        class="confetti"
        :style="{
          '--x': Math.random() * 100 + '%',
          '--delay': Math.random() * 3 + 's',
          '--color': ['#646cff', '#00d9ff', '#00ff88', '#ff6b6b', '#ffd93d'][i % 5],
          '--rotation': Math.random() * 360 + 'deg',
        }"
      ></div>
    </div>
    
    <main class="content">
      <!-- Success Icon -->
      <div class="success-icon">
        <span class="icon-inner">{{ missionIcons[mission] }}</span>
        <div class="icon-ring"></div>
        <div class="icon-ring ring-2"></div>
      </div>
      
      <!-- Main Message -->
      <h1 class="title">
        <span class="greeting">Salutations,</span>
        <span class="name">{{ name }} !</span>
      </h1>
      
      <div class="status-badge">
        {{ missionLabels[mission] }}
      </div>
      
      <!-- Mission Messages -->
      <div class="message-box">
        <p v-for="(msg, index) in missionMessages" :key="index">
          {{ msg }}
        </p>
      </div>
      
      <!-- Impact Stats for Donations -->
      <div v-if="impactStats" class="impact-section">
        <h3>Ton Impact en {{ year }}</h3>
        <div class="impact-grid">
          <div class="impact-card">
            <span class="impact-icon">🍽️</span>
            <span class="impact-value">{{ impactStats.meals }}</span>
            <span class="impact-label">Repas financés</span>
          </div>
          <div class="impact-card">
            <span class="impact-icon">⏰</span>
            <span class="impact-value">{{ impactStats.hours }}</span>
            <span class="impact-label">Heures de formation</span>
          </div>
          <div class="impact-card">
            <span class="impact-icon">🚀</span>
            <span class="impact-value">{{ impactStats.projects }}</span>
            <span class="impact-label">Projet(s) soutenus</span>
          </div>
        </div>
      </div>
      
      <!-- Year Message -->
      <div class="year-section">
        <div class="year-badge">{{ year }}</div>
        <p class="year-message">
          Ton soutien en <strong>{{ year }}</strong> est crucial pour notre progression !
        </p>
        <p class="year-submessage">
          Reste connecté pour suivre nos exploits tout au long de l'année.
        </p>
      </div>
      
      <!-- Axolotl Avatar -->
      <div class="axolotl-section">
        <div class="axolotl-avatar">🦎</div>
        <p class="axolotl-message">
          "Que la puissance du code t'accompagne !"
          <br><small>— Axolotl, Guide du Nexus</small>
        </p>
      </div>
      
      <!-- Actions -->
      <div class="actions">
        <button class="btn btn-primary" @click="goHome">
          <span>🏠</span> Retour au Nexus
        </button>
        <button class="btn btn-secondary" @click="share">
          <span>📣</span> Partager
        </button>
      </div>
      
      <!-- Footer -->
      <footer class="page-footer">
        <p>🔒 Transaction sécurisée • Nuit de l'Info {{ year }}</p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.confirmation-page {
  min-height: 100vh;
  background-color: #050508;
  color: #fff;
  position: relative;
  overflow: hidden;
}

/* Confetti */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--color);
  left: var(--x);
  top: -20px;
  animation: fall 4s linear forwards;
  animation-delay: var(--delay);
  transform: rotate(var(--rotation));
}

@keyframes fall {
  0% {
    top: -20px;
    opacity: 1;
  }
  100% {
    top: 100vh;
    opacity: 0;
    transform: rotate(720deg);
  }
}

.content {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

/* Success Icon */
.success-icon {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-inner {
  font-size: 4rem;
  z-index: 2;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.icon-ring {
  position: absolute;
  inset: 0;
  border: 3px solid #00d9ff;
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

.ring-2 {
  animation-delay: 1s;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Title */
.title {
  margin: 0 0 20px;
}

.greeting {
  display: block;
  font-size: 1.2rem;
  color: #888;
  font-weight: normal;
}

.name {
  display: block;
  font-size: 2.5rem;
  color: #00d9ff;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { text-shadow: 0 0 10px rgba(0, 217, 255, 0.5); }
  to { text-shadow: 0 0 20px rgba(0, 217, 255, 0.8); }
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 10px 24px;
  background-color: #00ff88;
  color: #050508;
  font-weight: bold;
  border-radius: 25px;
  font-size: 1rem;
  margin-bottom: 30px;
}

/* Message Box */
.message-box {
  background-color: #0f0f1a;
  border: 2px solid #1a1a2e;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
}

.message-box p {
  margin: 0 0 10px;
  color: #e0e0e0;
  font-size: 1.1rem;
  line-height: 1.6;
}

.message-box p:last-child {
  margin-bottom: 0;
}

/* Impact Section */
.impact-section {
  margin-bottom: 30px;
}

.impact-section h3 {
  color: #646cff;
  margin: 0 0 20px;
  font-size: 1.2rem;
}

.impact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.impact-card {
  background-color: #0f0f1a;
  border: 2px solid #1a1a2e;
  border-radius: 12px;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.impact-icon {
  font-size: 1.8rem;
}

.impact-value {
  font-size: 2rem;
  font-weight: bold;
  color: #00d9ff;
}

.impact-label {
  font-size: 0.75rem;
  color: #888;
}

/* Year Section */
.year-section {
  background-color: #1a1a2e;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
}

.year-badge {
  display: inline-block;
  font-size: 2rem;
  font-weight: bold;
  color: #646cff;
  padding: 10px 30px;
  border: 3px solid #646cff;
  border-radius: 30px;
  margin-bottom: 15px;
}

.year-message {
  font-size: 1.1rem;
  color: #fff;
  margin: 0 0 10px;
}

.year-submessage {
  font-size: 0.9rem;
  color: #888;
  margin: 0;
}

/* Axolotl Section */
.axolotl-section {
  margin-bottom: 30px;
}

.axolotl-avatar {
  font-size: 4rem;
  margin-bottom: 10px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.axolotl-message {
  font-style: italic;
  color: #888;
  margin: 0;
}

.axolotl-message small {
  color: #00d9ff;
}

/* Actions */
.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-primary {
  background-color: #646cff;
  color: #fff;
}

.btn-primary:hover {
  background-color: #535bf2;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(100, 108, 255, 0.4);
}

.btn-secondary {
  background-color: transparent;
  border-color: #00d9ff;
  color: #00d9ff;
}

.btn-secondary:hover {
  background-color: #00d9ff;
  color: #050508;
}

/* Footer */
.page-footer {
  color: #666;
  font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 640px) {
  .name {
    font-size: 1.8rem;
  }
  
  .impact-grid {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
