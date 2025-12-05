<template>
    <div class="clippy-container" :class="{ 'clippy-hidden': isHidden }">
        <!-- Mascotte Chevalier Pixel Art -->
        <div 
            class="clippy-mascot"
            @click="toggleChat"
            :class="{ 'clippy-idle': isIdle && !isChatOpen, 'clippy-active': isChatOpen }"
        >
            <div class="knight-sprite">
                <div class="knight-glow"></div>
                <img 
                    src="/images/knight-mascot.png" 
                    alt="Nexus Knight" 
                    class="knight-img"
                    :class="{ 'talking': isTalking, 'idle': isIdle }"
                />
                <div class="status-led" :class="{ 'active': isChatOpen }"></div>
            </div>
        </div>

        <!-- Bulle de notification style terminal -->
        <div v-if="showNotification && !isChatOpen" class="clippy-notification" @click="toggleChat">
            <span class="notif-prefix">[NEXUS]</span>
            <span class="notif-text">{{ notificationText }}</span>
            <button class="notif-close" @click.stop="dismissNotification">×</button>
        </div>

        <!-- Bulle de chat style terminal -->
        <div v-if="isChatOpen" class="clippy-terminal">
            <div class="terminal-header">
                <div class="terminal-title">
                    <span class="terminal-icon">🦎</span>
                    <span>nexus@formulaire:~</span>
                </div>
                <div class="terminal-controls">
                    <button @click="minimizeChat" class="ctrl-btn minimize">_</button>
                    <button @click="toggleChat" class="ctrl-btn close">×</button>
                </div>
            </div>
            
            <div class="terminal-body" ref="chatContainer">
                <div 
                    v-for="(message, index) in messages" 
                    :key="index"
                    class="terminal-line"
                    :class="message.type"
                >
                    <span class="line-prefix" v-if="message.type === 'bot'">[nexus]$</span>
                    <span class="line-prefix user" v-if="message.type === 'user'">[user]></span>
                    <div class="line-content">
                        <p>{{ message.text }}</p>
                        
                        <!-- Options style boutons rétro -->
                        <div v-if="message.options" class="option-grid">
                            <button 
                                v-for="opt in message.options" 
                                :key="opt.id"
                                @click="selectOption(opt)"
                                class="retro-btn"
                            >
                                <span class="btn-icon">{{ opt.icon }}</span>
                                <span class="btn-label">{{ opt.label }}</span>
                            </button>
                        </div>

                        <!-- Formulaire style DOS -->
                        <div v-if="message.fields" class="form-block">
                            <div v-for="field in message.fields" :key="field.name" class="form-field">
                                <label :for="'field-' + field.name">{{ field.label }}:</label>
                                <input 
                                    v-if="field.type === 'text' || field.type === 'email' || field.type === 'tel'"
                                    :id="'field-' + field.name"
                                    :type="field.type"
                                    v-model="formData[field.name]"
                                    :placeholder="field.placeholder"
                                    class="dos-input"
                                />
                                <textarea 
                                    v-if="field.type === 'textarea'"
                                    v-model="formData[field.name]"
                                    :placeholder="field.placeholder"
                                    class="dos-textarea"
                                    rows="2"
                                ></textarea>
                                <select 
                                    v-if="field.type === 'select'"
                                    v-model="formData[field.name]"
                                    class="dos-select"
                                >
                                    <option value="">-- {{ field.placeholder }} --</option>
                                    <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
                                </select>
                            </div>
                            <button @click="submitFields" class="submit-btn">
                                [ENVOYER]
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Indicateur de frappe -->
                <div v-if="isTyping" class="terminal-line typing">
                    <span class="line-prefix">[nexus]$</span>
                    <span class="typing-cursor">█</span>
                </div>
            </div>

            <!-- Barre de saisie -->
            <div class="terminal-input">
                <span class="input-prefix">[user]></span>
                <input 
                    v-model="userInput"
                    @keyup.enter="sendMessage"
                    placeholder="Tapez votre message..."
                    class="chat-input"
                    ref="inputField"
                />
                <button @click="sendMessage" class="send-btn">⏎</button>
            </div>

            <!-- Barre de statut -->
            <div class="terminal-status">
                <span class="status-item">
                    <span class="status-dot" :class="currentSentiment"></span>
                    {{ sentimentText }}
                </span>
                <span class="status-item">IA: ACTIVE</span>
                <span class="status-item">{{ currentTime }}</span>
            </div>
        </div>

        <!-- Bouton restaurer -->
        <button v-if="isHidden" class="clippy-restore" @click="restoreClippy">
            <span class="restore-icon">🦎</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import emailjs from '@emailjs/browser';

// Configuration EmailJS
const EMAILJS_SERVICE_ID = 'service_cgqx7v1';
const EMAILJS_TEMPLATE_ID = 'template_f8pun97';
const EMAILJS_PUBLIC_KEY = 'roNAqnoiKqIdfa610';

interface ChatMessage {
    type: 'bot' | 'user';
    text: string;
    options?: { id: string; label: string; icon: string }[];
    fields?: { name: string; label: string; type: string; placeholder: string; options?: string[] }[];
}

const isChatOpen = ref(false);
const isHidden = ref(false);
const isIdle = ref(true);
const isBlinking = ref(false);
const isTalking = ref(false);
const isTyping = ref(false);
const showNotification = ref(false);
const notificationText = ref("Cliquez pour interagir...");
const chatContainer = ref<HTMLElement | null>(null);
const inputField = ref<HTMLInputElement | null>(null);
const userInput = ref('');

// Mascot image
const mascotLoaded = ref(true);
const mascotSrc = ref('/images/knight-mascot.png');

const messages = ref<ChatMessage[]>([]);
const formData = reactive<Record<string, string>>({});
const selectedMission = ref('');

// Sentiment
const currentSentiment = ref('neutral');
const sentimentText = ref('NEUTRE');

// Horloge
const currentTime = ref('');

let blinkInterval: number;
let timeInterval: number;

const updateTime = () => {
    const now = new Date();
    currentTime.value = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
    setTimeout(() => {
        showNotification.value = true;
    }, 1500);

    blinkInterval = window.setInterval(() => {
        isBlinking.value = true;
        setTimeout(() => isBlinking.value = false, 100);
    }, 2500 + Math.random() * 2000);

    updateTime();
    timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
    clearInterval(blinkInterval);
    clearInterval(timeInterval);
});

const talk = (duration: number) => {
    isTalking.value = true;
    setTimeout(() => isTalking.value = false, duration);
};

const toggleChat = () => {
    isChatOpen.value = !isChatOpen.value;
    if (isChatOpen.value && messages.value.length === 0) {
        startConversation();
    }
    showNotification.value = false;
};

const minimizeChat = () => {
    isChatOpen.value = false;
    setTimeout(() => {
        showNotification.value = true;
        notificationText.value = "Session en pause...";
    }, 300);
};

const dismissNotification = () => {
    showNotification.value = false;
};

const restoreClippy = () => {
    isHidden.value = false;
    setTimeout(() => {
        showNotification.value = true;
        notificationText.value = "Système restauré.";
    }, 200);
};

const scrollToBottom = async () => {
    await nextTick();
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
};

const addBotMessage = async (text: string, options?: ChatMessage['options'], fields?: ChatMessage['fields']) => {
    isTyping.value = true;
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
    isTyping.value = false;
    
    messages.value.push({ type: 'bot', text, options, fields });
    talk(text.length * 25);
    scrollToBottom();
};

const addUserMessage = (text: string) => {
    messages.value.push({ type: 'user', text });
    analyzeSentiment(text);
    scrollToBottom();
};

const analyzeSentiment = (text: string) => {
    const lower = text.toLowerCase();
    const positive = ['merci', 'super', 'génial', 'excellent', 'parfait', 'content', 'bien', 'cool', 'top', 'aimer'];
    const negative = ['problème', 'erreur', 'bug', 'nul', 'mauvais', 'déteste', 'énervé', 'impossible'];
    
    const posCount = positive.filter(w => lower.includes(w)).length;
    const negCount = negative.filter(w => lower.includes(w)).length;
    
    if (posCount > negCount) {
        currentSentiment.value = 'positive';
        sentimentText.value = 'POSITIF';
    } else if (negCount > posCount) {
        currentSentiment.value = 'negative';
        sentimentText.value = 'NÉGATIF';
    } else {
        currentSentiment.value = 'neutral';
        sentimentText.value = 'NEUTRE';
    }
};

// Fonction de réponse IA intelligente
const generateAIResponse = (userText: string): { text: string; options?: ChatMessage['options'] } => {
    const lower = userText.toLowerCase();
    
    // Détection d'intention par mots-clés
    if (lower.includes('contact') || lower.includes('joindre') || lower.includes('parler') || lower.includes('écrire')) {
        return {
            text: "Tu veux nous contacter ? Je peux t'aider !",
            options: [{ id: 'contact', label: 'Oui, contacter', icon: '✉️' }, { id: 'back', label: 'Non merci', icon: '↩️' }]
        };
    }
    
    if (lower.includes('don') || lower.includes('donner') || lower.includes('soutenir') || lower.includes('aider financ')) {
        return {
            text: "Tu souhaites faire un don ? C'est super généreux !",
            options: [{ id: 'donation', label: 'Faire un don', icon: '💝' }, { id: 'back', label: 'Plus tard', icon: '↩️' }]
        };
    }
    
    if (lower.includes('bénévo') || lower.includes('volontaire') || lower.includes('rejoindre') || lower.includes('participer')) {
        return {
            text: "Tu veux devenir bénévole ? On a besoin de gens comme toi !",
            options: [{ id: 'volunteer', label: 'Devenir bénévole', icon: '🤝' }, { id: 'back', label: 'Plus tard', icon: '↩️' }]
        };
    }
    
    if (lower.includes('info') || lower.includes('quoi') || lower.includes('qui') || lower.includes('comment') || lower.includes('pourquoi')) {
        return {
            text: "Tu veux en savoir plus sur le Nexus Connecté ?",
            options: [{ id: 'information', label: 'En savoir plus', icon: '📚' }, { id: 'back', label: 'Retour', icon: '↩️' }]
        };
    }
    
    if (lower.includes('merci') || lower.includes('super') || lower.includes('génial') || lower.includes('cool')) {
        return {
            text: "Avec plaisir ! 😊 Je suis là pour t'aider. Autre chose ?",
            options: [
                { id: 'contact', label: 'Contact', icon: '✉️' },
                { id: 'donation', label: 'Don', icon: '💝' },
                { id: 'volunteer', label: 'Bénévolat', icon: '🤝' },
                { id: 'bye', label: 'C\'est tout !', icon: '👋' }
            ]
        };
    }
    
    if (lower.includes('salut') || lower.includes('bonjour') || lower.includes('hello') || lower.includes('hey') || lower.includes('coucou')) {
        return {
            text: "Salut ! 👋 Je suis Nexus, ton assistant. Comment puis-je t'aider ?",
            options: [
                { id: 'contact', label: 'Contact', icon: '✉️' },
                { id: 'donation', label: 'Don', icon: '💝' },
                { id: 'volunteer', label: 'Bénévolat', icon: '🤝' },
                { id: 'information', label: 'Infos', icon: '📚' }
            ]
        };
    }
    
    if (lower.includes('bye') || lower.includes('au revoir') || lower.includes('ciao') || lower.includes('a+')) {
        return { text: "À bientôt ! 👋 N'hésite pas à revenir si tu as des questions." };
    }
    
    // Réponse par défaut
    return {
        text: "Je ne suis pas sûr de comprendre... Voici ce que je peux faire :",
        options: [
            { id: 'contact', label: 'Contact', icon: '✉️' },
            { id: 'donation', label: 'Don', icon: '💝' },
            { id: 'volunteer', label: 'Bénévolat', icon: '🤝' },
            { id: 'information', label: 'Infos', icon: '📚' }
        ]
    };
};

const sendMessage = async () => {
    const text = userInput.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    userInput.value = '';
    
    await new Promise(r => setTimeout(r, 300));
    
    const response = generateAIResponse(text);
    await addBotMessage(response.text, response.options);
};

const startConversation = async () => {
    await addBotMessage(
        "Initialisation... Bienvenue ! Je suis Nexus, l'assistant IA du Nexus Connecté. Sélectionnez une action :",
        [
            { id: 'contact', label: 'Contact', icon: '✉️' },
            { id: 'donation', label: 'Don', icon: '💝' },
            { id: 'volunteer', label: 'Bénévolat', icon: '🤝' },
            { id: 'information', label: 'Infos', icon: '📚' }
        ]
    );
};

const selectOption = async (option: { id: string; label: string; icon: string }) => {
    addUserMessage(`${option.icon} ${option.label}`);
    selectedMission.value = option.id;
    
    await new Promise(r => setTimeout(r, 200));
    
    switch (option.id) {
        case 'contact':
            await addBotMessage(
                "Module CONTACT activé. Veuillez renseigner les champs :",
                undefined,
                [
                    { name: 'name', label: 'NOM', type: 'text', placeholder: 'Votre nom' },
                    { name: 'email', label: 'EMAIL', type: 'email', placeholder: 'email@exemple.com' },
                    { name: 'message', label: 'MESSAGE', type: 'textarea', placeholder: 'Votre message...' }
                ]
            );
            break;
        case 'donation':
            await addBotMessage(
                "Module DON activé. Sélectionnez un montant :",
                [
                    { id: 'amount_10', label: '10€', icon: '💰' },
                    { id: 'amount_25', label: '25€', icon: '💰' },
                    { id: 'amount_50', label: '50€', icon: '💰' },
                    { id: 'amount_100', label: '100€', icon: '💎' },
                    { id: 'amount_custom', label: 'Autre', icon: '✏️' }
                ]
            );
            break;
        case 'volunteer':
            await addBotMessage(
                "Module BÉNÉVOLAT activé. Complétez votre profil :",
                undefined,
                [
                    { name: 'name', label: 'NOM', type: 'text', placeholder: 'Votre nom' },
                    { name: 'email', label: 'EMAIL', type: 'email', placeholder: 'email@exemple.com' },
                    { name: 'skills', label: 'COMPÉTENCES', type: 'select', placeholder: 'Sélectionner', options: ['Dev', 'Design', 'Com', 'Event', 'Autre'] },
                    { name: 'motivation', label: 'MOTIVATION', type: 'textarea', placeholder: 'Pourquoi rejoindre ?' }
                ]
            );
            break;
        case 'information':
            await addBotMessage(
                "Le Nexus Connecté : association pour le numérique responsable.\n> Événements, ateliers, sensibilisation.\n> Objectif : tech éthique et accessible.",
                [
                    { id: 'info_events', label: 'Events', icon: '🎉' },
                    { id: 'info_mission', label: 'Mission', icon: '🎯' },
                    { id: 'back', label: 'Retour', icon: '↩️' }
                ]
            );
            break;
        case 'amount_10':
        case 'amount_25':
        case 'amount_50':
        case 'amount_100':
            formData.amount = option.id.replace('amount_', '');
            await addBotMessage(
                `Montant: ${formData.amount}€. Choisissez la récurrence :`,
                [
                    { id: 'recurrence_once', label: 'Une fois', icon: '1️⃣' },
                    { id: 'recurrence_monthly', label: 'Mensuel', icon: '🔄' },
                    { id: 'recurrence_yearly', label: 'Annuel', icon: '📅' }
                ]
            );
            break;
        case 'recurrence_once':
        case 'recurrence_monthly':
        case 'recurrence_yearly':
            formData.recurrence = option.id.replace('recurrence_', '');
            const recurrenceLabel = formData.recurrence === 'once' ? 'unique' : 
                                    formData.recurrence === 'monthly' ? 'mensuel' : 'annuel';
            await addBotMessage(
                `Don ${recurrenceLabel} de ${formData.amount}€. Finalisez :`,
                undefined,
                [
                    { name: 'name', label: 'NOM', type: 'text', placeholder: 'Votre nom' },
                    { name: 'email', label: 'EMAIL', type: 'email', placeholder: 'email@exemple.com' }
                ]
            );
            break;
        case 'amount_custom':
            await addBotMessage(
                "Montant personnalisé :",
                undefined,
                [
                    { name: 'amount', label: 'MONTANT (€)', type: 'text', placeholder: '100' },
                    { name: 'name', label: 'NOM', type: 'text', placeholder: 'Votre nom' },
                    { name: 'email', label: 'EMAIL', type: 'email', placeholder: 'email@exemple.com' }
                ]
            );
            break;
        case 'info_events':
            await addBotMessage(
                "ÉVÉNEMENTS 2025:\n> Nuit de l'Info - ACTIF\n> Atelier IA - Janvier\n> Hackathon Éco - Février",
                [
                    { id: 'volunteer', label: 'Participer', icon: '✅' },
                    { id: 'back', label: 'Retour', icon: '↩️' }
                ]
            );
            break;
        case 'info_mission':
            await addBotMessage(
                "MISSION:\n> Numérique accessible\n> Éthique & durable\n> Formation pour tous",
                [
                    { id: 'volunteer', label: 'Rejoindre', icon: '🤝' },
                    { id: 'donation', label: 'Soutenir', icon: '💝' },
                    { id: 'back', label: 'Retour', icon: '↩️' }
                ]
            );
            break;
        case 'back':
            await startConversation();
            break;
        case 'bye':
            await addBotMessage("Session terminée. À bientôt !");
            setTimeout(() => {
                isChatOpen.value = false;
                showNotification.value = true;
                notificationText.value = "Merci de votre visite !";
            }, 1500);
            break;
    }
};

const submitFields = async () => {
    // Validation basique anti-spam
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
        await addBotMessage("[ERREUR] Email invalide. Veuillez réessayer.");
        return;
    }
    
    if (formData.name && formData.name.length < 2) {
        await addBotMessage("[ERREUR] Nom trop court. Minimum 2 caractères.");
        return;
    }
    
    // Détection spam basique
    const spamWords = ['viagra', 'casino', 'lottery', 'winner', 'click here'];
    const allText = Object.values(formData).join(' ').toLowerCase();
    if (spamWords.some(w => allText.includes(w))) {
        await addBotMessage("[ALERTE] Message suspect détecté. Transmission bloquée.");
        return;
    }
    
    const filled = Object.entries(formData)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join(' | ');
    
    addUserMessage(`[SUBMIT] ${filled}`);
    await new Promise(r => setTimeout(r, 400));
    
    // Envoi réel via EmailJS
    let emailSent = false;
    const name = formData.name || 'Utilisateur';
    
    // Construire le titre selon la mission
    let title = '';
    switch (selectedMission.value) {
        case 'contact':
            title = `Contact: ${formData.message?.substring(0, 50) || 'Message'}...`;
            break;
        case 'donation':
            title = `Don de ${formData.amount}€ (${formData.recurrence || 'unique'})`;
            break;
        case 'volunteer':
            title = `Candidature bénévole - ${formData.skills || 'Général'}`;
            break;
        default:
            title = `Demande d'information`;
    }
    
    try {
        const templateParams = {
            name: name,
            title: title
        };
        
        // Vérifie si les clés EmailJS sont configurées
        if (EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID') {
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );
            emailSent = true;
        }
    } catch (error) {
        console.error('Erreur EmailJS:', error);
    }
    
    const currentYear = new Date().getFullYear();
    const emailStatus = emailSent ? '📧 Email envoyé !' : '📧 (Mode démo - email non configuré)';
    let msg = '';
    
    switch (selectedMission.value) {
        case 'contact':
            msg = `═══════════════════════════════
🌟 TRANSMISSION RÉUSSIE 🌟
═══════════════════════════════

Salutations, ${name} ! 👋

Ton message a bien été acheminé vers nos serveurs centraux 📡.
Nos Agents de Support 🕵️ te répondront sous 24h.

📅 Ton soutien en ${currentYear} est crucial pour notre progression !

${emailStatus}

[STATUT: ENREGISTRÉ ✅]`;
            break;
        case 'donation':
            const recLabel = formData.recurrence === 'monthly' ? 'mensuel' : 
                            formData.recurrence === 'yearly' ? 'annuel' : 'unique';
            msg = `═══════════════════════════════
🏆 UN IMMENSE 'GG', ${name.toUpperCase()} ! 🏆
═══════════════════════════════

Ton Don de Ressources 💎 de ${formData.amount}€ (${recLabel}) est une bénédiction pour notre cause 🙏

Il permettra de financer :
> 🌍 Le projet "Numérique Responsable ${currentYear}"
> 🎓 Nos ateliers de formation gratuits
> 💻 L'infrastructure de nos services

${emailStatus}

[TRANSACTION SÉCURISÉE 🔐]`;
            break;
        case 'volunteer':
            msg = `═══════════════════════════════
🎉 BIENVENUE DANS LA GUILDE, ${name.toUpperCase()} ! 🎉
═══════════════════════════════

Tu rejoins officiellement les rangs des Bénévoles du Nexus ! 🛡️

Compétences enregistrées: ${formData.skills || 'Non spécifié'}

📅 Programme ${currentYear} :
> 🎊 Nuit de l'Info - Décembre ${currentYear}
> 🤖 Atelier IA Responsable - Janvier ${currentYear + 1}
> 🌱 Hackathon Écologique - Février ${currentYear + 1}

${emailStatus}

[RECRUTEMENT VALIDÉ ✅]`;
            break;
        default:
            msg = `═══════════════════════════════
✨ MERCI ${name.toUpperCase()} ! ✨
═══════════════════════════════

Données enregistrées avec succès.
Ton soutien en ${currentYear} compte énormément !

[STATUT: COMPLÉTÉ ✅]`;
    }
    
    await addBotMessage(msg);
    await new Promise(r => setTimeout(r, 1500));
    
    await addBotMessage(
        "Autre action ?",
        [
            { id: 'contact', label: 'Nouveau', icon: '💬' },
            { id: 'bye', label: 'Quitter', icon: '👋' }
        ]
    );
    
    Object.keys(formData).forEach(key => formData[key] = '');
};

watch(messages, () => scrollToBottom(), { deep: true });
</script>

<style scoped>
.clippy-container {
    position: fixed;
    bottom: 60px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    font-family: 'Courier New', monospace;
}

/* Mascotte style pixel */
.clippy-mascot {
    width: 100px;
    height: 100px;
    cursor: pointer;
    position: relative;
}

.knight-sprite {
    width: 100%;
    height: 100%;
    position: relative;
}

.knight-glow {
    position: absolute;
    inset: -8px;
    background: #00bfff;
    opacity: 0.2;
    border-radius: 50%;
    animation: glow-pulse 2s ease-in-out infinite;
}

.knight-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 8px rgba(0, 191, 255, 0.6));
    transition: transform 0.2s ease;
}

.knight-img.idle,
.knight-fallback.idle {
    animation: idle-float 3s ease-in-out infinite;
}

.knight-img.talking,
.knight-fallback.talking {
    animation: knight-talk 0.3s ease-in-out infinite;
}

.knight-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    filter: drop-shadow(0 0 8px rgba(0, 191, 255, 0.6));
    transition: transform 0.2s ease;
}

@keyframes knight-talk {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.02) rotate(-2deg); }
    75% { transform: scale(1.02) rotate(2deg); }
}

.clippy-mascot:hover .knight-img,
.clippy-mascot:hover .knight-fallback {
    transform: scale(1.1);
    filter: drop-shadow(0 0 15px rgba(0, 191, 255, 0.8));
}

.clippy-mascot:hover .knight-glow {
    opacity: 0.4;
}

@keyframes glow-pulse {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50% { opacity: 0.25; transform: scale(1.05); }
}

@keyframes idle-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

.status-led {
    position: absolute;
    bottom: 0;
    right: 5px;
    width: 8px;
    height: 8px;
    background: #444;
    border: 2px solid #666;
    border-radius: 50%;
}

.status-led.active {
    background: #00ff88;
    box-shadow: 0 0 8px #00ff88;
    animation: led-blink 1s ease-in-out infinite;
}

@keyframes led-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

/* Notification style terminal */
.clippy-notification {
    background: #0a0a0a;
    border: 2px solid #00ff88;
    padding: 8px 30px 8px 12px;
    max-width: 220px;
    color: #00ff88;
    font-size: 12px;
    cursor: pointer;
    position: relative;
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
}

.notif-prefix {
    color: #ff1493;
    margin-right: 5px;
}

.notif-text {
    color: #ccc;
}

.notif-close {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    font-size: 16px;
    cursor: pointer;
    font-family: inherit;
}

.notif-close:hover {
    color: #ff1493;
}

/* Terminal chat */
.clippy-terminal {
    width: 350px;
    max-height: 450px;
    background: #0a0a0a;
    border: 2px solid #00ff88;
    display: flex;
    flex-direction: column;
    box-shadow: 
        0 0 20px rgba(0, 255, 136, 0.3),
        inset 0 0 50px rgba(0, 255, 136, 0.03);
}

.terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    background: #111;
    border-bottom: 2px solid #00ff88;
}

.terminal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #00ff88;
    font-size: 12px;
}

.terminal-icon {
    font-size: 16px;
}

.terminal-controls {
    display: flex;
    gap: 5px;
}

.ctrl-btn {
    width: 20px;
    height: 20px;
    border: 1px solid #333;
    background: #1a1a1a;
    color: #888;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ctrl-btn:hover {
    background: #2a2a2a;
    color: #fff;
}

.ctrl-btn.close:hover {
    background: #ff1493;
    border-color: #ff1493;
}

.terminal-body {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 320px;
    font-size: 12px;
}

.terminal-line {
    display: flex;
    gap: 8px;
    align-items: flex-start;
}

.line-prefix {
    color: #00ff88;
    flex-shrink: 0;
    font-weight: bold;
}

.line-prefix.user {
    color: #00d4ff;
}

.line-content {
    flex: 1;
    color: #ccc;
}

.line-content p {
    margin: 0;
    line-height: 1.5;
    white-space: pre-line;
}

.terminal-line.user .line-content {
    color: #00d4ff;
}

/* Options grid */
.option-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.retro-btn {
    background: #1a1a1a;
    border: 1px solid #00ff88;
    color: #00ff88;
    padding: 6px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s;
}

.retro-btn:hover {
    background: #00ff88;
    color: #000;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.btn-icon {
    font-size: 12px;
}

/* Form block */
.form-block {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.form-field label {
    color: #ff1493;
    font-size: 10px;
}

.dos-input,
.dos-textarea,
.dos-select {
    background: #000;
    border: 1px solid #333;
    color: #00ff88;
    padding: 6px 8px;
    font-family: inherit;
    font-size: 12px;
}

.dos-input:focus,
.dos-textarea:focus,
.dos-select:focus {
    outline: none;
    border-color: #00ff88;
    box-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
}

.dos-textarea {
    resize: none;
}

.dos-select {
    cursor: pointer;
}

.dos-select option {
    background: #0a0a0a;
}

.submit-btn {
    background: #ff1493;
    border: none;
    color: #fff;
    padding: 8px;
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    margin-top: 5px;
    transition: all 0.15s;
}

.submit-btn:hover {
    background: #ff69b4;
    box-shadow: 0 0 10px rgba(255, 20, 147, 0.5);
}

/* Typing */
.terminal-line.typing {
    color: #00ff88;
}

.typing-cursor {
    animation: cursor-blink 0.8s step-end infinite;
}

@keyframes cursor-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

/* Status bar */
.terminal-status {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    background: #111;
    border-top: 1px solid #333;
    font-size: 10px;
    color: #666;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 5px;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.status-dot.positive { background: #00ff88; box-shadow: 0 0 5px #00ff88; }
.status-dot.neutral { background: #ffcc00; box-shadow: 0 0 5px #ffcc00; }
.status-dot.negative { background: #ff4444; box-shadow: 0 0 5px #ff4444; }

/* Input bar */
.terminal-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: #0a0a0a;
    border-top: 1px solid #333;
}

.input-prefix {
    color: #00d4ff;
    font-size: 12px;
    font-weight: bold;
    flex-shrink: 0;
}

.chat-input {
    flex: 1;
    background: #000;
    border: 1px solid #333;
    color: #00ff88;
    padding: 6px 10px;
    font-family: inherit;
    font-size: 12px;
}

.chat-input:focus {
    outline: none;
    border-color: #00ff88;
    box-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
}

.chat-input::placeholder {
    color: #555;
}

.send-btn {
    background: #00ff88;
    border: none;
    color: #000;
    width: 28px;
    height: 28px;
    font-size: 14px;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}

.send-btn:hover {
    background: #00cc6a;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

/* Restore button */
.clippy-restore {
    position: fixed;
    bottom: 60px;
    right: 20px;
    width: 45px;
    height: 45px;
    background: #1a1a1a;
    border: 2px solid #00ff88;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
}

.clippy-restore:hover {
    background: #00ff88;
}

.restore-icon {
    font-size: 22px;
}

/* Scrollbar */
.terminal-body::-webkit-scrollbar {
    width: 8px;
}

.terminal-body::-webkit-scrollbar-track {
    background: #0a0a0a;
}

.terminal-body::-webkit-scrollbar-thumb {
    background: #333;
    border: 1px solid #00ff88;
}

.terminal-body::-webkit-scrollbar-thumb:hover {
    background: #00ff88;
}

/* Responsive Design */
@media (max-width: 480px) {
    .clippy-container {
        bottom: 10px;
        right: 10px;
        left: 10px;
    }
    
    .clippy-terminal {
        width: calc(100vw - 20px);
        max-width: 100%;
        max-height: 70vh;
    }
    
    .clippy-mascot {
        width: 55px;
        height: 55px;
    }
    
    .axolotl-body {
        width: 48px;
        height: 44px;
    }
    
    .terminal-body {
        max-height: 45vh;
    }
    
    .clippy-notification {
        max-width: calc(100vw - 90px);
    }
    
    .option-grid {
        flex-direction: column;
    }
    
    .retro-btn {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 768px) and (min-width: 481px) {
    .clippy-terminal {
        width: 320px;
    }
    
    .terminal-body {
        max-height: 280px;
    }
}

@media (min-width: 769px) {
    .clippy-terminal {
        width: 380px;
    }
}
</style>
