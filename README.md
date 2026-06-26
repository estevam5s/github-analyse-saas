# 🚀 GitHub Repository Analyzer

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%202.0-purple.svg)](https://ai.google.dev/)

> **Uma aplicação web moderna e inteligente para análise de repositórios GitHub com tecnologia de Inteligência Artificial**

Explore repositórios GitHub de forma inovadora com análise automática, geração de nomes criativos e extração inteligente de tecnologias usando o poder do Google Gemini AI.

---

## 📋 **Índice**

- [✨ Funcionalidades](#-funcionalidades)
- [🏗️ Arquitetura](#️-arquitetura)
- [🚀 Instalação Rápida](#-instalação-rápida)
- [⚙️ Configuração](#️-configuração)
- [🔧 Uso](#-uso)
- [📖 API Endpoints](#-api-endpoints)
- [🎨 Interface](#-interface)
- [🤖 Integração com IA](#-integração-com-ia)
- [📊 Funcionalidades Avançadas](#-funcionalidades-avançadas)
- [🔒 Segurança](#-segurança)
- [🤝 Contribuindo](#-contribuindo)
- [📜 Licença](#-licença)

---

## ✨ **Funcionalidades**

### 🔍 **Análise Inteligente**
- **Busca avançada** de repositórios GitHub
- **Análise automática** com Google Gemini AI
- **Geração de nomes criativos** para repositórios
- **Extração inteligente** de tecnologias e frameworks
- **Análise de organizações** completa

### 🎯 **Foco no Estevam5s**
- **Página dedicada** aos repositórios do estevam5s
- **Filtros avançados**: Públicos, Privados, Com Website
- **Busca em tempo real** por nome, descrição e tecnologias
- **Estatísticas detalhadas** e métricas de performance
- **Interface full-screen** otimizada para visualização

### 🎨 **Interface Moderna**
- **Design responsivo** para todos os dispositivos
- **Animações suaves** e micro-interações
- **Full-width layout** para máximo aproveitamento da tela
- **Dark mode ready** (futuras implementações)
- **Acessibilidade** otimizada

### 🚀 **Performance**
- **Carregamento rápido** com lazy loading
- **Cache inteligente** para otimização
- **API rate limiting** para estabilidade
- **Error handling** robusto

---

## 🏗️ **Arquitetura**

```
├── app.py                     # Aplicação Flask principal
├── config.py                 # Configurações da aplicação
├── requirements.txt          # Dependências Python
├── run.py                   # Script de inicialização
├── 
├── static/                  # Arquivos estáticos
│   ├── style.css           # Estilos CSS customizados
│   ├── script.js           # JavaScript frontend
│   └── estevam-repos.js    # Dados dos repositórios estevam5s
├── 
├── templates/              # Templates HTML (Jinja2)
│   ├── base.html          # Template base
│   ├── index.html         # Página principal
│   ├── estevam_repos.html # Página repositórios estevam5s
│   ├── user_profile.html  # Perfil de usuário
│   ├── organization_profile.html # Perfil de organização
│   ├── results.html       # Resultados de busca
│   └── error.html         # Página de erro
├── 
├── output/                # Dados de análise (ignorado no git)
├── logs/                  # Logs da aplicação (ignorado no git)
└── venv/                  # Ambiente virtual Python (ignorado no git)
```

---

## 🚀 **Instalação Rápida**

### **Pré-requisitos**
- Python 3.8 ou superior
- Git
- Conta GitHub (para API token)
- Google AI Studio (para Gemini API key)

### **1. Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/github-repository-analyzer.git
cd github-repository-analyzer
```

### **2. Ambiente Virtual**
```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows
venv\\Scripts\\activate
# macOS/Linux
source venv/bin/activate
```

### **3. Instalar Dependências**
```bash
pip install -r requirements.txt
```

### **4. Configuração Rápida**
```bash
# Copiar arquivo de configuração
cp .env.example .env

# Editar com suas API keys
nano .env
```

### **5. Executar**
```bash
python run.py
```

🎉 **Pronto!** Acesse http://localhost:5000

---

## ⚙️ **Configuração**

### **Variáveis de Ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
# GitHub API Configuration
GITHUB_TOKEN=seu_github_token_aqui
GITHUB_API_BASE=https://api.github.com

# Google Gemini AI Configuration  
GEMINI_API_KEY=sua_gemini_api_key_aqui
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_secret_key_segura_aqui

# Target User Configuration
TARGET_USER=estevam5s

# Application Settings
MAX_REPOSITORIES_PER_REQUEST=100
CACHE_TIMEOUT=3600
RATE_LIMIT_PER_MINUTE=60

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

### **Como Obter API Keys**

#### **🔑 GitHub Token**
1. Acesse [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token (classic)"
3. Selecione os escopos: `public_repo`, `read:org`, `read:user`
4. Copie o token gerado

#### **🤖 Google Gemini API Key**
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Clique em "Create API Key"
3. Copie a chave gerada

---

## 🔧 **Uso**

### **Interface Web**

#### **Página Principal**
- Visualização automática do perfil estevam5s
- Busca geral de repositórios
- Busca por usuário específico
- Exemplos populares

#### **Repositórios Estevam5s**
```
http://localhost:5000/estevam-repos
```

**Funcionalidades:**
- 📊 Estatísticas em tempo real
- 🔍 Filtros avançados (Todos, Públicos, Privados, Com Website)
- 🔎 Busca em tempo real
- 📱 Layout responsivo full-screen
- 📋 Modal de detalhes para cada repositório

#### **Perfil de Usuário**
```
http://localhost:5000/user/nome-do-usuario
```

#### **Perfil de Organização**
```
http://localhost:5000/organization/nome-da-organizacao
```

---

## 📖 **API Endpoints**

### **Principais Rotas**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Página principal |
| `/estevam-repos` | GET | Repositórios estevam5s |
| `/user/<username>` | GET | Perfil de usuário |
| `/organization/<org_name>` | GET | Perfil de organização |
| `/search` | POST | Buscar repositórios |
| `/analyze` | POST | Analisar repositório |

### **API Endpoints**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/health` | GET | Status da aplicação |
| `/api/user/<username>/organizations` | GET | Organizações do usuário |

---

## 🎨 **Interface**

### **Tecnologias Frontend**
- **Bootstrap 5.3.2** - Framework CSS responsivo
- **Font Awesome 6.4.0** - Ícones modernos
- **JavaScript ES6+** - Interatividade
- **CSS Grid & Flexbox** - Layouts avançados
- **CSS Custom Properties** - Tematização

### **Recursos Visuais**
- **🎨 Design System** completo com cores e tipografia consistentes
- **🌊 Gradientes** e efeitos visuais modernos
- **✨ Animações** suaves com CSS transforms e transitions
- **📱 Mobile First** design responsivo
- **🔍 Micro-interações** para melhor UX

### **Layout Full-Screen**
- **Hero Section** que ocupa toda a largura
- **Cards expansivos** que aproveitam o espaço disponível
- **Grid otimizado** para diferentes tamanhos de tela
- **Typography responsiva** com `clamp()` para escala automática

---

## 🤖 **Integração com IA**

### **Google Gemini 2.0 Flash**

A aplicação utiliza o modelo mais recente do Google Gemini para análise inteligente de repositórios com geração de nomes criativos e extração automática de tecnologias.

---

## 📊 **Funcionalidades Avançadas**

### **Sistema de Filtros**
- **Todos**: Visualizar todos os repositórios
- **Públicos**: Apenas repositórios públicos
- **Privados**: Apenas repositórios privados
- **Com Website**: Repositórios que possuem site

### **Busca em Tempo Real**
- Busca por nome do repositório
- Busca por descrição
- Busca por tecnologias utilizadas
- Resultados instantâneos

### **Estatísticas Avançadas**
- Total de repositórios
- Contagem públicos vs privados
- Total de stars e forks
- Distribuição de linguagens
- Repositórios com website

---

## 🔒 **Segurança**

- ✅ **Variáveis de ambiente** para chaves sensíveis
- ✅ **Arquivo .env** no .gitignore
- ✅ **Rate limiting** para prevenir abuse
- ✅ **Input validation** em todos os endpoints
- ✅ **CSRF protection** com Flask

---

## 🤝 **Contribuindo**

### **Como Contribuir**

1. **Fork** o projeto
2. **Clone** seu fork
3. **Crie** uma branch para sua feature
4. **Faça** commit das mudanças
5. **Push** para sua branch
6. **Abra** um Pull Request

```bash
# Exemplo de workflow
git checkout -b feature/nova-funcionalidade
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### **Roadmap**

#### **Próximas Funcionalidades**
- [ ] **Dark mode** completo
- [ ] **Exportação** de dados (JSON, CSV)
- [ ] **Comparação** entre repositórios
- [ ] **Histórico** de análises
- [ ] **Dashboard** de métricas
- [ ] **API REST** completa
- [ ] **Docker** container
- [ ] **Testes automatizados**

---

## 🐛 **Troubleshooting**

### **Problemas Comuns**

#### **Erro de API Rate Limit**
```
GitHub API rate limit exceeded
```
**Solução**: Verifique seu token GitHub e aguarde o reset do rate limit.

#### **Erro de Gemini AI**
```
Gemini API key invalid or expired
```
**Solução**: Verifique sua API key no Google AI Studio.

#### **Erro de Módulo Não Encontrado**
```
ModuleNotFoundError: No module named 'flask'
```
**Solução**: Ative o ambiente virtual e instale as dependências.
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🔗 **Links Úteis**

- **[GitHub API Documentation](https://docs.github.com/en/rest)**
- **[Google Gemini AI](https://ai.google.dev/)**
- **[Flask Documentation](https://flask.palletsprojects.com/)**
- **[Bootstrap 5](https://getbootstrap.com/docs/5.3/)**

---

## 📜 **Licença**

Este projeto está licenciado sob a **MIT License**.

```
MIT License

Copyright (c) 2024 GitHub Repository Analyzer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 **Autor**

**Estevam Santos** - [@estevam5s](https://github.com/estevam5s)

- 🌐 **Website**: https://estevamsouza.com.br
- 📧 **Email**: contato@estevamsouza.com.br
- 💼 **LinkedIn**: [Estevam Santos](https://linkedin.com/in/estevam-santos)

---

## 🎉 **Agradecimentos**

- **GitHub** pela excelente API
- **Google** pelo poderoso Gemini AI
- **Bootstrap Team** pelo framework incrível
- **Flask Community** pelo micro-framework fantástico
- **Open Source Community** pela inspiração contínua

---

## 📞 **Suporte**

Encontrou um bug? Tem uma sugestão? Precisa de ajuda?

1. **🐛 Bug Reports**: [Criar Issue](https://github.com/estevam5s/github-analyzer/issues/new?template=bug_report.md)
2. **💡 Feature Requests**: [Criar Issue](https://github.com/estevam5s/github-analyzer/issues/new?template=feature_request.md)  
3. **💬 Discussões**: [GitHub Discussions](https://github.com/estevam5s/github-analyzer/discussions)
4. **📧 Email**: contato@estevamsouza.com.br

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela!**

[![GitHub stars](https://img.shields.io/github/stars/estevam5s/github-analyzer.svg?style=social&label=Star)](https://github.com/estevam5s/github-analyzer)
[![GitHub forks](https://img.shields.io/github/forks/estevam5s/github-analyzer.svg?style=social&label=Fork)](https://github.com/estevam5s/github-analyzer/fork)

---

**Feito com ❤️ por [Estevam Santos](https://github.com/estevam5s)**

*Transformando código em experiências incríveis* ✨

</div>