"""Testes do motor de diagnostico.

Sem dependencias externas - roda com:  python -m unittest discover tests
"""

import unittest

from app.diagnostico import detalhar_doenca, diagnosticar, listar_sintomas_da_cultura


class TestDiagnostico(unittest.TestCase):

    def test_sintoma_classico_traz_doenca_certa_em_primeiro(self):
        """Aneis concentricos + desfolha de baixo = pinta-preta, sem duvida."""
        hip = diagnosticar("tomate", {"manchas_escuras_aneis",
                                      "desfolha_baixo_para_cima"})
        self.assertTrue(hip)
        self.assertEqual(hip[0].doenca_id, "tomate_pinta_preta")
        self.assertGreater(hip[0].compatibilidade, 0.6)

    def test_separa_requeima_de_pinta_preta(self):
        """Mofo branco na face inferior e o sinal que distingue a requeima."""
        hip = diagnosticar("tomate", {"manchas_encharcadas",
                                      "mofo_branco_face_inferior"})
        self.assertEqual(hip[0].doenca_id, "tomate_requeima")

    def test_sintoma_inespecifico_nao_da_certeza(self):
        """Manchas amareladas sozinhas aparecem em varias doencas.

        O sistema tem que devolver multiplas hipoteses com pontuacao baixa,
        e nao fingir certeza.
        """
        hip = diagnosticar("tomate", {"manchas_amareladas"})
        self.assertGreater(len(hip), 1)
        self.assertLess(hip[0].compatibilidade, 0.5)

    def test_sintomas_sobrando_derrubam_a_pontuacao(self):
        """Marcar sintomas que a doenca nao explica deve penalizar."""
        so_o_classico = diagnosticar("tomate", {"manchas_escuras_aneis"})[0]
        com_ruido = next(
            h for h in diagnosticar(
                "tomate", {"manchas_escuras_aneis", "po_branco_superficie"})
            if h.doenca_id == "tomate_pinta_preta"
        )
        self.assertLess(com_ruido.compatibilidade, so_o_classico.compatibilidade)
        self.assertIn("Po branco na superficie da folha",
                      com_ruido.sintomas_nao_explicados)

    def test_pergunta_de_desempate_e_a_de_maior_peso(self):
        """O primeiro sintoma ausente deve ser o mais caracteristico.

        E ele que o app vai perguntar ao usuario para confirmar a hipotese.
        """
        hip = diagnosticar("tomate", {"manchas_encharcadas"})
        requeima = next(h for h in hip if h.doenca_id == "tomate_requeima")
        self.assertEqual(requeima.sintomas_esperados_ausentes[0],
                         "Mofo esbranquicado na face inferior da folha")

    def test_sem_sintomas_nao_devolve_nada(self):
        self.assertEqual(diagnosticar("tomate", set()), [])

    def test_sintomas_sao_filtrados_por_cultura(self):
        """Nao faz sentido perguntar de mofo branco de folha para milho."""
        ids_milho = {s["id"] for s in listar_sintomas_da_cultura("milho")}
        self.assertIn("pustulas_ferruginosas", ids_milho)
        self.assertNotIn("mofo_branco_face_inferior", ids_milho)

    def test_ficha_completa_tem_todos_os_blocos(self):
        d = detalhar_doenca("soja_ferrugem_asiatica")
        self.assertEqual(d["cultura"], "Soja")
        self.assertEqual(d["gravidade"], 5)
        self.assertTrue(d["descricao"])
        self.assertTrue(d["tratamentos"])
        self.assertTrue(d["ingredientes_ativos"])
        self.assertIn("temperatura", d["condicoes_favoraveis"])

    def test_tratamentos_vem_na_ordem_do_manejo_integrado(self):
        """Cultural antes de biologico antes de quimico - nao e cosmetico,
        e a ordem que o MIP recomenda."""
        tipos = [t["tipo"] for t in detalhar_doenca("soja_mofo_branco")["tratamentos"]]
        self.assertEqual(tipos, sorted(
            tipos, key=lambda t: {"cultural": 1, "biologico": 2, "quimico": 3}[t]))

    def test_doenca_inexistente_levanta_erro(self):
        with self.assertRaises(KeyError):
            detalhar_doenca("tomate_doenca_que_nao_existe")


if __name__ == "__main__":
    unittest.main()
