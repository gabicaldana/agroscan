"""Criacao do schema e carga da base de conhecimento no SQLite.

A base de conhecimento vive em data/base_conhecimento.json (editavel a mao,
versionada no git). Este modulo transforma esse JSON em um banco relacional
normalizado, que e o que a aplicacao consulta.

Rodar:  python -m app.db
"""

import json
import sqlite3
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CAMINHO_JSON = RAIZ / "data" / "base_conhecimento.json"
CAMINHO_DB = RAIZ / "data" / "agronomia.db"

SCHEMA = """
DROP TABLE IF EXISTS doenca_sintoma;
DROP TABLE IF EXISTS tratamento;
DROP TABLE IF EXISTS ingrediente_ativo;
DROP TABLE IF EXISTS doenca;
DROP TABLE IF EXISTS sintoma;
DROP TABLE IF EXISTS cultura;

CREATE TABLE cultura (
    id              TEXT PRIMARY KEY,
    nome            TEXT NOT NULL,
    nome_cientifico TEXT NOT NULL,
    emoji           TEXT NOT NULL
);

CREATE TABLE sintoma (
    id    TEXT PRIMARY KEY,
    nome  TEXT NOT NULL,
    orgao TEXT NOT NULL
);

CREATE TABLE doenca (
    id                    TEXT PRIMARY KEY,
    cultura_id            TEXT NOT NULL REFERENCES cultura(id),
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


def conectar() -> sqlite3.Connection:
    con = sqlite3.connect(CAMINHO_DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def carregar_json() -> dict:
    with open(CAMINHO_JSON, encoding="utf-8") as f:
        return json.load(f)


def semear() -> None:
    """Recria o banco do zero a partir do JSON."""
    base = carregar_json()

    CAMINHO_DB.parent.mkdir(exist_ok=True)
    con = conectar()
    con.executescript(SCHEMA)

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
                       id, cultura_id, nome, agente, tipo_agente, gravidade,
                       descricao, cond_temperatura, cond_umidade, cond_observacao
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (d["id"], cultura["id"], d["nome"], d["agente"],
                 d["tipo_agente"], d["gravidade"], d["descricao"],
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
    con.close()

    print(f"Banco criado em {CAMINHO_DB}")
    print(f"  {n_culturas} culturas, {total_doencas} doencas, "
          f"{n_sintomas} sintomas no catalogo")


if __name__ == "__main__":
    semear()
