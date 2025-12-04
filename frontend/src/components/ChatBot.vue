<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { ChatMessage, ChatOption, UserData, MissionType } from '@/shared/models/FormTypes';
import { AIService } from '@/shared/services/AIService';

const router = useRouter();

const messages = ref<ChatMessage[]>([]);
const currentInput = ref('');
const isTyping = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const currentStep = ref(0);
const suggestions = ref<string[]>([]);

const userData = reactive<UserData>({
  name: '',
  email: '',
  mission: null,
  message: '',
  donationAmount: 25,
  donationRecurrence: 'once',
  skills: [],
  availability: '',
  subject: '',
  phone: '',
});

const currentSentiment = ref<'positive' | 'neutral' | 'negative'>('neutral');

const missionOptions: ChatOption[] = [
  { label: 'Établir le Contact', value: 'contact', icon: '📞', description: 'Envoyer un message à l\'équipe' },
  { label: 'Offrir un Don', value: 'donation', icon: '💰', description: 'Soutenir financièrement la cause' },
  { label: 'Devenir Bénévole', value: 'volunteer', icon: '🛡️', description: 'Rejoindre la guilde des héros' },
  { label: 'Demander des Infos', value: 'information', icon: '❓', description: 'En savoir plus sur nos actions' },
];

const donationAmounts = [10, 25, 50, 100, 250];

const skillOptions = [
  'Développement Web', 'Design', 'Communication', 'Rédaction',
  'Gestion de projet', 'Événementiel', 'Comptabilité', 'Autre'
];

const sentimentClass = computed(() => {
  return `sentiment-${currentSentiment.value}`;
});

const year = new Date().getFullYear();

function addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
  messages.value.push({
    ...message,
    id: Date.now(),
    timestamp: new Date(),
  });
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

async function simulateTyping(delay = 800) {
  isTyping.value = true;
  await new Promise(resolve => setTimeout(resolve, delay));
  isTyping.value = false;
}

async function startConversation() {
  await simulateTyping(500);
  addMessage({
    type: 'bot',
    content: `Salutations, voyageur ! 🦎 Je suis Axolotl, ton guide dans le Nexus. En cette année ${year}, nous avons besoin de héros comme toi !`,
  });
  
  await simulateTyping(1000);
  addMessage({
    type: 'bot',
    content: 'Avant de commencer, puis-je connaître ton nom, noble visiteur ?',
  });
  
  currentStep.value = 1;
}

async function handleUserInput() {
  const input = currentInput.value.trim();
  if (!input) return;
  
  // Vérification anti-spam
  if (AIService.isSpam(input)) {
    addMessage({
      type: 'bot',
      content: '🚫 Oups ! Ce message semble suspect. Peux-tu reformuler ?',
    });
    currentInput.value = '';
    return;
  }
  
  // Analyse du sentiment
  const sentiment = AIService.analyzeSentiment(input);
  currentSentiment.value = sentiment.sentiment;
  
  addMessage({
    type: 'user',
    content: input,
    sentiment: sentiment.sentiment,
  });
  
  currentInput.value = '';
  suggestions.value = [];
  
  await processStep(input);
}

async function processStep(input: string) {
  switch (currentStep.value) {
    case 1: // Nom
      userData.name = input;
      await simulateTyping();
      addMessage({
        type: 'bot',
        content: `Enchanté, ${userData.name} ! ✨ Quel est ton email pour que nous puissions te recontacter ?`,
      });
      currentStep.value = 2;
      break;
      
    case 2: // Email
      if (!isValidEmail(input)) {
        addMessage({
          type: 'bot',
          content: '📧 Hmm, cet email ne semble pas valide. Peux-tu vérifier ?',
        });
        return;
      }
      userData.email = input;
      await simulateTyping();
      addMessage({
        type: 'bot',
        content: `Parfait ! Maintenant, quelle est ta mission aujourd'hui, ${userData.name} ?`,
      });
      await simulateTyping(500);
      addMessage({
        type: 'options',
        content: 'Choisis ta voie :',
        options: missionOptions,
      });
      currentStep.value = 3;
      break;
      
    case 4: // Message après mission sélectionnée
      userData.message = input;
      await processMissionSpecificInput(input);
      break;
      
    case 5: // Étapes spécifiques à la mission
      await processMissionSpecificInput(input);
      break;
  }
}

function selectMission(mission: MissionType) {
  userData.mission = mission;
  
  addMessage({
    type: 'user',
    content: missionOptions.find(m => m.value === mission)?.label || mission,
  });
  
  currentStep.value = 4;
  showMissionForm(mission);
}

async function showMissionForm(mission: MissionType) {
  await simulateTyping();
  
  switch (mission) {
    case 'contact':
      addMessage({
        type: 'bot',
        content: '📞 Excellent choix ! Quel est le sujet de ton message ?',
      });
      break;
      
    case 'donation':
      addMessage({
        type: 'bot',
        content: `💎 Merci pour ta générosité ! Choisis le montant de ton don pour ${year} :`,
      });
      await simulateTyping(300);
      addMessage({
        type: 'options',
        content: 'Montants suggérés :',
        options: donationAmounts.map(amount => ({
          label: `${amount}€`,
          value: amount.toString(),
          icon: amount >= 100 ? '🏆' : amount >= 50 ? '💎' : '⭐',
          description: AIService.calculateDonationImpact(amount),
        })),
      });
      currentStep.value = 5;
      break;
      
    case 'volunteer':
      addMessage({
        type: 'bot',
        content: '🛡️ Un nouveau membre pour la Guilde ! Quelles sont tes compétences ?',
      });
      await simulateTyping(300);
      addMessage({
        type: 'options',
        content: 'Sélectionne tes talents :',
        options: skillOptions.map(skill => ({
          label: skill,
          value: skill,
          icon: '✨',
        })),
      });
      currentStep.value = 5;
      break;
      
    case 'information':
      addMessage({
        type: 'bot',
        content: '📚 Quelle information recherches-tu ? Pose ta question !',
      });
      break;
  }
}

async function selectDonationAmount(amount: string) {
  userData.donationAmount = parseInt(amount);
  
  addMessage({
    type: 'user',
    content: `${amount}€`,
  });
  
  await simulateTyping();
  addMessage({
    type: 'bot',
    content: `Magnifique ! Avec ${amount}€, tu finances ${AIService.calculateDonationImpact(parseInt(amount))}. Souhaites-tu un don unique ou récurrent ?`,
  });
  
  await simulateTyping(300);
  addMessage({
    type: 'options',
    content: 'Fréquence :',
    options: [
      { label: 'Don unique', value: 'once', icon: '🎁' },
      { label: 'Mensuel', value: 'monthly', icon: '📅' },
      { label: 'Annuel', value: 'yearly', icon: '🗓️' },
    ],
  });
  
  currentStep.value = 6;
}

async function selectRecurrence(recurrence: string) {
  userData.donationRecurrence = recurrence as 'once' | 'monthly' | 'yearly';
  
  const labels: Record<string, string> = {
    once: 'Don unique',
    monthly: 'Mensuel',
    yearly: 'Annuel',
  };
  
  addMessage({
    type: 'user',
    content: labels[recurrence],
  });
  
  await finishConversation();
}

async function selectSkill(skill: string) {
  if (!userData.skills) userData.skills = [];
  
  if (userData.skills.indexOf(skill) === -1) {
    userData.skills.push(skill);
    
    addMessage({
      type: 'user',
      content: `Compétence ajoutée : ${skill}`,
    });
  }
  
  if (userData.skills.length >= 1) {
    await simulateTyping();
    addMessage({
      type: 'bot',
      content: `Super ! Tu as sélectionné : ${userData.skills.join(', ')}. Quelles sont tes disponibilités ?`,
    });
    currentStep.value = 6;
  }
}

async function processMissionSpecificInput(input: string) {
  if (userData.mission === 'contact' || userData.mission === 'information') {
    userData.message = input;
    await finishConversation();
  } else if (userData.mission === 'volunteer' && currentStep.value === 6) {
    userData.availability = input;
    await finishConversation();
  }
}

async function finishConversation() {
  await simulateTyping(1000);
  
  addMessage({
    type: 'bot',
    content: `🎉 Mission accomplie, ${userData.name} ! Préparation de ton écho de gratitude personnalisé...`,
  });
  
  await simulateTyping(1500);
  
  // Redirection vers la page de confirmation
  router.push({
    name: 'confirmation',
    query: {
      name: userData.name,
      mission: userData.mission,
      amount: userData.donationAmount?.toString(),
      recurrence: userData.donationRecurrence,
    },
  });
}

function handleInputChange() {
  const input = currentInput.value;
  
  // Analyse du sentiment en temps réel
  if (input.length > 5) {
    const sentiment = AIService.analyzeSentiment(input);
    currentSentiment.value = sentiment.sentiment;
    
    // Suggestions de complétion
    suggestions.value = AIService.generateSuggestions(input, userData.mission);
  } else {
    currentSentiment.value = 'neutral';
    suggestions.value = [];
  }
}

function applySuggestion(suggestion: string) {
  currentInput.value = suggestion;
  suggestions.value = [];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function handleOptionClick(option: ChatOption) {
  if (currentStep.value === 3) {
    selectMission(option.value as MissionType);
  } else if (currentStep.value === 5 && userData.mission === 'donation') {
    selectDonationAmount(option.value);
  } else if (currentStep.value === 5 && userData.mission === 'volunteer') {
    selectSkill(option.value);
  } else if (currentStep.value === 6 && userData.mission === 'donation') {
    selectRecurrence(option.value);
  }
}

onMounted(() => {
  startConversation();
});
</script>

<template>
  <div class="chatbot-container" :class="sentimentClass">
    <header class="chatbot-header">
      <div class="header-avatar">🦎</div>
      <div class="header-info">
        <h2>Axolotl - Guide du Nexus</h2>
        <span class="status">
          <span class="status-dot"></span>
          En ligne
        </span>
      </div>
      <div class="header-year">{{ year }}</div>
    </header>
    
    <div class="chat-messages" ref="chatContainer">
      <TransitionGroup name="message">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-wrapper"
          :class="[message.type, message.sentiment]"
        >
          <div v-if="message.type === 'bot'" class="message bot-message">
            <span class="avatar">🦎</span>
            <div class="message-content">
              <p>{{ message.content }}</p>
              <span class="timestamp">{{ message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
          </div>
          
          <div v-else-if="message.type === 'user'" class="message user-message">
            <div class="message-content">
              <p>{{ message.content }}</p>
              <span class="timestamp">{{ message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
            <span class="avatar">👤</span>
          </div>
          
          <div v-else-if="message.type === 'options'" class="options-container">
            <p class="options-label">{{ message.content }}</p>
            <div class="options-grid">
              <button
                v-for="option in message.options"
                :key="option.value"
                class="option-button"
                @click="handleOptionClick(option)"
              >
                <span class="option-icon">{{ option.icon }}</span>
                <span class="option-label">{{ option.label }}</span>
                <span v-if="option.description" class="option-desc">{{ option.description }}</span>
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
      
      <div v-if="isTyping" class="typing-indicator">
        <span class="avatar">🦎</span>
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
    
    <div class="suggestions-bar" v-if="suggestions.length > 0">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion"
        class="suggestion-chip"
        @click="applySuggestion(suggestion)"
      >
        {{ suggestion }}
      </button>
    </div>
    
    <footer class="chat-input-area">
      <div class="input-wrapper" :class="sentimentClass">
        <input
          v-model="currentInput"
          type="text"
          placeholder="Écris ton message..."
          @keyup.enter="handleUserInput"
          @input="handleInputChange"
          :disabled="isTyping"
          class="chat-input"
          aria-label="Message"
        />
        <button 
          class="send-button" 
          @click="handleUserInput"
          :disabled="!currentInput.trim() || isTyping"
          aria-label="Envoyer"
        >
          <span>➤</span>
        </button>
      </div>
      <p class="security-notice">🔒 Données sécurisées et cryptées</p>
    </footer>
  </div>
</template>

<style scoped>
.chatbot-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 800px;
  max-width: 600px;
  margin: 0 auto;
  background-color: #0a0a0f;
  border: 2px solid #1a1a2e;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(100, 108, 255, 0.2);
}

.chatbot-container.sentiment-positive {
  border-color: #00d9ff;
  box-shadow: 0 0 40px rgba(0, 217, 255, 0.3);
}

.chatbot-container.sentiment-negative {
  border-color: #ff4757;
  box-shadow: 0 0 40px rgba(255, 71, 87, 0.3);
}

.chatbot-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background-color: #0f0f1a;
  border-bottom: 1px solid #1a1a2e;
}

.header-avatar {
  font-size: 2.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.header-info h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #fff;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #888;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #00ff88;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.header-year {
  margin-left: auto;
  padding: 6px 12px;
  background-color: #1a1a2e;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #00d9ff;
  font-weight: bold;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 85%;
}

.bot-message {
  align-self: flex-start;
}

.user-message {
  align-self: flex-end;
}

.avatar {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.message-content {
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
}

.bot-message .message-content {
  background-color: #1a1a2e;
  border-bottom-left-radius: 4px;
  color: #e0e0e0;
}

.user-message .message-content {
  background-color: #646cff;
  border-bottom-right-radius: 4px;
  color: #fff;
}

.user-message.positive .message-content {
  background-color: #00b894;
}

.user-message.negative .message-content {
  background-color: #d63031;
}

.message-content p {
  margin: 0;
  line-height: 1.5;
}

.timestamp {
  display: block;
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 4px;
}

.options-container {
  padding: 10px 0;
}

.options-label {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 10px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.option-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background-color: #1a1a2e;
  border: 2px solid #2a2a4e;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
}

.option-button:hover {
  border-color: #646cff;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(100, 108, 255, 0.3);
}

.option-button:focus {
  outline: 2px solid #00d9ff;
  outline-offset: 2px;
}

.option-icon {
  font-size: 1.8rem;
}

.option-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.option-desc {
  font-size: 0.75rem;
  color: #888;
  text-align: center;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background-color: #1a1a2e;
  border-radius: 16px;
  width: fit-content;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background-color: #646cff;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.suggestions-bar {
  display: flex;
  gap: 8px;
  padding: 10px 20px;
  overflow-x: auto;
  background-color: #0f0f1a;
  border-top: 1px solid #1a1a2e;
}

.suggestion-chip {
  padding: 8px 16px;
  background-color: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 20px;
  color: #00d9ff;
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-chip:hover {
  background-color: #2a2a4e;
  border-color: #00d9ff;
}

.chat-input-area {
  padding: 16px 20px;
  background-color: #0f0f1a;
  border-top: 1px solid #1a1a2e;
}

.input-wrapper {
  display: flex;
  gap: 10px;
  padding: 4px;
  background-color: #1a1a2e;
  border-radius: 25px;
  border: 2px solid #2a2a4e;
  transition: border-color 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #646cff;
}

.input-wrapper.sentiment-positive:focus-within {
  border-color: #00d9ff;
}

.input-wrapper.sentiment-negative:focus-within {
  border-color: #ff4757;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  outline: none;
}

.chat-input::placeholder {
  color: #666;
}

.send-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #646cff;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  background-color: #535bf2;
  transform: scale(1.05);
}

.send-button:disabled {
  background-color: #333;
  cursor: not-allowed;
}

.security-notice {
  text-align: center;
  font-size: 0.75rem;
  color: #666;
  margin: 10px 0 0;
}

/* Animations */
.message-enter-active {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .chatbot-container {
    height: 100vh;
    max-height: none;
    border-radius: 0;
    border: none;
  }
  
  .options-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .header-year {
    display: none;
  }
}
</style>
