<template>
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-header">
                <div class="logo-container">
                    <img src="/assets/images/logo.svg" alt="Krefasy" class="logo" />
                    <h1 class="brand-name">Krefasy</h1>
                </div>
                <p class="subtitle">Backoffice de Gestão de Créditos</p>
            </div>

            <div class="auth-form">
                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <div class="input-group">
                        <icon-mail class="input-icon" />
                        <input
                            id="email"
                            v-model="form.email"
                            type="email"
                            class="form-input"
                            :class="{ 'error': errors.email }"
                            placeholder="Digite seu email"
                            @keyup.enter="handleLogin"
                        />
                    </div>
                    <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Senha</label>
                    <div class="input-group">
                        <icon-lock class="input-icon" />
                        <input
                            id="password"
                            v-model="form.password"
                            type="password"
                            class="form-input"
                            :class="{ 'error': errors.password }"
                            placeholder="Digite sua senha"
                            @keyup.enter="handleLogin"
                        />
                    </div>
                    <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
                </div>

                <div class="form-actions">
                    <button
                        type="button"
                        class="btn btn-primary btn-block"
                        :disabled="loading"
                        @click="handleLogin"
                    >
                        <span v-if="loading" class="loading-spinner"></span>
                        {{ loading ? 'Entrando...' : 'Entrar' }}
                    </button>
                </div>

                <div v-if="errorMessage" class="error-alert">
                    <icon-info-circle class="error-icon" />
                    {{ errorMessage }}
                </div>
            </div>

            <div class="auth-footer">
                <p class="footer-text">
                    Apenas administradores podem acessar o backoffice
                </p>
                <p class="footer-version">v1.0.0</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useKrefasyStore } from '@/stores/index';
import IconMail from '@/components/icon/icon-mail.vue';
import IconLock from '@/components/icon/icon-lock.vue';
import IconInfoCircle from '@/components/icon/icon-info-circle.vue';

// Router e Store
const router = useRouter();
const krefasyStore = useKrefasyStore();

// Estado do formulário
const form = reactive({
    email: '',
    password: ''
});

// Estado da validação
const errors = reactive({
    email: '',
    password: ''
});

// Estado da UI
const loading = ref(false);
const errorMessage = ref('');

// Validação do formulário
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

// Login
const handleLogin = async () => {
    if (!validateForm()) return;

    try {
        loading.value = true;
        errorMessage.value = '';

        await krefasyStore.login(form.email, form.password);

        // Redirecionar para o dashboard
        router.push('/dashboard');

    } catch (error: any) {
        errorMessage.value = error.message || 'Erro ao fazer login. Tente novamente.';
        console.error('Erro no login:', error);
    } finally {
        loading.value = false;
    }
};

// Verificar se já está autenticado
onMounted(async () => {
    const isAuth = await krefasyStore.checkAuth();
    if (isAuth) {
        router.push('/dashboard');
    }
});
</script>

<style scoped>
.auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.auth-box {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 100%;
    max-width: 400px;
    text-align: center;
}

.auth-header {
    margin-bottom: 32px;
}

.logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
}

.logo {
    width: 48px;
    height: 48px;
    margin-right: 12px;
}

.brand-name {
    font-size: 28px;
    font-weight: 700;
    color: #1a202c;
    margin: 0;
}

.subtitle {
    color: #718096;
    font-size: 16px;
    margin: 0;
}

.auth-form {
    margin-bottom: 32px;
}

.form-group {
    margin-bottom: 24px;
    text-align: left;
}

.form-label {
    display: block;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 8px;
    font-size: 14px;
}

.input-group {
    position: relative;
}

.input-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
    width: 20px;
    height: 20px;
}

.form-input {
    width: 100%;
    padding: 16px 16px 16px 48px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.2s ease;
    box-sizing: border-box;
}

.form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
    border-color: #e53e3e;
}

.error-message {
    color: #e53e3e;
    font-size: 12px;
    margin-top: 4px;
    display: block;
}

.form-actions {
    margin-top: 32px;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 16px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    min-height: 48px;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-block {
    width: 100%;
}

.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.error-alert {
    background: #fed7d7;
    border: 1px solid #feb2b2;
    color: #c53030;
    padding: 12px 16px;
    border-radius: 8px;
    margin-top: 16px;
    display: flex;
    align-items: center;
    font-size: 14px;
}

.error-icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    flex-shrink: 0;
}

.auth-footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 24px;
}

.footer-text {
    color: #718096;
    font-size: 14px;
    margin: 0 0 8px 0;
}

.footer-version {
    color: #a0aec0;
    font-size: 12px;
    margin: 0;
}

/* Dark mode */
:global(.dark) .auth-box {
    background: #1a202c;
    color: white;
}

:global(.dark) .brand-name {
    color: white;
}

:global(.dark) .subtitle {
    color: #a0aec0;
}

:global(.dark) .form-label {
    color: #e2e8f0;
}

:global(.dark) .form-input {
    background: #2d3748;
    border-color: #4a5568;
    color: white;
}

:global(.dark) .form-input:focus {
    border-color: #667eea;
}

:global(.dark) .footer-text {
    color: #a0aec0;
}

:global(.dark) .footer-version {
    color: #718096;
}

/* Responsividade */
@media (max-width: 480px) {
    .auth-box {
        padding: 24px;
        margin: 16px;
    }

    .brand-name {
        font-size: 24px;
    }

    .subtitle {
        font-size: 14px;
    }
}
</style>
