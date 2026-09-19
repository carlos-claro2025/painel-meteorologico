# Painel Meteorologico

Aplicacao web que exibe informações climaticas atuais e previsao para vários dias, com
graficos de temperatura, umidade, qualidade do ar e tempo de nascer/por dar do sol.

## Funcionalidades

- **Weather atual**: temperatura, umidade, vento, descricao do tempo.
- **Previsao para 5 dias**: detalhes 3 horas por dia, temperatura e condicoes.
- **Qualidade do ar (AQI)**: PM2.5, PM10, O3, NO2, SO2 e CO.
- **Tempo de nascer e por dar do sol**: parametros meteorologicos especiais.
- **Grafico horario (24h)**: temperatura em linha com maximo e minimo, e umidade em grafico de barras.
- **Botao local**: adiciona a localizacao do navegador (geolocation) para obter dados do local escolhido.

## Requisitos

- Navegador modernamente capaz de usar `navigator.geolocation`.
- Chave do OpenWeather API (opcional).

## Configuracao da API

A chave deve ser definida em `public/js/config.js`:

```javascript
const API_KEY = "abc123...";
```

> **Importante:** Mantenha a chave em um arquivo que nao seja publico.
> O repositorio publico apresenta apenas o placeholder.

## Executar localmente

1. Abra o projeto em um editor de codigo (ex: VS Code).
2. Em um terminal na pasta do projeto, execute:

   ```powershell
   python -m http.server 8080
   ```

3. Acesse `http://localhost:8080/` em um navegador.

## Deploy em Wasmer Edge

1. Instale o CLI Wasmer (Windows):

   ```powershell
   winget install wasmer
   ```

2. Faça login noWasmer:

   ```powershell
   wasmer login
   ```

3. Execute o deploy:

   ```powershell
   wasmer app deploy --dir . --owner carlos-claro2025 --non-interactive
   ```

4. Acesse o app em producao:

   ```
   https://painel-meteorologico.wasmer.app/
   ```

## Otimizacoes de Performance

Este projeto inclui as seguintes melhorias de performance:

- **Charts otimizados**: As instancias Chart.js são inicializadas uma vez e atualizadas com novos dados, ao invés de serem destruídas e recriadas em cada carregamento.
- **DOM batching**: Usa `DocumentFragment` para inserções em lote, reduzindo reflow/repaint.
- **Processamento eficiente**: Loops explícitos em vez de operadores spread para melhor performance.

Para testar localmente com hot-reload:

```powershell
cd public
python -m http.server 8080
```

## Seguranca

> **ATENÇÃO**: Nunca comite chaves de API em arquivos públicos. O arquivo `config.js` contém apenas um placeholder para segurança.

## Estrutura do Projeto

```
.

# public/                 # Arquivos devem ser servidos publicamente
# index.html          # Pagina HTML da aplicacao
# js/
# app.js          # Logica da aplicacao
# config.js       # Configuracao da API (chave)
# css/
# style.css       # Estilos da aplicacao
# app.yaml                # Configuracao de Wasmer Edge
# wasmer.toml             # Configuracao de deploy de Wasmer
# settings/
# config.toml         # Configuracao do servidor static
# README.md               # Documentacao
```

## Chaves do Repositorio

- Repositorio de branco: [carlos-claro2025/painel-meteorologico](https://github.com/carlos-claro2025/painel-meteorologico)

## Permissoes

Permissoes: Read & Write

Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>
