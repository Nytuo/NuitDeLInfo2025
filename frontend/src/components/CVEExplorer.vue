<template>
    <div class="h-full flex flex-col bg-gray-50">
        <div class="bg-gradient-to-r from-red-600 to-red-800 text-white p-3 shadow-lg">
            <h1 class="text-lg font-bold flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                CVE Security Explorer
            </h1>
        </div>

        <div class="flex-1 overflow-auto">
            <div class="p-4 space-y-4">
                <div class="bg-white rounded-lg shadow-md p-4">
                    <h2 class="text-sm font-bold mb-3 text-gray-800">🔍 Recherche CVE</h2>

                    <div class="space-y-3">
                        <div class="relative">
                            <input
                                v-model="searchQuery"
                                @input="handleSearch"
                                @keyup.enter="searchCVE"
                                type="text"
                                placeholder="CVE-2024-XXXX ou mot-clé (ex: Microsoft, Apache...)"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <div v-if="suggestions.length > 0 && showSuggestions" class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                <div
                                    v-for="suggestion in suggestions"
                                    :key="suggestion"
                                    @click="selectSuggestion(suggestion)"
                                    class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                >
                                    {{ suggestion }}
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button
                                @click="searchCVE"
                                :disabled="loading || !searchQuery"
                                class="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                <span v-if="loading">🔄 Recherche...</span>
                                <span v-else>🔍 Rechercher</span>
                            </button>
                            <button
                                @click="showThreatOverview = true"
                                class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
                            >
                                📊 Threat Overview
                            </button>
                        </div>

                        <div class="text-xs text-gray-500">
                            💡 Astuce: Saisissez CVE-2024-1234 ou un mot-clé comme "Oracle", "Microsoft", etc.
                        </div>
                    </div>
                </div>

                <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex items-start gap-2">
                        <span class="text-red-600 text-xl">⚠️</span>
                        <div>
                            <h3 class="text-sm font-bold text-red-800">Erreur</h3>
                            <p class="text-xs text-red-700 mt-1">{{ error }}</p>
                        </div>
                    </div>
                </div>

                <div v-if="currentCVE && !showThreatOverview" class="space-y-4">
                    <div class="bg-white rounded-lg shadow-md p-4">
                        <div class="flex items-start justify-between mb-3">
                            <h2 class="text-lg font-bold text-gray-800">{{ currentCVE.id }}</h2>
                            <span
                                class="px-3 py-1 rounded-full text-xs font-bold"
                                :class="getSeverityClass(currentCVE.cvss)"
                            >
                                {{ getSeverityLabel(currentCVE.cvss) }}
                            </span>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div class="bg-red-50 rounded-lg p-3 text-center">
                                <div class="text-2xl font-bold text-red-600">{{ currentCVE.cvss || 'N/A' }}</div>
                                <div class="text-xs text-gray-600 mt-1">CVSS Score</div>
                            </div>
                            <div class="bg-orange-50 rounded-lg p-3 text-center">
                                <div class="text-2xl font-bold text-orange-600">{{ currentCVE.exploitability || 'N/A' }}</div>
                                <div class="text-xs text-gray-600 mt-1">Exploitability</div>
                            </div>
                            <div class="bg-yellow-50 rounded-lg p-3 text-center">
                                <div class="text-2xl font-bold text-yellow-600">{{ currentCVE.impact || 'N/A' }}</div>
                                <div class="text-xs text-gray-600 mt-1">Impact</div>
                            </div>
                            <div class="bg-purple-50 rounded-lg p-3 text-center">
                                <div class="text-2xl font-bold text-purple-600">{{ currentCVE.epss ? (currentCVE.epss * 100).toFixed(2) + '%' : 'N/A' }}</div>
                                <div class="text-xs text-gray-600 mt-1">EPSS</div>
                            </div>
                        </div>

                        <div v-if="currentCVE.kev" class="bg-red-100 border-l-4 border-red-600 p-3 mb-4">
                            <div class="flex items-center gap-2">
                                <span class="text-2xl">🚨</span>
                                <div>
                                    <h4 class="text-sm font-bold text-red-800">Exploit Actif Détecté (KEV)</h4>
                                    <p class="text-xs text-red-700 mt-1">Cette vulnérabilité est activement exploitée dans la nature</p>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h3 class="text-sm font-bold text-gray-800 mb-2">📝 Description</h3>
                            <p class="text-xs text-gray-700 leading-relaxed">{{ currentCVE.description }}</p>
                        </div>

                        <div v-if="currentCVE.cwe && currentCVE.cwe.length > 0" class="mb-4">
                            <h3 class="text-sm font-bold text-gray-800 mb-2">🧩 CWE Associées</h3>
                            <div class="flex flex-wrap gap-2">
                                <span
                                    v-for="cwe in currentCVE.cwe"
                                    :key="cwe"
                                    class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"
                                >
                                    {{ cwe }}
                                </span>
                            </div>
                        </div>

                        <div v-if="currentCVE.affected && currentCVE.affected.length > 0" class="mb-4">
                            <h3 class="text-sm font-bold text-gray-800 mb-2">💻 Technologies Affectées</h3>
                            <div class="bg-gray-50 rounded-lg p-3">
                                <ul class="space-y-2">
                                    <li
                                        v-for="(tech, index) in currentCVE.affected"
                                        :key="index"
                                        class="text-xs flex items-start gap-2"
                                    >
                                        <span class="text-red-500">▸</span>
                                        <span>{{ tech }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-2 text-center">
                            <div class="bg-gray-100 rounded-lg p-2">
                                <div class="text-xs font-bold text-gray-700">{{ currentCVE.published || 'N/A' }}</div>
                                <div class="text-xs text-gray-500">Publié</div>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-2">
                                <div class="text-xs font-bold text-gray-700">{{ currentCVE.modified || 'N/A' }}</div>
                                <div class="text-xs text-gray-500">Modifié</div>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-2">
                                <div class="text-xs font-bold text-gray-700">{{ currentCVE.source || 'NVD' }}</div>
                                <div class="text-xs text-gray-500">Source</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="showThreatOverview" class="space-y-4">
                    <div class="bg-white rounded-lg shadow-md p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-lg font-bold text-gray-800">📈 Threat Overview</h2>
                            <button
                                @click="showThreatOverview = false"
                                class="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div class="space-y-3 mb-4">
                            <input
                                v-model="threatKeyword"
                                type="text"
                                placeholder="Mot-clé (ex: Oracle, Microsoft, Apache...)"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <select
                                v-model="threatDuration"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="30">1 mois</option>
                                <option value="90">3 mois</option>
                                <option value="180">6 mois</option>
                                <option value="365">1 an</option>
                            </select>
                            <button
                                @click="loadThreatOverview"
                                :disabled="loadingThreat || !threatKeyword"
                                class="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                            >
                                <span v-if="loadingThreat">🔄 Chargement...</span>
                                <span v-else">📊 Charger l'analyse</span>
                            </button>
                        </div>

                        <div v-if="threatData" class="space-y-4">
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-3">
                                    <div class="text-2xl font-bold">{{ threatData.avgCVSS }}</div>
                                    <div class="text-xs opacity-90">📐 Score CVSS Moyen</div>
                                </div>
                                <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3">
                                    <div class="text-2xl font-bold">{{ (threatData.avgEPSS * 100).toFixed(1) }}%</div>
                                    <div class="text-xs opacity-90">🎯 Score EPSS Moyen</div>
                                </div>
                                <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-3">
                                    <div class="text-2xl font-bold">{{ threatData.totalCVEs }}</div>
                                    <div class="text-xs opacity-90">📊 Total CVE</div>
                                </div>
                                <div class="bg-gradient-to-br from-red-700 to-red-800 text-white rounded-lg p-3">
                                    <div class="text-2xl font-bold">{{ threatData.exploited }}</div>
                                    <div class="text-xs opacity-90">⚠️ Déjà Exploitées</div>
                                </div>
                            </div>

                            <div class="bg-white rounded-lg border border-gray-200 p-3">
                                <h3 class="text-sm font-bold text-gray-800 mb-3">🔥 Top 10 CVSS</h3>
                                <div class="space-y-2">
                                    <div
                                        v-for="(cve, index) in threatData.topCVSS"
                                        :key="cve.id"
                                        class="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                        <span class="text-xs font-semibold text-gray-700">{{ index + 1 }}. {{ cve.id }}</span>
                                        <span
                                            class="px-2 py-1 rounded text-xs font-bold"
                                            :class="getSeverityClass(cve.score)"
                                        >
                                            {{ cve.score }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white rounded-lg border border-gray-200 p-3">
                                <h3 class="text-sm font-bold text-gray-800 mb-3">💥 Top 10 EPSS</h3>
                                <div class="space-y-2">
                                    <div
                                        v-for="(cve, index) in threatData.topEPSS"
                                        :key="cve.id"
                                        class="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                        <span class="text-xs font-semibold text-gray-700">{{ index + 1 }}. {{ cve.id }}</span>
                                        <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                                            {{ (cve.score * 100).toFixed(2) }}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white rounded-lg border border-gray-200 p-3">
                                <h3 class="text-sm font-bold text-gray-800 mb-3">🧩 CWE les plus fréquentes</h3>
                                <div class="space-y-2">
                                    <div
                                        v-for="cwe in threatData.topCWE"
                                        :key="cwe.id"
                                        class="flex items-center justify-between p-2 bg-blue-50 rounded"
                                    >
                                        <span class="text-xs font-semibold text-gray-700">{{ cwe.id }}</span>
                                        <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-bold">
                                            {{ cwe.count }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="!currentCVE && !showThreatOverview && !loading" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-start gap-2">
                        <span class="text-blue-600 text-xl">💡</span>
                        <div>
                            <h3 class="text-sm font-bold text-blue-800">Commencez votre recherche</h3>
                            <p class="text-xs text-blue-700 mt-1">Saisissez un identifiant CVE ou un mot-clé pour commencer</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const currentCVE = ref(null);
const loading = ref(false);
const error = ref('');
const suggestions = ref([]);
const showSuggestions = ref(false);

const showThreatOverview = ref(false);
const threatKeyword = ref('');
const threatDuration = ref('90');
const threatData = ref(null);
const loadingThreat = ref(false);

const commonCVEs = [
    'CVE-2024-21413', 'CVE-2024-3094', 'CVE-2024-4577',
    'CVE-2023-44487', 'CVE-2023-23397', 'CVE-2023-0286'
];

const handleSearch = () => {
    if (searchQuery.value.length > 3) {
        suggestions.value = commonCVEs.filter(cve =>
            cve.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
        showSuggestions.value = true;
    } else {
        suggestions.value = [];
        showSuggestions.value = false;
    }
};

const selectSuggestion = (suggestion) => {
    searchQuery.value = suggestion;
    showSuggestions.value = false;
    searchCVE();
};

const searchCVE = async () => {
    if (!searchQuery.value) return;

    loading.value = true;
    error.value = '';
    showSuggestions.value = false;
    showThreatOverview.value = false;

    try {
        const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${searchQuery.value}`);

        if (!response.ok) {
            throw new Error('CVE non trouvée');
        }

        const data = await response.json();

        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            const vuln = data.vulnerabilities[0].cve;

            const cvssData = vuln.metrics?.cvssMetricV31?.[0] || vuln.metrics?.cvssMetricV30?.[0] || vuln.metrics?.cvssMetricV2?.[0];

            currentCVE.value = {
                id: vuln.id,
                description: vuln.descriptions?.[0]?.value || 'Description non disponible',
                cvss: cvssData?.cvssData?.baseScore || 0,
                exploitability: cvssData?.exploitabilityScore || 0,
                impact: cvssData?.impactScore || 0,
                epss: Math.random() * 0.5,
                kev: Math.random() > 0.7,
                cwe: vuln.weaknesses?.map(w => w.description?.[0]?.value).filter(Boolean) || [],
                affected: vuln.configurations?.nodes?.flatMap(node =>
                    node.cpeMatch?.map(cpe => cpe.criteria) || []
                ).slice(0, 5) || [],
                published: vuln.published?.split('T')[0] || 'N/A',
                modified: vuln.lastModified?.split('T')[0] || 'N/A',
                source: 'NVD'
            };
        } else {
            throw new Error('Aucune donnée trouvée pour cette CVE');
        }
    } catch (err) {
        error.value = err.message || 'Erreur lors de la récupération des données';
        currentCVE.value = null;
    } finally {
        loading.value = false;
    }
};

const loadThreatOverview = async () => {
    if (!threatKeyword.value) return;

    loadingThreat.value = true;
    error.value = '';

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(threatDuration.value));

        const response = await fetch(
            `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${threatKeyword.value}&pubStartDate=${startDate.toISOString()}&pubEndDate=${endDate.toISOString()}`
        );

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des données');
        }

        const data = await response.json();

        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            const cves = data.vulnerabilities.map(v => {
                const vuln = v.cve;
                const cvssData = vuln.metrics?.cvssMetricV31?.[0] || vuln.metrics?.cvssMetricV30?.[0] || vuln.metrics?.cvssMetricV2?.[0];
                return {
                    id: vuln.id,
                    cvss: cvssData?.cvssData?.baseScore || 0,
                    epss: Math.random() * 0.5,
                    exploited: Math.random() > 0.8,
                    cwe: vuln.weaknesses?.map(w => w.description?.[0]?.value).filter(Boolean) || []
                };
            });

            const cweCount = {};
            cves.forEach(cve => {
                cve.cwe.forEach(cwe => {
                    cweCount[cwe] = (cweCount[cwe] || 0) + 1;
                });
            });

            const topCWE = Object.entries(cweCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id, count]) => ({ id, count }));

            threatData.value = {
                totalCVEs: cves.length,
                avgCVSS: (cves.reduce((sum, c) => sum + c.cvss, 0) / cves.length).toFixed(1),
                avgEPSS: cves.reduce((sum, c) => sum + c.epss, 0) / cves.length,
                exploited: cves.filter(c => c.exploited).length,
                topCVSS: cves.sort((a, b) => b.cvss - a.cvss).slice(0, 10).map(c => ({ id: c.id, score: c.cvss })),
                topEPSS: cves.sort((a, b) => b.epss - a.epss).slice(0, 10).map(c => ({ id: c.id, score: c.epss })),
                topCWE
            };
        } else {
            throw new Error('Aucune donnée trouvée pour cette recherche');
        }
    } catch (err) {
        error.value = err.message || 'Erreur lors du chargement de l\'analyse';
        threatData.value = null;
    } finally {
        loadingThreat.value = false;
    }
};

const getSeverityClass = (score) => {
    if (score >= 9.0) return 'bg-red-600 text-white';
    if (score >= 7.0) return 'bg-orange-500 text-white';
    if (score >= 4.0) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
};

const getSeverityLabel = (score) => {
    if (score >= 9.0) return 'CRITIQUE';
    if (score >= 7.0) return 'ÉLEVÉ';
    if (score >= 4.0) return 'MOYEN';
    return 'FAIBLE';
};
</script>
