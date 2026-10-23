
import {
  Camera,
  CameraResultType,
  CameraSource
} from '@capacitor/camera';

import { supabase } from './supabase';

const BUCKET = 'fotos-hodometro';

// Elementos da interface
const botaoCamera = document.getElementById(
  'botao-camera'
) as HTMLButtonElement;

const botaoGaleria = document.getElementById(
  'botao-galeria'
) as HTMLButtonElement;

const botaoEnviar = document.getElementById(
  'botao-enviar'
) as HTMLButtonElement;

const imagemPreview = document.getElementById(
  'imagem-preview'
) as HTMLImageElement;

const placeholder = document.getElementById(
  'placeholder'
) as HTMLElement;

const legendaPreview = document.getElementById(
  'legenda-preview'
) as HTMLElement;

const statusPreview = document.getElementById(
  'status-preview'
) as HTMLElement;

const mensagem = document.getElementById(
  'mensagem'
) as HTMLElement;

const botaoRemover = document.getElementById(
  'botao-remover'
) as HTMLButtonElement;

// Estado da aplicação
let fotoSelecionada: string | null = null;
let enviando = false;

// Atualiza o indicador de status
function atualizarStatus(
  texto: string,
  cor: string = 'bg-zinc-300'
): void {
  statusPreview.innerHTML = '';

  const indicador = document.createElement('span');
  indicador.className = `h-2 w-2 rounded-full ${cor}`;

  statusPreview.append(
    indicador,
    document.createTextNode(texto)
  );
}

// Exibe a imagem selecionada
function mostrarImagem(url: string): void {
  imagemPreview.src = url;
  imagemPreview.classList.remove('hidden');
  placeholder.classList.add('hidden');
  legendaPreview.classList.remove('hidden');
  botaoRemover.classList.remove('hidden');
}

// Abre a câmera ou a galeria
async function abrirCamera(
  origem: CameraSource
): Promise<void> {
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

    fotoSelecionada = foto.webPath;

    mostrarImagem(foto.webPath);

    atualizarStatus(
      'Foto pronta para envio',
      'bg-yellow-500'
    );

    botaoEnviar.disabled = false;
    botaoEnviar.textContent = 'Enviar foto para o Supabase';

    mensagem.textContent =
      'Confira a imagem e clique em Enviar foto para o Supabase.';
  } catch (erro: unknown) {
    console.warn(
      'Captura cancelada ou indisponível:',
      erro
    );

    mensagem.textContent =
      'Captura cancelada ou câmera indisponível.';
  } finally {
    botaoCamera.disabled = false;
    botaoGaleria.disabled = false;
  }
}

// Envia a imagem para o Supabase Storage
async function enviarFoto(): Promise<void> {
  if (!fotoSelecionada || enviando) {
    mensagem.textContent =
      'Tire uma foto ou escolha uma imagem primeiro.';
    return;
  }

  enviando = true;

  botaoEnviar.disabled = true;
  botaoCamera.disabled = true;
  botaoGaleria.disabled = true;

  atualizarStatus(
    'Enviando para o Supabase...',
    'bg-yellow-500'
  );

  mensagem.textContent = 'Enviando foto... Aguarde.';

  try {
    const resposta = await fetch(fotoSelecionada);

    if (!resposta.ok) {
      throw new Error(
        'Não foi possível ler a imagem selecionada.'
      );
    }

    const blob = await resposta.blob();

    const extensao = blob.type.includes('png')
      ? 'png'
      : 'jpg';

    const nomeArquivo =
      `hodometro-${Date.now()}.${extensao}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(nomeArquivo, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(nomeArquivo);

    if (!data.publicUrl) {
      throw new Error(
        'Não foi possível obter a URL pública da foto.'
      );
    }

    // Atualiza a interface após o envio
    fotoSelecionada = null;

    mostrarImagem(data.publicUrl);

    atualizarStatus(
      'Foto salva no Supabase',
      'bg-emerald-500'
    );

    mensagem.textContent =
      'Foto enviada com sucesso!';

    botaoEnviar.textContent = 'Foto enviada';
  } catch (erro: unknown) {
    console.error('Erro ao enviar foto:', erro);

    atualizarStatus('Falha no envio', 'bg-red-500');

    const detalhe = erro instanceof Error
      ? erro.message
      : 'Verifique a conexão e as políticas do Storage.';

    mensagem.textContent =
      `Não foi possível enviar a foto: ${detalhe}`;
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

// Eventos dos botões
botaoCamera.addEventListener('click', () => {
  void abrirCamera(CameraSource.Camera);
});

botaoGaleria.addEventListener('click', () => {
  void abrirCamera(CameraSource.Photos);
});

botaoEnviar.addEventListener('click', () => {
  void enviarFoto();
});

// Remove a imagem da pré-visualização
botaoRemover.addEventListener('click', () => {
  if (enviando) return;

  fotoSelecionada = null;

  imagemPreview.removeAttribute('src');
  imagemPreview.classList.add('hidden');

  placeholder.classList.remove('hidden');
  legendaPreview.classList.add('hidden');
  botaoRemover.classList.add('hidden');

  atualizarStatus('Aguardando imagem');

  mensagem.textContent =
    'Imagem removida da visualização.';

  botaoEnviar.disabled = true;
  botaoEnviar.textContent = 'Enviar foto para o Supabase';
});
