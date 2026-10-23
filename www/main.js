
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from './supabase.js';

const BUCKET = 'fotos-hodometro';

const botaoCamera = document.getElementById('botao-camera');
const botaoGaleria = document.getElementById('botao-galeria');
const botaoEnviar = document.getElementById('botao-enviar');
const imagemPreview = document.getElementById('imagem-preview');
const placeholder = document.getElementById('placeholder');
const legendaPreview = document.getElementById('legenda-preview');
const statusPreview = document.getElementById('status-preview');
const mensagem = document.getElementById('mensagem');
const botaoRemover = document.getElementById('botao-remover');

let fotoSelecionada = null;
let enviando = false;

function atualizarStatus(texto, cor = 'bg-zinc-300') {
  statusPreview.innerHTML = '';

  const indicador = document.createElement('span');
  indicador.className = `h-2 w-2 rounded-full ${cor}`;

  statusPreview.append(indicador, document.createTextNode(texto));
}

function mostrarImagem(url) {
  imagemPreview.src = url;
  imagemPreview.classList.remove('hidden');
  placeholder.classList.add('hidden');
  legendaPreview.classList.remove('hidden');
  botaoRemover.classList.remove('hidden');
}

async function abrirCamera(origem) {
  if (enviando) return;

  mensagem.textContent = '';

  botaoCamera.disabled = true;
  botaoGaleria.disabled = true;

  try {
    const foto = await Camera.getPhoto({
      quality: 60,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: origem
    });

    if (!foto.webPath) {
      throw new Error('Não foi possível acessar a imagem.');
    }

    // Guarda a imagem para enviar somente quando o botão for clicado.
    fotoSelecionada = foto.webPath;

    mostrarImagem(foto.webPath);
    atualizarStatus('Foto pronta para envio', 'bg-yellow-500');

    botaoEnviar.disabled = false;
    mensagem.textContent = 'Confira a imagem e clique em Enviar foto para o Supabase.';
  } catch (erro) {
    console.warn('Captura cancelada ou indisponível:', erro);
    mensagem.textContent = 'Captura cancelada ou câmera indisponível.';
  } finally {
    botaoCamera.disabled = false;
    botaoGaleria.disabled = false;
  }
}

async function enviarFoto() {
  if (!fotoSelecionada || enviando) {
    mensagem.textContent = 'Tire uma foto ou escolha uma imagem primeiro.';
    return;
  }

  enviando = true;
  botaoEnviar.disabled = true;
  botaoCamera.disabled = true;
  botaoGaleria.disabled = true;

  atualizarStatus('Enviando para o Supabase...', 'bg-yellow-500');
  mensagem.textContent = 'Enviando foto... Aguarde.';

  try {
    const resposta = await fetch(fotoSelecionada);

    if (!resposta.ok) {
      throw new Error('Não foi possível ler a imagem selecionada.');
    }

    const blob = await resposta.blob();
    const extensao = blob.type.includes('png') ? 'png' : 'jpg';
    const nomeArquivo = `hodometro-${Date.now()}.${extensao}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(nomeArquivo, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(nomeArquivo);

    if (!data?.publicUrl) {
      throw new Error('Não foi possível obter a URL pública da foto.');
    }

    // Mostra a URL pública após o upload bem-sucedido.
    fotoSelecionada = null;
    mostrarImagem(data.publicUrl);
    atualizarStatus('Foto salva no Supabase', 'bg-emerald-500');
    mensagem.textContent = 'Foto enviada com sucesso!';

    botaoEnviar.textContent = 'Foto enviada';
  } catch (erro) {
    console.error('Erro ao enviar foto:', erro);
    atualizarStatus('Falha no envio', 'bg-red-500');
    mensagem.textContent =
      `Não foi possível enviar a foto: ${erro.message || 'verifique a conexão e as políticas do Storage.'}`;
  } finally {
    enviando = false;
    botaoCamera.disabled = false;
    botaoGaleria.disabled = false;
    botaoEnviar.disabled = !fotoSelecionada;

    if (fotoSelecionada) {
      botaoEnviar.textContent = 'Tentar enviar novamente';
    }
  }
}

botaoCamera.addEventListener('click', () => {
  abrirCamera(CameraSource.Camera);
});

botaoGaleria.addEventListener('click', () => {
  abrirCamera(CameraSource.Photos);
});

botaoEnviar.addEventListener('click', enviarFoto);

botaoRemover.addEventListener('click', () => {
  if (enviando) return;

  fotoSelecionada = null;
  imagemPreview.removeAttribute('src');
  imagemPreview.classList.add('hidden');
  placeholder.classList.remove('hidden');
  legendaPreview.classList.add('hidden');
  botaoRemover.classList.add('hidden');

  atualizarStatus('Aguardando imagem');
  mensagem.textContent = 'Imagem removida da visualização.';

  botaoEnviar.disabled = true;
  botaoEnviar.textContent = 'Enviar foto para o Supabase';
});
