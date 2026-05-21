const API_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = (tempToken?: string) => {
    const token = tempToken || localStorage.getItem('auth_token');
    return {
        'Authorization': `Bearer ${token}`
    };
};

export const login = async (credentials: any, device_id?: string) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ ...credentials, device_id }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error en el inicio de sesión');
    }
    return data;
};

export const twoFactorChallenge = async (code: string, tempToken?: string, device_id?: string) => {
    const response = await fetch(`${API_URL}/two-factor-challenge`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...getAuthHeaders(tempToken)
        },
        body: JSON.stringify({ code, device_id }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Código de autenticación inválido');
    }
    return data;
};

export const enableTwoFactor = async (tempToken?: string) => {
    const response = await fetch(`${API_URL}/user/two-factor-authentication`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            ...getAuthHeaders(tempToken)
        }
    });
    if (!response.ok) {
        throw new Error('Error al habilitar 2FA');
    }
    return response;
};

export const getTwoFactorQrCode = async (tempToken?: string) => {
    const response = await fetch(`${API_URL}/user/two-factor-qr-code`, {
        headers: {
            'Accept': 'application/json',
            ...getAuthHeaders(tempToken)
        }
    });
    if (!response.ok) {
        throw new Error('Error al obtener QR de 2FA');
    }
    return await response.json();
};

export const getTwoFactorSecretKey = async (tempToken?: string) => {
    const response = await fetch(`${API_URL}/user/two-factor-secret-key`, {
        headers: {
            'Accept': 'application/json',
            ...getAuthHeaders(tempToken)
        }
    });
    if (!response.ok) {
        throw new Error('Error al obtener la clave secreta de 2FA');
    }
    return await response.json();
};

export const confirmTwoFactor = async (code: string, tempToken?: string, device_id?: string) => {
    const response = await fetch(`${API_URL}/confirm-two-factor-and-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...getAuthHeaders(tempToken)
        },
        body: JSON.stringify({ code, device_id }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'El código ingresado es incorrecto');
    }
    return data;
};

export const forgotPassword = async (email: string) => {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'No se pudo procesar la solicitud');
    }
    return data;
};
