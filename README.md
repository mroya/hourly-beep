# 🔔 Bip Horário (Hourly Beep)

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Precisão e minimalismo.** Um assistente sonoro elegante para quem busca manter a noção do tempo com sincronia perfeita ao relógio do sistema.

---

## ✨ A Experiência

O **Bip Horário** não é apenas um timer. É uma ferramenta de consciência temporal desenvolvida com foco em **precisão absoluta**. Diferente de apps comuns que iniciam a contagem no momento da ativação, o Bip Horário sincroniza-se com o relógio do seu smartphone para garantir que o som soe exatamente na virada do minuto ou da hora.

### 🚀 Principais Recursos

-   **Sincronia Real-Time**: Alinhamento exato com os segundos `:00` do relógio Android/iOS.
-   **Intervalos Flexíveis**: Escolha entre bips a cada 1 minuto ou a cada hora cheia.
-   **Design Premium**: Interface escura (Dark Mode) com estética *Glassmorphism* e alta legibilidade.
-   **Eficiência Energética**: Otimizado para funcionar em segundo plano sem drenar a bateria.
-   **Feedback Instantâneo**: Preview sonoro ao ativar para garantir que o volume está ideal.

---

## 🛠️ O Desafio Técnico (Android Sync)

Um dos maiores diferenciais deste projeto é a solução para a limitação de triggers de calendário no Android. 

Enquanto o iOS permite nativamente o agendamento por calendário, o Android frequentemente sofre com atrasos em `intervals`. Para resolver isso, implementamos uma lógica de **Batch Scheduling**:
1. O app calcula os milissegundos exatos até o próximo minuto cheio.
2. Agenda um lote de 120 gatilhos do tipo `date` (pontos exatos no tempo).
3. Utiliza um `NotificationReceivedListener` para auto-reagendar novos lotes silenciosamente, garantindo operação contínua e precisa.

---

## 📦 Instalação e Execução

Certifique-se de ter o [Node.js](https://nodejs.org/) e o [Expo CLI](https://docs.expo.dev/get-started/installation/) instalados.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/mroya/hourly-beep.git
    cd hourly-beep
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o projeto:**
    ```bash
    npx expo start
    ```

---

## 🎨 Estrutura do Projeto

```text
hourly-beep/
├── assets/          # Recursos de áudio (beep.mp3) e ícones
├── App.js           # Lógica central e UI (React Native)
├── app.json         # Configurações do Expo e Android Package
└── package.json     # Gerenciamento de dependências
```

---

## 🤝 Contribuição

Contribuições são o que tornam a comunidade open source um lugar incrível para aprender, inspirar e criar. 

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---
<p align="center">
  Desenvolvido com ❤️ por <a href="https://github.com/mroya">Marcio Roya</a>
</p>
