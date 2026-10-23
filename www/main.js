
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from './supabase.js';

const BUCKET = 'fotos-hodometro';

const botaoCamera = document.getElementById('botao-camera');
const botaoGaleria = document.getElementById('botao-galeria');
const imagemPreview = document.getElementById('imagem-preview');
const placeholder = document.getElementById('placeholder');
const legendaPreview = document.getElementById('legenda-preview');
const statusPreview = document.getElementById('status-preview');
const mensagem = document.getElementById('mensagem');
const botaoRemover = document.getElementById('botao-remover');

function mostrarImagem(url) {
  imagemPreview.src = url;
  imagemPreview.classList.remove('hidden');
  placeholder.classList.add('hidden');
  legendaPreview.classList.remove('hidden');
  botaoRemover.classList.remove('hidden');

  statusPreview.innerHTML = `
    <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
    Foto salva no Supabase
  `;
}

async function enviarFotoParaSupabase(webPath) {
  // Converte a imagem capturada em Blob
  const resposta = await fetch(webPath);
  if (!resposta.ok) {
    throw new Error('Não foi possível ler a imagem capturada.');
  }

  const blob = await resposta.blob();

  // Cria um nome único para cada foto
  const nomeArquivo = `hodometro-${Date.now()}.jpg`;

  // Envia a imagem para o bucket
  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(nomeArquivo, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false
    });

  if (erroUpload) {
    throw erroUpload;
  }

  // Obtém a URL pública da imagem
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(nomeArquivo);

  if (!data?.publicUrl) {
    throw new Error('Não foi possível obter a URL pública da imagem.');
  }

  return data.publicUrl;
}

async function abrirCamera(origem) {
  mensagem.textContent = '';

  botaoCamera.disabled = true;
  botaoGaleria.disabled = true;

  try {
    mensagem.textContent = 'Abrindo câmera...';

    const foto = await Camera.getPhoto({
      quality: 60,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: origem
    });

    if (!foto.webPath) {
      throw new Error('A imagem não foi encontrada.');
    }

    // Mostra a foto imediatamente, mesmo antes do upload
    imagemPreview.src = foto.webPath;
    imagemPreview.classList.remove('hidden');
    placeholder.classList.add('hidden');
    legendaPreview.classList.remove('hidden');
    botaoRemover.classList.remove('hidden');

    statusPreview.innerHTML = `
      <span class="h-2 w-2 rounded-full bg-yellow-500"></span>
      Enviando foto para a nuvem...
    `;

    mensagem.textContent = 'Enviando foto para o Supabase...';

    try {
      const urlPublica = await enviarFotoParaSupabase(foto.webPath);

      // Troca o caminho local pela URL pública da nuvem
      mostrarImagem(urlPublica);
      mensagem.textContent = 'Foto enviada e salva no Supabase!';
    } catch (erroUpload) {
      console.error('Erro no upload:', erroUpload);

      statusPreview.innerHTML = `
        <span class="h-2 w-2 rounded-full bg-red-500"></span>
        Foto não enviada
      `;

      mensagem.textContent =
        'A foto foi capturada, mas não foi enviada. Confira a conexão e as políticas do Storage.';
    }
  } catch (erro) {
    console.warn('Captura cancelada ou indisponível:', erro);

    mensagem.textContent =
      'Captura cancelada ou câmera indisponível.';
  } finally {
    botaoCamera.disabled = false;
    botaoGaleria.disabled = false;
  }
}

botaoCamera.addEventListener('click', () => {
  abrirCamera(CameraSource.Camera);
});

botaoGaleria.addEventListener('click', () => {
  abrirCamera(CameraSource.Photos);
});

botaoRemover.addEventListener('click', () => {
  imagemPreview.removeAttribute('src');
  imagemPreview.classList.add('hidden');
  placeholder.classList.remove('hidden');
  legendaPreview.classList.add('hidden');
  botaoRemover.classList.add('hidden');

  statusPreview.innerHTML = `
    <span class="h-2 w-2 rounded-full bg-gray-300"></span>
    Aguardando imagem
  `;

  mensagem.textContent = 'Imagem removida da visualização.';
});
