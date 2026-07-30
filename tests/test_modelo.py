"""Testes do contrato entre a base de conhecimento e as saidas do modelo.

Sem dependencias externas - roda com:
    python -m unittest discover -s tests -t .
"""

import json
import unittest

from app import modelo
from app.db import BaseInvalida, carregar_json, validar

# As 38 classes do PlantVillage, na ordem em que o modelo as devolve, ESCRITAS
# A MAO.
#
# Isto nao e duplicacao boba do que `app/modelo.py` gera. E o contrario: e o
# unico ponto do projeto que nao deriva a ordem de nada. Se alguem trocar o
# `sorted()` por `sorted(key=str.lower)`, ou por uma ordenacao que ignore
# acento, ou reordenar a base, o codigo gerado muda junto e o erro passaria
# despercebido - porque gerador e verificacao seriam a mesma coisa. Esta lista
# quebra esse circulo.
#
# Repare nas armadilhas, que parecem erro de digitacao e nao sao:
#   - `Common_rust_` termina em sublinhado, assim mesmo, no dataset original;
#   - duas classes tem ESPACO no meio;
#   - `Pepper,_bell` tem virgula;
#   - `Haunglongbing` esta escrito errado no dataset, e mantemos o erro;
#   - `Tomato_Yellow...` vem ANTES de `Tomato_mosaic...` porque 'Y' < 'm';
#   - `___healthy` cai no fim do bloco de cada cultura, pelo mesmo motivo.
CLASSES_ESPERADAS = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]


class TestOrdemCanonica(unittest.TestCase):

    def test_a_ordem_gerada_bate_com_a_lista_escrita_a_mao(self):
        gerada = modelo.classes_canonicas(carregar_json())
        self.assertEqual(gerada, CLASSES_ESPERADAS)

    def test_sao_38_classes(self):
        self.assertEqual(len(CLASSES_ESPERADAS), 38)
        self.assertEqual(len(set(CLASSES_ESPERADAS)), 38)

    def test_a_ordem_e_por_ponto_de_codigo_e_nao_alfabetica(self):
        """O `sorted()` sem chave e o que o ImageFolder faz.

        Uma ordenacao "mais bonita" - minusculas normalizadas, ou acento
        ignorado - trocaria indices e o modelo passaria a responder a doenca
        errada, sempre da cultura certa, sem quebrar nenhuma tela.
        """
        i_yellow = CLASSES_ESPERADAS.index("Tomato___Tomato_Yellow_Leaf_Curl_Virus")
        i_mosaic = CLASSES_ESPERADAS.index("Tomato___Tomato_mosaic_virus")
        self.assertLess(i_yellow, i_mosaic, "'Y' (89) vem antes de 'm' (109)")

        por_minuscula = sorted(CLASSES_ESPERADAS, key=str.lower)
        self.assertNotEqual(
            por_minuscula, CLASSES_ESPERADAS,
            "se as duas ordens coincidissem, este teste nao provaria nada")

    def test_as_saudaveis_fecham_o_bloco_de_cada_cultura(self):
        for i, classe in enumerate(CLASSES_ESPERADAS):
            if not classe.endswith("___healthy"):
                continue
            prefixo = classe.split("___")[0]
            seguintes = CLASSES_ESPERADAS[i + 1:]
            self.assertFalse(
                [c for c in seguintes if c.startswith(f"{prefixo}___")],
                f"{classe} deveria ser a ultima classe de {prefixo}")


class TestContrato(unittest.TestCase):

    def setUp(self):
        self.contrato = modelo.montar()

    def test_o_arquivo_versionado_esta_atualizado(self):
        with open(modelo.CAMINHO_CONTRATO, encoding="utf-8") as f:
            gravado = json.load(f)
        atual = json.loads(json.dumps(self.contrato, ensure_ascii=False))
        self.assertEqual(
            atual, gravado,
            "O contrato esta desatualizado. Rode `python -m app.modelo` e "
            "depois `npm run base` para atualizar o espelho em TypeScript.")

    def test_todo_indice_aponta_para_a_classe_certa(self):
        for i, entrada in enumerate(self.contrato["classes"]):
            self.assertEqual(entrada["indice"], i)
            self.assertEqual(entrada["classe"], CLASSES_ESPERADAS[i])

    def test_toda_classe_de_doenca_abre_uma_ficha(self):
        base = carregar_json()
        ids = {d["id"] for c in base["culturas"] for d in c["doencas"]}
        for entrada in self.contrato["classes"]:
            if entrada["tipo"] == "doenca":
                self.assertIn(entrada["doenca_id"], ids)
            else:
                self.assertIsNone(entrada["doenca_id"])

    def test_a_classe_pertence_a_cultura_que_a_reivindica(self):
        base = carregar_json()
        prefixos = {c["id"]: c["prefixo_modelo"] for c in base["culturas"]}
        for entrada in self.contrato["classes"]:
            self.assertTrue(
                entrada["classe"].startswith(
                    f"{prefixos[entrada['cultura_id']]}___"),
                f"{entrada['classe']} atribuida a {entrada['cultura_id']}")

    def test_a_mascara_cobre_todos_os_indices_sem_sobreposicao(self):
        """Toda saida do modelo pertence a exatamente uma cultura.

        Um indice em duas culturas vazaria doenca de uma para outra; um indice
        em nenhuma seria uma saida que o app nunca conseguiria interpretar.
        """
        todos = [i for indices in self.contrato["por_cultura"].values()
                 for i in indices]
        self.assertEqual(sorted(todos), list(range(38)))

    def test_laranja_e_abobora_nao_tem_classe_saudavel(self):
        """O dataset nao traz essas duas saudaveis. O app nunca pode responder
        'sem doenca' para citros ou abobora, e o codigo nao pode assumir que
        toda cultura tem uma classe saudavel."""
        tipos = {
            cultura: {self.contrato["classes"][i]["tipo"] for i in indices}
            for cultura, indices in self.contrato["por_cultura"].items()
        }
        self.assertNotIn("saudavel", tipos["Orange"])
        self.assertNotIn("saudavel", tipos["Squash"])
        self.assertIn("saudavel", tipos["Tomato"])

    def test_culturas_sem_doenca_so_tem_a_classe_saudavel(self):
        for cultura in ("Blueberry", "Raspberry"):
            indices = self.contrato["por_cultura"][cultura]
            self.assertEqual(len(indices), 1)
            self.assertEqual(
                self.contrato["classes"][indices[0]]["tipo"], "saudavel")

    def test_a_saida_do_modelo_e_logit_e_nao_softmax(self):
        """A recusa da fase 5 precisa de temperatura e energia, e as duas sao
        impossiveis de calcular depois que o grafo ja normalizou."""
        self.assertEqual(
            self.contrato["preprocessamento"]["saida"]["tipo"], "logits")

    def test_o_arquivo_do_modelo_ainda_nao_foi_preenchido(self):
        """Vira nome e sha256 quando o ONNX voltar do Colab. Enquanto for
        nulo, a fase 5 nao tem o que carregar - e isso e explicito."""
        self.assertIsNone(self.contrato["arquivo"]["nome"])
        self.assertIsNone(self.contrato["arquivo"]["sha256"])


class TestValidacaoDasSaudaveis(unittest.TestCase):

    def setUp(self):
        self.base = carregar_json()

    def test_a_base_versionada_e_valida(self):
        validar(self.base)

    def test_pega_classe_saudavel_com_prefixo_errado(self):
        """Cherry vale por tres: o prefixo real e Cherry_(including_sour), e
        montar a classe concatenando o id daria `Cherry___healthy`, que nao
        existe no dataset."""
        for s in self.base["saudaveis"]:
            if s["cultura_id"] == "Cherry":
                s["classe_modelo"] = "Cherry___healthy"
        with self.assertRaises(BaseInvalida):
            validar(self.base)

    def test_pega_doenca_com_classe_de_outra_cultura(self):
        self.base["culturas"][0]["doencas"][0]["classe_modelo"] = \
            "Potato___Early_blight"
        with self.assertRaises(BaseInvalida):
            validar(self.base)

    def test_pega_cultura_que_nao_declara_ter_nem_nao_ter_saudavel(self):
        self.base["saudaveis"] = [
            s for s in self.base["saudaveis"] if s["cultura_id"] != "Tomato"]
        with self.assertRaises(BaseInvalida) as ctx:
            validar(self.base)
        self.assertIn("Tomato", str(ctx.exception))

    def test_pega_total_diferente_de_38(self):
        self.base["saudaveis"].pop()
        with self.assertRaises(BaseInvalida) as ctx:
            validar(self.base)
        self.assertIn("38", str(ctx.exception))

    def test_pega_prefixo_de_cultura_duplicado(self):
        self.base["culturas"][1]["prefixo_modelo"] = \
            self.base["culturas"][0]["prefixo_modelo"]
        with self.assertRaises(BaseInvalida):
            validar(self.base)

    def test_exige_motivo_para_cultura_sem_classe_saudavel(self):
        """Sem o motivo, a ausencia parece esquecimento de curadoria."""
        self.base["culturas_sem_classe_saudavel"][0].pop("motivo")
        with self.assertRaises(BaseInvalida):
            validar(self.base)


if __name__ == "__main__":
    unittest.main()
