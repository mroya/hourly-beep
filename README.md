# 🔔 Bip Horário (Hourly Beep)

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Precisão e minimalismo.** Um assistente sonoro elegante para quem busca manter a noção do tempo com sincronia perfeita ao relógio do sistema.

---

## ✨ A Experiência

O **Bip Horário** não é apenas um timer. É uma ferramenta de consciência temporal desenvolvida com foco em **precisão absoluta**. Diferente de apps comuns que iniciam a contagem a partir da ativação, o Bip Horário sincroniza-se diretamente com **servidores de hora atômica (NTP/HTTP)** para calcular o desvio do relógio interno do seu smartphone e emitir o som exatamente na virada do minuto ou da hora real.

### 🚀 Principais Recursos

-   **Sincronização Atômica (NTP/HTTP)**: Consulta servidores de tempo globais (como `timeapi.io` e `worldtimeapi.org`) para calcular a diferença exata (drift) do relógio do seu celular.
-   **Compensação Dinâmica**: Ajusta e compensa automaticamente em milissegundos o agendamento de cada alerta para contornar qualquer imprecisão ou atraso do sistema do aparelho.
-   **Painel com Clocks Duplos**: Visualização simultânea em tempo real do relógio do Celular e do Relógio Atômico sincronizado, exibindo inclusive décimos de segundo.
-   **Timer Regressivo Vivo**: Contador dinâmico que exibe os segundos e décimos restantes exatos até o próximo bip.
-   **Design Ultra Premium**: Nova interface futurista com estética *Glassmorphism* escura, neon cyan e feedbacks visuais pulsantes.
-   **Eficiência Energética**: Agendamento inteligente em lote, otimizado para rodar em segundo plano consumindo o mínimo de bateria.

---

## 🛠️ O Desafio Técnico & Solução Atômica

Um dos maiores diferenciais deste projeto é a solução para a limitação de triggers de calendário no Android e o desvio natural (drift) dos relógios internos de smartphones.

1. **Desvio de Relógio (Clock Drift)**: Relógios de celulares podem adiantar ou atrasar alguns segundos ou milissegundos ao longo do tempo. Para resolver isso, implementamos um algoritmo de sincronização HTTP de ida e volta (RTT):
   - Mede o tempo de resposta da rede ($RTT$) para descontar a latência da requisição ($RTT / 2$).
   - Determina o *offset* temporal real: $\text{Offset} = \text{Tempo Atômico} - \text{Tempo do Sistema}$.
   - Aplica este offset de forma compensatória no agendamento: se o celular está atrasado em $1.2$ segundos, agendamos o bip para soar localmente $1.2$ segundos antes de virar a hora no celular, fazendo com que toque exatamente no segundo zero absoluto.

2. **Gatilhos no Android**: O Android não suporta nativamente disparadores baseados em calendário de forma repetitiva para notificações customizadas com som. Contornamos isso com **Compensated Batch Scheduling**:
   - Agendamos um lote de 120 triggers do tipo `date` (pontos absolutos calibrados com o offset).
   - Um listener em segundo plano detecta quando o lote está no fim e silenciosamente agenda mais bips em tempo real, garantindo operação vitalícia sem intervenção do usuário.

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
