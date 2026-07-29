"""Criacao do schema e carga da base de conhecimento no SQLite.

A base de conhecimento vive em data/base_conhecimento.json (editavel a mao,
versionada no git). Este modulo transforma esse JSON em um banco relacional
normalizado, que e o que a aplicacao consulta.

A carga valida a base antes de gravar. Como o JSON e escrito a mao, um id de
sintoma com erro de digitacao passaria despercebido e simplesmente sumiria do
perfil da doenca - o diagnostico ficaria silenciosamente errado. Aqui isso
vira erro na hora.

Rodar:  python -m app.db
"""

import json
import sqlite3
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CAMINHO_JSON = RAIZ / "data" / "base_conhecimento.json"
CAMINHO_DB = RAIZ / "data" / "agroscan.db"

SCHEMA = """
DROP TABLE IF EXISTS doenca_sintoma;
DROP TABLE IF EXISTS tratamento;
DROP TABLE IF EXISTS ingrediente_ativo;
DROP TABLE IF EXISTS doenca;
DROP TABLE IF EXISTS sintoma;
DROP TABLE IF EXISTS orgao;
DROP TABLE IF EXISTS cultura;

CREATE TABLE cultura (
    id              TEXT PRIMARY KEY,
    nome            TEXT NOT NULL,
    nome_cientifico TEXT NOT NULL,
    emoji           TEXT NOT NULL
);

-- Parte da planta onde o sintoma e observado. A `ordem` existe porque a
-- ordem alfabetica ("caule, folha, fruto, planta") nao e a ordem em que o
-- agronomo olha a planta - ele comeca pela folha.
CREATE TABLE orgao (
    id     TEXT PRIMARY KEY,
    rotulo TEXT NOT NULL,
    ordem  INTEGER NOT NULL
);

CREATE TABLE sintoma (
    id    TEXT PRIMARY KEY,
    nome  TEXT NOT NULL,
    orgao TEXT NOT NULL REFERENCES orgao(id)
);

CREATE TABLE doenca (
    id                    TEXT PRIMARY KEY,
    cultura_id            TEXT NOT NULL REFERENCES cultura(id),
    -- Classe correspondente no PlantVillage, ou NULL quando o modelo da
    -- fase 5 nao sabe reconhecer esta doenca e so o fluxo por sintomas
    -- chega ate ela.
    classe_modelo         TEXT,
    nome                  TEXT NOT NULL,
    agente                TEXT NOT NULL,
    tipo_agente           TEXT NOT NULL,
    gravidade             INTEGER NOT NULL CHECK (gravidade BETWEEN 1 AND 5),
    descricao             TEXT NOT NULL,
    cond_temperatura      TEXT NOT NULL,
    cond_umidade          TEXT NOT NULL,
    cond_observacao       TEXT NOT NULL
);

-- Tabela associativa N:N. O peso (0 a 1) diz o quanto aquele sintoma e
-- caracteristico da doenca: 1.0 = sintoma classico, 0.3 = ocasional.
-- E esse peso que faz a pontuacao do diagnostico ser util em vez de
-- so contar sintomas em comum.
CREATE TABLE doenca_sintoma (
    doenca_id  TEXT NOT NULL REFERENCES doenca(id),
    sintoma_id TEXT NOT NULL REFERENCES sintoma(id),
    peso       REAL NOT NULL CHECK (peso > 0 AND peso <= 1),
    PRIMARY KEY (doenca_id, sintoma_id)
);

CREATE TABLE tratamento (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    doenca_id TEXT NOT NULL REFERENCES doenca(id),
    tipo      TEXT NOT NULL,
    descricao TEXT NOT NULL
);

CREATE TABLE ingrediente_ativo (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    doenca_id TEXT NOT NULL REFERENCES doenca(id),
    nome      TEXT NOT NULL,
    grupo     TEXT NOT NULL,
    acao      TEXT NOT NULL
);

CREATE INDEX idx_doenca_cultura ON doenca(cultura_id);
CREATE INDEX idx_ds_sintoma ON doenca_sintoma(sintoma_id);
"""


class BaseInvalida(Exception):
    """A base de conhecimento tem um erro que impede a carga."""


def conectar() -> sqlite3.Connection:
    con = sqlite3.connect(CAMINHO_DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def carregar_json() -> dict:
    with open(CAMINHO_JSON, encoding="utf-8") as f:
        return json.load(f)


def validar(base: dict) -> None:
    """Checa a integridade da base antes de qualquer escrita.

    Levanta BaseInvalida com todos os problemas de uma vez - corrigir um
    por rodada seria insuportavel numa base curada a mao.
    """
    erros: list[str] = []

    ids_orgaos = {o["id"] for o in base["orgaos"]}
    ids_sintomas: set[str] = set()

    for s in base["sintomas"]:
        if s["id"] in ids_sintomas:
            erros.append(f"sintoma duplicado: {s['id']}")
        ids_sintomas.add(s["id"])
        if s["orgao"] not in ids_orgaos:
            erros.append(f"sintoma {s['id']}: orgao inexistente '{s['orgao']}'")

    ids_doencas: set[str] = set()
    classes: set[str] = set()
    sintomas_usados: set[str] = set()

    for cultura in base["culturas"]:
        for d in cultura["doencas"]:
            if d["id"] in ids_doencas:
                erros.append(f"doenca duplicada: {d['id']}")
            ids_doencas.add(d["id"])

            classe = d.get("classe_modelo")
            if classe is not None:
                if classe in classes:
                    erros.append(f"classe_modelo duplicada: {classe}")
                classes.add(classe)

            if not d["sintomas"]:
                erros.append(f"doenca {d['id']}: nenhum sintoma no perfil")

            vistos: set[str] = set()
            for s in d["sintomas"]:
                if s["id"] not in ids_sintomas:
                    erros.append(
                        f"doenca {d['id']}: sintoma inexistente '{s['id']}'")
                if s["id"] in vistos:
                    erros.append(
                        f"doenca {d['id']}: sintoma repetido '{s['id']}'")
                vistos.add(s["id"])
                sintomas_usados.add(s["id"])
                if not 0 < s["peso"] <= 1:
                    erros.append(
                        f"doenca {d['id']}/{s['id']}: peso fora de (0, 1]")

            if not any(s["peso"] == 1.0 for s in d["sintomas"]):
                erros.append(
                    f"doenca {d['id']}: nenhum sintoma de peso 1.0. Toda "
                    f"doenca precisa de um sintoma classico, senao nunca "
                    f"alcanca compatibilidade alta")

    orfaos = ids_sintomas - sintomas_usados
    if orfaos:
        erros.append(
            f"sintomas no catalogo que nenhuma doenca usa: {sorted(orfaos)}")

    if erros:
        raise BaseInvalida(
            f"{len(erros)} problema(s) na base de conhecimento:\n  - "
            + "\n  - ".join(erros))


def semear() -> None:
    """Recria o banco do zero a partir do JSON."""
    base = carregar_json()
    validar(base)

    CAMINHO_DB.parent.mkdir(exist_ok=True)
    con = conectar()
    con.executescript(SCHEMA)

    con.executemany(
        "INSERT INTO orgao (id, rotulo, ordem) VALUES (:id, :rotulo, :ordem)",
        base["orgaos"],
    )
    con.executemany(
        "INSERT INTO sintoma (id, nome, orgao) VALUES (:id, :nome, :orgao)",
        base["sintomas"],
    )

    total_doencas = 0
    for cultura in base["culturas"]:
        con.execute(
            "INSERT INTO cultura (id, nome, nome_cientifico, emoji)"
            " VALUES (?, ?, ?, ?)",
            (cultura["id"], cultura["nome"],
             cultura["nome_cientifico"], cultura["emoji"]),
        )

        for d in cultura["doencas"]:
            cond = d["condicoes_favoraveis"]
            con.execute(
                """INSERT INTO doenca (
                       id, cultura_id, classe_modelo, nome, agente,
                       tipo_agente, gravidade, descricao,
                       cond_temperatura, cond_umidade, cond_observacao
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (d["id"], cultura["id"], d.get("classe_modelo"), d["nome"],
                 d["agente"], d["tipo_agente"], d["gravidade"], d["descricao"],
                 cond["temperatura"], cond["umidade"], cond["observacao"]),
            )
            total_doencas += 1

            con.executemany(
                "INSERT INTO doenca_sintoma (doenca_id, sintoma_id, peso)"
                " VALUES (?, ?, ?)",
                [(d["id"], s["id"], s["peso"]) for s in d["sintomas"]],
            )
            con.executemany(
                "INSERT INTO tratamento (doenca_id, tipo, descricao)"
                " VALUES (?, ?, ?)",
                [(d["id"], t["tipo"], t["descricao"]) for t in d["tratamentos"]],
            )
            con.executemany(
                "INSERT INTO ingrediente_ativo (doenca_id, nome, grupo, acao)"
                " VALUES (?, ?, ?, ?)",
                [(d["id"], i["nome"], i["grupo"], i["acao"])
                 for i in d["ingredientes_ativos"]],
            )

    con.commit()
    n_culturas = len(base["culturas"])
    n_sintomas = len(base["sintomas"])
    n_com_classe = con.execute(
        "SELECT COUNT(*) FROM doenca WHERE classe_modelo IS NOT NULL"
    ).fetchone()[0]
    con.close()

    print(f"Banco criado em {CAMINHO_DB}")
    print(f"  {n_culturas} culturas, {total_doencas} doencas, "
          f"{n_sintomas} sintomas no catalogo")
    print(f"  {n_com_classe} doencas com classe no PlantVillage, "
          f"{total_doencas - n_com_classe} so por sintomas")


if __name__ == "__main__":
    semear()
