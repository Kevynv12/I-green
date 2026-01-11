# 💈 NEOBARBER - Sistema de Gestão de Barbearia

<div align="center">
  
**Sistema moderno de gestão para barbearias com design cyberpunk**

[![Expo](https://img.shields.io/badge/Expo-54.0.31-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.1-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.5.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)

</div>

## ✨ Funcionalidades

### 🔐 Autenticação
- ✅ Registro de usuário com JWT
- ✅ Login seguro
- ✅ Gerenciamento de sessão
- ✅ Proteção de rotas

### 📅 Agendamentos
- ✅ Criação de agendamentos
- ✅ Visualização por data
- ✅ Edição e exclusão
- ✅ Marcar como concluído
- ✅ Seleção de horário
- ✅ Múltiplos barbeiros

### 👥 Gestão de Clientes
- ✅ Cadastro de clientes
- ✅ Histórico de visitas
- ✅ Total gasto por cliente
- ✅ Busca rápida

### 📊 Dashboard & Analytics
- ✅ Faturamento total
- ✅ Total de atendimentos
- ✅ Gráfico de performance
- ✅ Próximos horários

### ✅ Tarefas
- ✅ Lista de afazeres
- ✅ Marcar como concluído
- ✅ Adicionar e remover tarefas

### 🎨 Design
- ✅ Tema dark/cyberpunk
- ✅ Animações suaves
- ✅ Interface responsiva
- ✅ Ícones modernos (Ionicons)

## 🚀 Tecnologias

### Frontend (Mobile)
- **Expo** - Framework React Native
- **Expo Router** - Navegação file-based
- **Zustand** - Gerenciamento de estado
- **Axios** - Cliente HTTP
- **React Native Gifted Charts** - Gráficos
- **date-fns** - Manipulação de datas
- **AsyncStorage/SecureStore** - Armazenamento local

### Backend (API)
- **FastAPI** - Framework Python assíncrono
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver assíncrono MongoDB
- **JWT** - Autenticação com tokens
- **Bcrypt** - Hash de senhas
- **Pydantic** - Validação de dados

## 📱 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Python 3.11+
- MongoDB
- Expo CLI
- Yarn

### Backend

```bash
cd backend
pip install -r requirements.txt

# Configure as variáveis de ambiente no .env
MONGO_URL=mongodb://localhost:27017
DB_NAME=neobarber
JWT_SECRET_KEY=your-secret-key

# Inicie o servidor
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
yarn install

# Configure as variáveis de ambiente no .env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001

# Inicie o Expo
yarn start
```

## 📖 Estrutura do Projeto

```
neobarber/
├── backend/
│   ├── server.py              # API FastAPI
│   ├── requirements.txt       # Dependências Python
│   └── .env                   # Variáveis de ambiente
├── frontend/
│   ├── app/
│   │   ├── (auth)/           # Telas de autenticação
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/           # Telas principais
│   │   │   ├── dashboard.tsx
│   │   │   ├── agenda.tsx
│   │   │   ├── clients.tsx
│   │   │   ├── tasks.tsx
│   │   │   └── profile.tsx
│   │   ├── _layout.tsx       # Layout raiz
│   │   └── index.tsx         # Ponto de entrada
│   ├── components/           # Componentes reutilizáveis
│   ├── store/               # Stores Zustand
│   │   └── authStore.ts
│   ├── utils/               # Utilitários
│   │   ├── api.ts
│   │   └── storage.ts
│   └── package.json
└── README.md
```

## 🔑 API Endpoints

### Autenticação
```
POST /api/auth/register     # Registrar usuário
POST /api/auth/login        # Login
GET  /api/auth/me          # Dados do usuário logado
```

### Serviços
```
GET  /api/services         # Listar serviços
POST /api/services         # Criar serviço
```

### Clientes
```
GET  /api/clients          # Listar clientes
POST /api/clients          # Criar cliente
GET  /api/clients/:id      # Detalhes do cliente
```

### Agendamentos
```
GET  /api/appointments                # Listar agendamentos
POST /api/appointments                # Criar agendamento
PUT  /api/appointments/:id            # Atualizar agendamento
PUT  /api/appointments/:id/complete   # Marcar como concluído
DELETE /api/appointments/:id          # Cancelar agendamento
```

### Tarefas
```
GET  /api/tasks            # Listar tarefas
POST /api/tasks            # Criar tarefa
PUT  /api/tasks/:id/toggle # Alternar status
DELETE /api/tasks/:id      # Excluir tarefa
```

### Analytics
```
GET  /api/analytics/revenue  # Dados de faturamento
```

## 🎨 Paleta de Cores

- **Background**: `#020617` (Slate 950)
- **Primary**: `#22d3ee` (Cyan 400) - Neon Blue
- **Success**: `#10b981` (Emerald 500)
- **Error**: `#ef4444` (Red 500)
- **Text**: `#ffffff` / `#64748b` (Slate 500)

## 📝 Fluxo de Usuário

1. **Registro/Login** → Autenticação JWT
2. **Dashboard** → Visão geral do negócio
3. **Agenda** → Gerenciar agendamentos diários
4. **Clientes** → Base de dados de clientes
5. **Tarefas** → Lista de afazeres
6. **Perfil** → Configurações e logout

## 🔒 Segurança

- ✅ Senhas hasheadas com Bcrypt
- ✅ Tokens JWT com expiração
- ✅ Autenticação obrigatória em rotas protegidas
- ✅ Armazenamento seguro de tokens (SecureStore/AsyncStorage)
- ✅ CORS configurado
- ✅ Validação de dados com Pydantic

## 📱 Testado em

- ✅ iOS (Expo Go)
- ✅ Android (Expo Go)
- ✅ Web (Preview)

## 👨‍💻 Desenvolvido por

Sistema desenvolvido com foco em usabilidade, design moderno e performance.

## 📄 Licença

MIT License - Sinta-se livre para usar este projeto!

---

<div align="center">
  
**🔥 NEOBARBER - Gestão Cyberpunk para sua Barbearia 🔥**

</div>
