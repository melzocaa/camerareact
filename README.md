# TaxiFrotaApp

Aplicativo para registrar a quilometragem de veículos por meio de fotos do hodômetro, utilizando Capacitor Camera e Supabase Storage.

## 1. Pré-requisitos

Antes de começar, é necessário ter instalado:

- Node.js e npm
- Git
- Visual Studio Code
- Uma conta no Supabase
- Um repositório no GitHub para gerar o APK

## 2. Instalar as dependências

Abra o terminal do VS Code na pasta principal do projeto e execute:

```bash
npm install
```

Instale também as bibliotecas utilizadas pela câmera e pelo Supabase, caso ainda não estejam instaladas:

```bash
npm install @capacitor/camera @supabase/supabase-js
```

## 3. Criar o projeto no Supabase

1. Acesse https://supabase.com/ e entre na sua conta.
2. Crie um projeto.
3. Aguarde a inicialização do banco de dados.
4. Abra as configurações do projeto e localize a URL e a chave pública.
5. Guarde essas informações para configurar a conexão no aplicativo.

Utilize somente a chave pública apropriada para o frontend. Nunca utilize uma chave `service_role` ou uma chave secreta no aplicativo.

## 4. Criar o bucket para armazenar as fotos

1. No painel do Supabase, entre em **Storage**.
2. Crie um bucket chamado `fotos-hodometro`.
3. Configure o acesso conforme a necessidade do projeto.
4. Configure uma política que permita inserir arquivos no bucket.

Para o protótipo com uploads anônimos, a política de inserção pode ser criada no SQL Editor:

```sql
CREATE POLICY "Permitir upload de fotos do hodometro"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'fotos-hodometro'
);
```

Essa política permite que usuários não autenticados enviem arquivos para esse bucket. Para um aplicativo real, o ideal é restringir os uploads e exigir autenticação quando necessário.

## 5. Configurar as variáveis de ambiente

Na pasta principal do projeto, crie um arquivo chamado `.env.example` com este conteúdo:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Crie uma cópia desse arquivo chamada `.env`.

No Windows, pelo terminal, você pode executar:

```cmd
copy .env.example .env
```

Abra o `.env` e substitua os valores ilustrativos pelos dados do seu projeto Supabase.

O arquivo `.env` contém as configurações locais e não deve ser enviado ao GitHub.

## 6. Configurar a conexão com o Supabase

No arquivo `www/supabase.js`, utilize:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
```

No arquivo `vite.config.js`, mantenha a configuração do projeto e a opção `envDir: '..'`, para que o Vite encontre o `.env` na pasta principal, considerando que a raiz do aplicativo é `www`.

## 7. Configurar o envio das fotos

No arquivo `www/main.js`, o aplicativo utiliza:

- `Camera.getPhoto()` para fotografar o hodômetro ou escolher uma imagem da galeria.
- A variável `fotoSelecionada` para manter a imagem escolhida antes do envio.
- `supabase.storage.from('fotos-hodometro').upload()` para enviar a imagem ao Storage.
- `getPublicUrl()` para obter o endereço público da foto.

O usuário deve selecionar ou fotografar uma imagem, conferir a pré-visualização e clicar no botão **Enviar foto para o Supabase**.

O aplicativo apresenta uma mensagem de sucesso ou de erro conforme o resultado da operação.

## 8. Executar o aplicativo localmente

No terminal, execute:

```bash
npm run dev
```

Abra o endereço local informado pelo Vite no navegador.

Para verificar se o projeto compila corretamente, execute:

```bash
npm run build
```

Se houver erros, corrija-os antes de continuar.

## 9. Configurar o Capacitor

Depois de compilar o aplicativo, sincronize os arquivos com o projeto Android:

```bash
npx cap sync android
```

Esse comando atualiza os arquivos web utilizados pelo aplicativo Android e sincroniza os plugins do Capacitor.

## 10. Proteger as variáveis de ambiente

Crie ou atualize o arquivo `.gitignore` na pasta principal:

```gitignore
.env
.env.*
!.env.example

node_modules/
dist/
```

O `.env.example` deve conter apenas valores ilustrativos, sem credenciais reais.

Antes de enviar alterações ao GitHub, confira:

```bash
git status
```

Se o arquivo `.env` já estiver sendo acompanhado pelo Git, remova-o do índice sem apagá-lo do computador:

```bash
git rm --cached .env
```

Se alguma chave secreta já tiver sido publicada, revogue-a ou substitua-a.

## 11. Enviar as alterações para o GitHub

Depois de atualizar os arquivos, execute:

```bash
git add .
git commit -m "Integrar envio de fotos ao Supabase"
git push
```

Se o Git informar que não há alterações para registrar, verifique se os arquivos foram salvos e se realmente houve mudanças.

## 12. Gerar o APK pelo GitHub Actions

1. Acesse o repositório no GitHub.
2. Abra a aba **Actions**.
3. Selecione a execução mais recente do workflow de geração do APK.
4. Aguarde a conclusão do processo.
5. Se a execução terminar com sucesso, localize a seção **Artifacts**.
6. Baixe o artefato disponibilizado pelo workflow.

Se o build do GitHub precisar das variáveis do Supabase, configure-as em **Settings → Secrets and variables → Actions** e disponibilize-as no workflow. Não escreva chaves secretas diretamente no arquivo YAML.

## 13. Testar o funcionamento

Depois de instalar o APK em um dispositivo compatível:

1. Abra o TaxiFrotaApp.
2. Toque em **Fotografar painel** ou **Escolher da galeria**.
3. Selecione uma imagem legível.
4. Clique em **Enviar foto para o Supabase**.
5. Aguarde a mensagem de confirmação.
6. Acesse o bucket `fotos-hodometro` no painel do Supabase e confira se o arquivo foi armazenado.

Se o envio falhar, confira a conexão com a internet, as variáveis de ambiente e as políticas de acesso ao Storage.

## Estrutura do projeto

```text
TaxiFrotaApp/
├── .env.example
├── .gitignore
├── .env
├── package.json
├── vite.config.js
├── capacitor.config.json
├── www/
│   ├── index.html
│   ├── main.js
│   └── supabase.js
├── dist/
├── android/
└── .github/
    └── workflows/
        └── build-apk.yml
```

A pasta `dist` é gerada automaticamente pelo comando `npm run build`.

## Tecnologias utilizadas

- HTML5
- Tailwind CSS
- JavaScript
- Vite
- Capacitor
- Capacitor Camera
- Supabase Storage
- Git e GitHub
- GitHub Actions

## Objetivo do projeto

Facilitar o registro fotográfico da quilometragem dos veículos durante a troca de turno, permitindo armazenar as imagens no Supabase Storage.
