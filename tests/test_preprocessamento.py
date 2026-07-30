"""Testes do pre-processamento de referencia.

Sem dependencias externas - roda com:
    python -m unittest discover -s tests -t .
"""

import json
import unittest

from app import preprocessamento as pre


class TestTamanho(unittest.TestCase):

    def test_lado_menor_vai_para_256_mantendo_proporcao(self):
        self.assertEqual(pre.tamanho_apos_redimensionar(640, 480), (341, 256))
        self.assertEqual(pre.tamanho_apos_redimensionar(480, 640), (256, 341))
        self.assertEqual(pre.tamanho_apos_redimensionar(224, 224), (256, 256))

    def test_arredonda_meio_para_cima_e_nao_para_o_par(self):
        """`round()` do Python arredonda meio para o par e o JavaScript nao.

        Numa imagem em que a conta cai exatamente no meio, usar `round()` daria
        uma altura de saida diferente nas duas linguagens e o tensor inteiro
        sairia deslocado - sem erro nenhum, so acuracia perdida.
        """
        self.assertEqual(pre.arredondar(2.5), 3)
        self.assertEqual(pre.arredondar(3.5), 4)
        self.assertEqual(round(2.5), 2)  # o que NAO se quer


class TestFiltro(unittest.TestCase):

    def test_os_pesos_de_cada_pixel_somam_1(self):
        for entrada, saida in [(640, 256), (97, 256), (256, 256), (1000, 224)]:
            for _, pesos in pre.coeficientes(entrada, saida):
                self.assertAlmostEqual(sum(pesos), 1.0, places=12)

    def test_reduzir_alarga_a_janela_e_ampliar_nao(self):
        """E isso que faz o antisserrilhamento existir.

        Reduzindo, cada pixel de saida tem que enxergar varios de entrada; sem
        isso a amostragem pula pixels e inventa faixas de moire.
        """
        reduzindo = pre.coeficientes(800, 256)
        ampliando = pre.coeficientes(100, 256)
        self.assertGreater(len(reduzindo[128][1]), 4)
        self.assertLessEqual(len(ampliando[128][1]), 2)

    def test_a_janela_nunca_sai_da_imagem(self):
        for inicio, pesos in pre.coeficientes(97, 256):
            self.assertGreaterEqual(inicio, 0)
            self.assertLessEqual(inicio + len(pesos), 97)


class TestPipeline(unittest.TestCase):

    def test_a_saida_e_um_tensor_nchw_de_224(self):
        pixels = pre.gerar_imagem("gradiente", 300, 200)
        tensor = pre.preprocessar(pixels, 300, 200)
        self.assertEqual(len(tensor), 3 * 224 * 224)

    def test_imagem_uniforme_vira_tensor_uniforme(self):
        """Cinza 128 em toda a imagem: cada canal tem que sair constante, no
        valor normalizado daquele canal. Pega erro de indice na reordenacao
        para NCHW, que e facil de escrever errado e dificil de ver."""
        pixels = [128] * (50 * 40 * 3)
        tensor = pre.preprocessar(pixels, 50, 40)

        for c in range(3):
            plano = tensor[c * 224 * 224:(c + 1) * 224 * 224]
            esperado = (128 / 255 - pre.MEDIA[c]) / pre.DESVIO[c]
            self.assertAlmostEqual(min(plano), esperado, places=6)
            self.assertAlmostEqual(max(plano), esperado, places=6)

    def test_os_canais_nao_se_misturam(self):
        """Imagem vermelha pura: o plano R alto, G e B no minimo."""
        pixels = [255, 0, 0] * (60 * 60)
        tensor = pre.preprocessar(pixels, 60, 60)

        planos = [tensor[c * 224 * 224:(c + 1) * 224 * 224] for c in range(3)]
        self.assertGreater(planos[0][0], planos[1][0])
        self.assertGreater(planos[0][0], planos[2][0])

    def test_antisserrilhamento_apaga_listras_de_1_pixel(self):
        """Reduzindo listras de 1 px, o resultado tem que ser quase uniforme.

        Sem o suporte escalado, sobrariam faixas largas que nao existem na
        imagem - e o modelo classificaria a textura inventada pelo
        redimensionamento.
        """
        tensor = pre.preprocessar(
            pre.gerar_imagem("listras", 800, 600), 800, 600)
        canal = tensor[:224 * 224]
        media = sum(canal) / len(canal)
        desvio = (sum((v - media) ** 2 for v in canal) / len(canal)) ** 0.5
        self.assertLess(desvio, 0.2)

    def test_ampliar_as_mesmas_listras_preserva_o_contraste(self):
        """O contraponto: o filtro nao pode simplesmente borrar tudo."""
        tensor = pre.preprocessar(
            pre.gerar_imagem("listras", 101, 97), 101, 97)
        canal = tensor[:224 * 224]
        media = sum(canal) / len(canal)
        desvio = (sum((v - media) ** 2 for v in canal) / len(canal)) ** 0.5
        self.assertGreater(desvio, 1.0)

    def test_imagem_vazia_levanta_erro(self):
        with self.assertRaises(ValueError):
            pre.preprocessar([], 0, 0)


class TestFixtures(unittest.TestCase):
    """As fixtures sao o contrato de pixel com o porte em TypeScript.

    Se o algoritmo mudar, este teste quebra e o arquivo tem que ser regerado de
    proposito - o que forca o porte a ser revisado junto. E, como o notebook de
    treino usa esta mesma transformacao, quebra tambem obriga a decidir se o
    modelo ja treinado continua valido.
    """

    def test_o_arquivo_versionado_esta_atualizado(self):
        with open(pre.CAMINHO_FIXTURES, encoding="utf-8") as f:
            gravado = json.load(f)
        atual = json.loads(json.dumps(pre.montar(), ensure_ascii=False))
        self.assertEqual(
            atual, gravado,
            "Fixtures de pixel desatualizadas. Rode "
            "`python -m app.preprocessamento` e reveja "
            "web/lib/preprocessamento.ts.")

    def test_os_casos_cobrem_ampliacao_e_reducao(self):
        """Um conjunto so de ampliacao nao exercitaria o antisserrilhamento,
        que e a parte mais facil de portar errado."""
        conteudo = pre.montar()
        reduziu = any(
            c["largura"] > c["apos_redimensionar"][0]
            for c in conteudo["casos"])
        ampliou = any(
            c["largura"] < c["apos_redimensionar"][0]
            for c in conteudo["casos"])
        self.assertTrue(reduziu and ampliou)


if __name__ == "__main__":
    unittest.main()
