
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
    Imagem selecionada
  `;

  mensagem.textContent = 'Imagem carregada com sucesso!';
}

async function abrirCamera(origem) {
  mensagem.textContent = '';

  try {
    const foto = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: origem
    });

    if (foto.webPath) {
      mostrarImagem(foto.webPath);
    } else {
      mensagem.textContent = 'Não foi possível carregar a imagem.';
    }
  } catch (erro) {
    // O usuário pode ter cancelado a câmera ou a galeria.
    console.info('Captura cancelada ou indisponível:', erro);
    mensagem.textContent = 'Ação cancelada ou câmera indisponível.';
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

  mensagem.textContent = 'Imagem removida.';
});
