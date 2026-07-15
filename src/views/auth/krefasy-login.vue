<template>
    <div class="auth-page">
        <!-- Painel de marca -->
        <aside class="auth-brand">
            <div class="brand-bg">
                <div class="orb orb-1"></div>
                <div class="orb orb-2"></div>
                <div class="grid-pattern"></div>
            </div>

            <div class="brand-content">
                <div class="brand-logo">
                    <img src="/assets/images/logo.svg" alt="Krefasy" class="logo" />
                    <span class="brand-name">Krefasy</span>
                </div>

                <div class="brand-message">
                    <h2 class="brand-title">Gestão inteligente de créditos</h2>
                    <p class="brand-description">
                        Acesse o backoffice para administrar clientes, empréstimos e operações com total controle e segurança.
                    </p>
                </div>

                <ul class="brand-features">
                    <li>
                        <span class="feature-dot"></span>
                        Dashboard em tempo real
                    </li>
                    <li>
                        <span class="feature-dot"></span>
                        Controle de parcelas e inadimplência
                    </li>
                    <li>
                        <span class="feature-dot"></span>
                        Acesso para administradores e partners
                    </li>
                </ul>
            </div>
        </aside>

        <!-- Formulário -->
        <main class="auth-main">
            <div class="auth-card">
                <div class="auth-header">
                    <div class="mobile-logo">
                        <img src="/assets/images/logo.svg" alt="Krefasy" class="logo-sm" />
                    </div>
                    <h1 class="welcome-title">Bem-vindo de volta</h1>
                    <p class="welcome-subtitle">Entre com suas credenciais para acessar o backoffice</p>
                </div>

                <form class="auth-form" @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label for="email" class="form-label">Email</label>
                        <div class="input-group" :class="{ 'has-error': errors.email }">
                            <icon-mail class="input-icon" />
                            <input
                                id="email"
                                v-model="form.email"
                                type="email"
                                class="form-input"
                                placeholder="seu@email.com"
                                autocomplete="email"
                                @keyup.enter="handleLogin"
                            />
                        </div>
                        <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
                    </div>

                    <div class="form-group">
                        <label for="password" class="form-label">Senha</label>
                        <div class="input-group" :class="{ 'has-error': errors.password }">
                            <icon-lock class="input-icon" />
                            <input
                                id="password"
                                v-model="form.password"
                                :type="showPassword ? 'text' : 'password'"
                                class="form-input"
                                placeholder="••••••••"
                                autocomplete="current-password"
                                @keyup.enter="handleLogin"
                            />
                            <button
                                type="button"
                                class="toggle-password"
                                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                                @click="showPassword = !showPassword"
                            >
                                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </button>
                        </div>
                        <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
                    </div>

                    <button
                        type="submit"
                        class="btn-submit"
                        :disabled="loading"
                    >
                        <span v-if="loading" class="loading-spinner"></span>
                        {{ loading ? 'Entrando...' : 'Entrar no backoffice' }}
                    </button>

                    <Transition name="fade">
                        <div v-if="errorMessage" class="error-alert">
                            <icon-info-circle class="error-icon" />
                            <span>{{ errorMessage }}</span>
                        </div>
                    </Transition>
                </form>

                <footer class="auth-footer">
                    <p class="footer-text">Acesso reservado a administradores e partners</p>
                    <p class="footer-version">v1.0.0</p>
                </footer>
            </div>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useKrefasyStore } from '@/stores/index';
import IconMail from '@/components/icon/icon-mail.vue';
import IconLock from '@/components/icon/icon-lock.vue';
import IconInfoCircle from '@/components/icon/icon-info-circle.vue';

const router = useRouter();
const krefasyStore = useKrefasyStore();

const form = reactive({
    email: '',
    password: ''
});

const errors = reactive({
    email: '',
    password: ''
});

const loading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);

const validateForm = (): boolean => {
    let isValid = true;
    errors.email = '';
    errors.password = '';

    if (!form.email.trim()) {
        errors.email = 'Email é obrigatório';
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Email inválido';
        isValid = false;
    }

    if (!form.password.trim()) {
        errors.password = 'Senha é obrigatória';
        isValid = false;
    } else if (form.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
        isValid = false;
    }

    return isValid;
};

const handleLogin = async () => {
    if (!validateForm()) return;

    try {
        loading.value = true;
        errorMessage.value = '';

        await krefasyStore.login(form.email, form.password);
        router.push('/dashboard');
    } catch (error: any) {
        errorMessage.value = error.message || 'Erro ao fazer login. Tente novamente.';
        console.error('Erro no login:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    const isAuth = await krefasyStore.checkAuth();
    if (isAuth) {
        router.push('/dashboard');
    }
});
</script>

<style scoped>
.auth-page {
    --krefasy-purple-glow: rgba(128, 31, 130, 0.35);
    --text-primary: var(--krefasy-text);
    --text-secondary: var(--krefasy-text-muted);
    --surface: var(--krefasy-surface);
    --border: var(--krefasy-border);
    --error: #dc2626;

    display: flex;
    min-height: 100vh;
    background: var(--krefasy-surface);
}

/* ── Painel de marca ── */
.auth-brand {
    position: relative;
    display: none;
    flex: 1;
    background: var(--krefasy-navy);
    overflow: hidden;
}

.brand-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: float 8s ease-in-out infinite;
}

.orb-1 {
    width: 420px;
    height: 420px;
    background: var(--krefasy-purple);
    opacity: 0.45;
    top: -10%;
    right: -15%;
}

.orb-2 {
    width: 300px;
    height: 300px;
    background: var(--krefasy-purple-light);
    opacity: 0.25;
    bottom: 10%;
    left: -10%;
    animation-delay: -4s;
}

.grid-pattern {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
}

.brand-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    padding: 64px;
    max-width: 560px;
    margin: 0 auto;
}

.brand-logo {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 48px;
}

.logo {
    width: 52px;
    height: 52px;
    filter: drop-shadow(0 4px 12px rgba(128, 31, 130, 0.4));
}

.brand-name {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
}

.brand-message {
    margin-bottom: 40px;
}

.brand-title {
    font-size: 36px;
    font-weight: 700;
    color: #fff;
    line-height: 1.2;
    margin: 0 0 16px;
    letter-spacing: -0.03em;
}

.brand-description {
    font-size: 17px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.65);
    margin: 0;
}

.brand-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.brand-features li {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.8);
}

.feature-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--krefasy-purple);
    box-shadow: 0 0 12px var(--krefasy-purple-glow);
    flex-shrink: 0;
}

/* ── Área do formulário ── */
.auth-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    background: var(--krefasy-surface-muted);
}

.auth-card {
    width: 100%;
    max-width: 440px;
    background: var(--surface);
    border-radius: 20px;
    padding: 48px 40px;
    box-shadow:
        0 1px 3px rgba(14, 17, 51, 0.04),
        0 8px 32px rgba(14, 17, 51, 0.06);
    border: 1px solid var(--border);
}

.auth-header {
    margin-bottom: 36px;
}

.mobile-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
}

.logo-sm {
    width: 44px;
    height: 44px;
}

.welcome-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px;
    letter-spacing: -0.02em;
}

.welcome-subtitle {
    font-size: 15px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 22px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 0.01em;
}

.input-group {
    position: relative;
    display: flex;
    align-items: center;
}

.input-group.has-error .form-input {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.08);
}

.input-icon {
    position: absolute;
    left: 14px;
    width: 18px;
    height: 18px;
    color: #94a3b8;
    pointer-events: none;
    transition: color 0.2s;
}

.input-group:focus-within .input-icon {
    color: var(--krefasy-purple);
}

.form-input {
    width: 100%;
    padding: 13px 44px 13px 42px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-size: 15px;
    color: var(--text-primary);
    background: #fafbfc;
    transition: all 0.2s ease;
    box-sizing: border-box;
}

.form-input::placeholder {
    color: #94a3b8;
}

.form-input:focus {
    outline: none;
    border-color: var(--krefasy-purple);
    background: var(--surface);
    box-shadow: 0 0 0 3px var(--krefasy-purple-glow);
}

.toggle-password {
    position: absolute;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
}

.toggle-password svg {
    width: 18px;
    height: 18px;
}

.toggle-password:hover {
    color: var(--krefasy-purple);
    background: rgba(128, 31, 130, 0.06);
}

.error-message {
    font-size: 12px;
    color: var(--error);
}

.btn-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 14px 24px;
    margin-top: 8px;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    background: linear-gradient(135deg, var(--krefasy-purple) 0%, #5c1760 100%);
    box-shadow: 0 4px 16px var(--krefasy-purple-glow);
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
    min-height: 50px;
}

.btn-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(128, 31, 130, 0.45);
}

.btn-submit:active:not(:disabled) {
    transform: translateY(0);
}

.btn-submit:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.loading-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin-right: 10px;
}

.error-alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    color: #b91c1c;
    font-size: 13px;
    line-height: 1.4;
}

.error-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-top: 1px;
}

.auth-footer {
    margin-top: 36px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    text-align: center;
}

.footer-text {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0 0 6px;
}

.footer-version {
    font-size: 11px;
    color: #94a3b8;
    margin: 0;
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* ── Animations ── */
@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(20px, -20px) scale(1.05); }
}

/* ── Dark mode ── */
:global(.dark) .auth-main {
    background: var(--krefasy-surface-muted);
}

:global(.dark) .auth-card {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:global(.dark) .form-input {
    background: var(--krefasy-surface-muted);
    border-color: var(--krefasy-border);
    color: var(--krefasy-text);
}

:global(.dark) .form-input:focus {
    background: var(--krefasy-surface);
}

/* ── Responsivo ── */
@media (min-width: 1024px) {
    .auth-brand {
        display: flex;
    }

    .mobile-logo {
        display: none;
    }

    .auth-main {
        flex: 0 0 520px;
        max-width: 520px;
    }
}

@media (max-width: 480px) {
    .auth-card {
        padding: 32px 24px;
        border-radius: 16px;
        box-shadow: none;
        border: none;
        background: transparent;
    }

    .auth-main {
        padding: 24px 16px;
        background: linear-gradient(180deg, var(--krefasy-navy) 0%, #f8fafc 35%);
    }

    .welcome-title {
        font-size: 24px;
        text-align: center;
    }

    .welcome-subtitle {
        text-align: center;
    }

    .auth-header {
        margin-bottom: 28px;
    }
}
</style>
