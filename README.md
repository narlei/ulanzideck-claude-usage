# Claude Code Usage — UlanziDeck Plugin (Windows)

Monitore o uso da sua assinatura do Claude Code em tempo real, direto nos botões
da sua Ulanzi Stream Deck (D200 / D200H / D200X).

Mostra o **limite de 5 horas** (rolling) e o **limite semanal** com:

- Barra vertical colorida proporcional ao uso
- Percentual com cor por threshold
- Contagem regressiva até o reset
- Atualização automática a cada 5 minutos (clique no botão = refresh imediato)

| Threshold | Cor |
|-----------|-----|
| < 50% | 🟢 verde |
| 50–75% | 🟡 amarelo |
| 75–90% | 🟠 laranja |
| ≥ 90% | 🔴 vermelho |

## Como funciona

O plugin lê o token OAuth do Claude Code localmente em
`%USERPROFILE%\.claude\.credentials.json` (campo `claudeAiOauth.accessToken`) e
faz uma requisição mínima a `https://api.anthropic.com/v1/messages`
(`claude-haiku-4-5`, `max_tokens: 1`). Os limites vêm nos response headers
`anthropic-ratelimit-unified-*`. **Nenhuma API key é necessária** — basta estar
logado no Claude Code CLI (`claude auth login`).

Se o token expirar, o plugin tenta renová-lo automaticamente invocando o
`claude` CLI com um orçamento mínimo.

## Instalação

1. Copie a pasta `com.claude.usage.ulanziPlugin` para:
   `%APPDATA%\Ulanzi\UlanziDeck\Plugins\`
2. Dentro da pasta, rode `npm install` (instala a dependência `ws`).
3. Reinicie o UlanziStudio.
4. Arraste as ações **5 hours** e **Weekly** para os botões desejados.

## Estrutura

```
com.claude.usage.ulanziPlugin/
├── manifest.json          Registro do plugin (Windows)
├── plugin/
│   ├── app.js             Lógica principal: eventos + polling
│   ├── usage-fetcher.js   Leitura do token + chamada à API
│   └── renderer.js        Geração dos ícones SVG dos botões
├── property-inspector/
│   └── inspector.html     Painel de informações
├── libs/node/             SDK UlanziDeck (WebSocket)
└── resources/             Ícones do plugin
```

## Créditos

Adaptado para Windows a partir do plugin macOS
[narlei/ulanzideck_claude](https://github.com/narlei/ulanzideck_claude).
A principal diferença é a origem das credenciais: no macOS o token vem do
Keychain; no Windows, do arquivo `.credentials.json`.

## Licença

MIT
