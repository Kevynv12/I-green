# 💈 NEOBARBER - CÓDIGO COMPLETO

## 📁 Estrutura do Projeto

```
app/
├── backend/
│   ├── server.py (915 linhas - código acima)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── agenda.tsx
│   │   │   ├── clients.tsx
│   │   │   ├── tasks.tsx
│   │   │   └── profile.tsx
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── components/
│   │   └── LoadingScreen.tsx
│   ├── store/
│   │   └── authStore.ts
│   ├── utils/
│   │   ├── api.ts
│   │   └── storage.ts
│   ├── package.json
│   ├── app.json
│   └── .env
└── README.md
```

---

## 🔧 Backend

### requirements.txt
```txt
fastapi==0.110.1
uvicorn[standard]==0.29.0
motor==3.3.1
pydantic==2.6.4
pydantic[email]==2.6.4
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
```

### backend/.env
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
JWT_SECRET_KEY="neobarber-secret-key-change-in-production-with-strong-random-value"
```

---

## ⚛️ Frontend

### package.json (principais dependências)
```json
{
  "dependencies": {
    "expo": "~54.0.31",
    "react": "~19.1.0",
    "react-native": "~0.81.5",
    "expo-router": "~5.1.4",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.9.0",
    "zustand": "^5.0.9",
    "@tanstack/react-query": "^5.62.12",
    "axios": "^1.7.9",
    "date-fns": "^4.1.0",
    "react-native-gifted-charts": "^1.4.70",
    "react-native-svg": "^16.0.0",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "expo-secure-store": "~14.0.0",
    "expo-linear-gradient": "^15.0.8",
    "react-native-reanimated": "^4.2.1"
  }
}
```

### frontend/.env
```env
EXPO_TUNNEL_SUBDOMAIN=barber-dashboard-5
EXPO_PACKAGER_HOSTNAME=https://barber-dashboard-5.preview.emergentagent.com
EXPO_PACKAGER_PROXY_URL=https://barber-dashboard-5.ngrok.io
EXPO_PUBLIC_BACKEND_URL=https://barber-dashboard-5.preview.emergentagent.com
EXPO_USE_FAST_RESOLVER="1"
METRO_CACHE_ROOT=/app/frontend/.metro-cache
```

---

## 📱 Frontend - Arquivos Principais

### utils/storage.ts
```typescript
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export default storage;
```

### utils/api.ts
```typescript
import axios from 'axios';
import storage from './storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
```

### store/authStore.ts
```typescript
import { create } from 'zustand';
import storage from '../utils/storage';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  barbershop_name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, barbershop_name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      await storage.setItem('token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Falha no login');
    }
  },

  register: async (email: string, password: string, name: string, barbershop_name?: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
        barbershop_name,
      });
      const { access_token, user } = response.data;
      
      await storage.setItem('token', access_token);
      set({ user, token: access_token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Falha no registro');
    }
  },

  logout: async () => {
    await storage.deleteItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await storage.getItem('token');
      if (token) {
        const response = await api.get('/auth/me');
        set({ user: response.data, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await storage.deleteItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
```

---

## 🎨 Avatares Temáticos (8 opções)

```typescript
const BARBER_AVATARS = [
  { id: 'barber1', icon: 'cut', color: '#22d3ee', label: 'Tesoura Neon' },
  { id: 'barber2', icon: 'flash', color: '#a855f7', label: 'Raio Cyber' },
  { id: 'barber3', icon: 'skull', color: '#ef4444', label: 'Caveira' },
  { id: 'barber4', icon: 'flame', color: '#f59e0b', label: 'Fogo' },
  { id: 'barber5', icon: 'star', color: '#10b981', label: 'Estrela VIP' },
  { id: 'barber6', icon: 'trophy', color: '#eab308', label: 'Troféu' },
  { id: 'barber7', icon: 'rocket', color: '#06b6d4', label: 'Foguete' },
  { id: 'barber8', icon: 'diamond', color: '#ec4899', label: 'Diamante' },
];
```

---

## 🚀 Como Rodar

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

---

## 📊 Endpoints da API

### Autenticação
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Barbeiros
- GET /api/barbers
- POST /api/barbers
- PUT /api/barbers/{id}
- DELETE /api/barbers/{id}

### Produtos
- GET /api/products
- POST /api/products
- PUT /api/products/{id}
- DELETE /api/products/{id}

### Vendas
- GET /api/sales
- POST /api/sales

### Serviços
- GET /api/services
- POST /api/services

### Clientes
- GET /api/clients (com days_since_last_visit)
- POST /api/clients
- GET /api/clients/{id}
- PUT /api/clients/{id}
- DELETE /api/clients/{id}

### Agendamentos
- GET /api/appointments?status=&date=&limit=&skip=
- POST /api/appointments
- PUT /api/appointments/{id}
- PUT /api/appointments/{id}/complete
- DELETE /api/appointments/{id}

### Tarefas
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/{id}/toggle
- DELETE /api/tasks/{id}

### Analytics
- GET /api/analytics/financial?start_date=&end_date=

---

## 🎯 Funcionalidades Implementadas

✅ Autenticação JWT completa
✅ CRUD de Clientes com avatares temáticos
✅ Dias desde último corte
✅ CRUD de Agendamentos
✅ Sistema de Tarefas
✅ Dashboard com estatísticas
✅ Sistema Multi-Barbeiro (backend pronto)
✅ Produtos com margem de lucro (backend pronto)
✅ Vendas (backend pronto)
✅ Analytics financeiro completo (backend pronto)
✅ Queries otimizadas (N+1 eliminado)
✅ Paginação implementada

---

## ⚠️ Pendente

❌ Gráfico futurista no dashboard
❌ Botões do perfil funcionais
❌ Avatares para usuário
❌ Telas de Barbeiros, Produtos e Financeiro

---

## 📝 Credenciais de Teste

Email: teste@barber.com
Senha: 123456

---

## 🎨 Paleta de Cores Cyberpunk

- Background: #020617 (Slate 950)
- Primary: #22d3ee (Cyan 400)
- Purple: #a855f7 (Purple 500)
- Green: #10b981 (Emerald 500)
- Red: #ef4444 (Red 500)
- Yellow: #eab308 (Yellow 500)
- Text: #fff / #64748b (Slate 500)
