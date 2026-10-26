# Ritmo — Hábitos que fluem

PWA em português para acompanhar hábitos diários. Interface mobile-first, temas claro e escuro, gráficos de constância e funcionamento 100% offline. Os dados ficam apenas no dispositivo, em `localStorage` — sem cadastro, servidor ou rastreamento.

Código-fonte: [https://github.com/srend69/ritmo-pwa](https://github.com/srend69/ritmo-pwa)

| Hoje | Progresso |
| --- | --- |
| ![Tela Hoje do Ritmo](./screenshots/hoje-390x844.png) | ![Tela Progresso do Ritmo](./screenshots/progresso-390x844.png) |

## Recursos

- **Hoje:** progresso do dia, sequência atual, marcação rápida e ajuste do histórico da semana.
- **Progresso:** conclusão em 30 dias, sequência atual e recorde, check-ins, gráfico dos últimos 7 dias, mapa de calor de 4 semanas e desempenho por hábito.
- **Ajustes:** tema claro, escuro ou do sistema; instalação; estado offline; exportação e importação de backup em JSON; apagar dados.
- **PWA:** instalável em Android, iOS e desktop; service worker com cache versionado; atalho “Novo hábito”.
- **Privacidade:** nenhum dado sai do navegador. Não há backend, analytics ou cookies.

## Stack

HTML, CSS e JavaScript puro, com módulos ES. Sem build, sem dependências de runtime e sem framework.

## Estrutura

```text
ritmo-pwa/
├── index.html
├── manifest.json
├── sw.js
├── render.yaml
├── assets/
│   ├── css/styles.css
│   ├── js/core.js        # datas, persistência e estatísticas
│   ├── js/app.js         # interface, interações e PWA
│   └── icons/            # ícones 192, 512, maskable, Apple e favicon
├── screenshots/
└── scripts/generate_icons.py
```

## Rodar localmente

O app precisa ser servido por HTTP (módulos ES e service worker não funcionam via `file://`):

```bash
cd ritmo-pwa
python3 -m http.server 8080
```

Abra [http://localhost:8080](http://localhost:8080). Para testar a instalação e o modo offline, use `localhost` (considerado contexto seguro) ou HTTPS.

Para regenerar os ícones (requer Python 3 e Pillow):

```bash
python3 scripts/generate_icons.py
```

## Testar a PWA

1. Abra o app no Chrome ou Edge e confirme o ícone de instalação na barra de endereço.
2. Instale e abra em uma janela standalone.
3. Em DevTools → Application → Service Workers, marque **Offline** e recarregue: o app deve continuar abrindo.
4. Crie hábitos, marque dias, exporte um backup e importe-o de volta.

## Publicar no Render

### Opção A — Blueprint (recomendado)

1. Crie um repositório no GitHub e envie os arquivos:

   ```bash
   cd ritmo-pwa
   git init
   git add .
   git commit -m "feat: Ritmo PWA"
   git branch -M main
   git remote add origin https://github.com/srend69/ritmo-pwa.git
   git push -u origin main
   ```

   Se o Git ainda não tiver uma identidade configurada, rode antes do commit:

   ```bash
   git config --global user.name "Seu Nome"
   git config --global user.email "voce@exemplo.com"
   ```

2. No [Render](https://render.com), escolha **New → Blueprint** e conecte o repositório.
3. Confirme o serviço `ritmo` descrito em `render.yaml`. O Render publicará o diretório raiz como site estático.
4. Ao final, copie a URL `https://<nome>.onrender.com`. O link do repositório já está configurado no topo deste `README.md` e em `#source-link` na tela de Ajustes.

### Opção B — Site estático manual

1. No Render, escolha **New → Static Site** e conecte o repositório.
2. Configuração:
   - **Branch:** `main`
   - **Build Command:** deixe vazio
   - **Publish Directory:** `.`
3. Como não há build, o `render.yaml` já concentra os cabeçalhos de segurança e cache. Para a opção manual, você pode copiá-los em **Headers** ou conectar via Blueprint depois.
4. Cada push em `main` republica o site automaticamente.

> O HTTPS do Render é obrigatório para o service worker e a instalação da PWA. O plano gratuito do Render pode suspender sites inativos; o primeiro acesso depois disso pode levar alguns segundos.

## Atalho e URLs

- `/?action=new` abre o formulário de novo hábito (usado pelo atalho do manifest).
- `/#progresso` e `/#ajustes` abrem as abas diretamente.
- O app usa um único `index.html`; a navegação acontece por hash.

## Dados e backup

O formato do backup é JSON com `app`, `version`, `exportedAt`, `habits` e `settings`. A importação valida os hábitos, gera novos IDs para evitar colisões e pede confirmação antes de substituir os dados existentes.

## Licença

Uso livre para fins pessoais e educacionais.
