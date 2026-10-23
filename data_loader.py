"""Load and summarize the GSM TP values CSV with pandas."""

from __future__ import annotations

from pathlib import Path

import pandas as pd


CSV_PATH = Path(__file__).resolve().parent / "data" / "GSM TP VALUES (2017-2026).csv"
DISTRICT_CSV_PATH = Path(__file__).resolve().parent / "data" / "District Data.csv"
REQUIRED_COLUMNS = {"Province", "District_ID", "District", "Group", "Fiscal", "TP value total"}
TEXT_COLUMNS = ["Province", "District_ID", "District", "Group"]
PROGRAM_START_COLUMN = "FALAH 2007-2012 USAID Pop. Council USD 14.3m"
PROGRAM_END_COLUMN = "RAF 2011-2013 CMW"
PARTNER_ORDER = ("KFW", "LAD", "DFID", "GF", "BMGF", "USAID", "Packard", "PPIF", "Other")
DISTRICT_FIELD_MAP = {
    "Est. Population 2026": "population",
    "MWRA 2026": "mwra",
    "Total Unit": "totalUnits",
    "Total Users": "totalFpUsers",
    "Users Condoms": "condomUsers",
    "Users Injectables": "injectableUsers",
    "Users IUD": "iudUsers",
    "Users Pills": "pillsUsers",
    "Implant Users": "implantUsers",
    "VSC Users": "vscUsers",
    "Total CYPs": "totalCyp",
    "CYPs Condoms": "cypCondom",
    "CYPs Injectables": "cypInjectables",
    "CYPs IUDs": "cypIud",
    "CYPs Pills": "cypPills",
    "CYPs Implant": "cypImplant",
    "CYPs VSC": "cypVsc",
    "FP clients": "fpClients",
    "IUD Insertions": "iudInsertions",
    "New Users": "newUsers",
    "PAC FP": "pacfp",
    "PPIUCD 10 Years": "ppIucd",
    "Deliveries": "deliveries",
    "MVA  Cases": "mva",
    "TB Patients": "tbPatients",
    "Total Providers": "providers",
    "MBBS": "mbbs",
    "LHV /CMW": "lhvCmw",
    "Hakeem /Homeo": "hakeem",
    "Nurse /Desp.": "nurse",
    "Sitara Baji": "sitaraBaji",
    "Sattar Bhahi": "sattarBhahi",
    "Total Chemists": "chemists",
    "Total Outlets": "outlets",
    "MWRA Registration (IPC)": "mwraRegistrations",
    "Neighborhood Meeting (IPC)": "neighborhoodMeetings",
    "Orientation Meeting (IPC)": "orientationMeetings",
    "Token Redeem (IPC)": "tokenRedeem",
    "Total TP": "totalTp",
    "mCPR% 2023": "mcpr",
}


def load_tp_values(path: Path = CSV_PATH) -> pd.DataFrame:
    """Read, normalize, and validate the TP CSV.

    District IDs are explicitly read as pandas strings so leading zeroes survive.
    Numeric conversion is also handled by pandas and rejects malformed values.
    """
    frame = pd.read_csv(
        Path(path),
        encoding="utf-8-sig",
        dtype={column: "string" for column in TEXT_COLUMNS},
    )
    missing = REQUIRED_COLUMNS - set(frame.columns)
    if missing:
        raise ValueError(f"Missing CSV columns: {', '.join(sorted(missing))}")

    for column in TEXT_COLUMNS:
        frame[column] = frame[column].str.strip()
        if frame[column].isna().any() or frame[column].eq("").any():
            raise ValueError(f"CSV column contains empty values: {column}")
    frame["District_ID"] = frame["District_ID"].str.zfill(6)

    frame["Fiscal"] = pd.to_numeric(frame["Fiscal"], errors="coerce").astype("Int64")
    frame["TP value total"] = pd.to_numeric(frame["TP value total"], errors="coerce").astype("Int64")
    if frame["Fiscal"].isna().any():
        raise ValueError("CSV contains an invalid Fiscal year")
    if frame["TP value total"].isna().any():
        raise ValueError("CSV contains an invalid TP value total")

    return frame


def _numeric_series(series: pd.Series) -> pd.Series:
    cleaned = (
        series.astype("string")
        .str.strip()
        .replace({"": pd.NA, "-": pd.NA, "-   ": pd.NA})
        .str.replace(",", "", regex=False)
        .str.replace("%", "", regex=False)
    )
    return pd.to_numeric(cleaned, errors="coerce")


def _programme_partner(column: str) -> str:
    """Map a full programme column name to its short partner name."""
    name = column.upper()
    padded = f" {name} "
    if "BMGF" in name:
        return "BMGF"
    if "USAID" in name:
        return "USAID"
    if "KFW" in name:
        return "KFW"
    if "DFID" in name or "DAFPAK" in name:
        return "DFID"
    if " GF " in padded:
        return "GF"
    if name.startswith("LAD "):
        return "LAD"
    if "PACKARD" in name:
        return "Packard"
    if "PPIF" in name:
        return "PPIF"
    return "Other"


def _add_partner_flags(frame: pd.DataFrame) -> None:
    """Create one 0/1 partner flag per district from programme indicators."""
    columns = list(frame.columns)
    if PROGRAM_START_COLUMN not in columns or PROGRAM_END_COLUMN not in columns:
        for partner in PARTNER_ORDER:
            frame[f"partner_{partner}"] = 0
        return

    start = columns.index(PROGRAM_START_COLUMN)
    end = columns.index(PROGRAM_END_COLUMN) + 1
    grouped = {partner: [] for partner in PARTNER_ORDER}
    for column in columns[start:end]:
        grouped[_programme_partner(column)].append(column)

    for partner, source_columns in grouped.items():
        values = frame[source_columns].apply(_numeric_series).fillna(0)
        frame[f"partner_{partner}"] = values.sum(axis=1).gt(0).astype("Int64")


def load_district_data(path: Path = DISTRICT_CSV_PATH) -> pd.DataFrame:
    """Load the wide district profile CSV and normalize its numeric fields."""
    frame = pd.read_csv(Path(path), encoding="utf-8-sig")
    frame.columns = frame.columns.astype(str).str.strip()
    required = {"Provinces", "Districts", "District_ID"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Missing district CSV columns: {', '.join(sorted(missing))}")
    frame["Province"] = frame["Provinces"].astype("string").str.strip()
    frame["District"] = frame["Districts"].astype("string").str.strip()
    frame["district_id"] = frame["District_ID"].astype("string").str.strip().str.zfill(6)
    for source, target in DISTRICT_FIELD_MAP.items():
        if source in frame.columns:
            frame[target] = _numeric_series(frame[source])
    _add_partner_flags(frame)
    if "mcpr" in frame:
        frame["mcpr"] = frame["mcpr"] / 100
    return frame


def district_metadata(frame: pd.DataFrame, years: list[int]) -> dict:
    districts = frame[["district_id", "District", "Province"]].drop_duplicates().sort_values(["Province", "District"])
    return {
        "years": years,
        "provinces": sorted(frame["Province"].dropna().unique().tolist()),
        "districts": [
            {"id": row.district_id, "name": row.District, "province": row.Province}
            for row in districts.itertuples(index=False)
        ],
        "record_count": int(len(frame)),
    }


def _sum_metric(frame: pd.DataFrame, column: str):
    if column not in frame or not frame[column].notna().any():
        return None
    return int(frame[column].sum())


def summarize_district_data(frame: pd.DataFrame, *, province: str = "", district_id: str = "") -> dict:
    filtered = frame
    if province:
        filtered = filtered[filtered["Province"].eq(province)]
    if district_id:
        filtered = filtered[filtered["district_id"].eq(str(district_id).zfill(6))]

    population = _sum_metric(filtered, "population")
    mcpr_values = filtered["mcpr"].dropna() if "mcpr" in filtered else pd.Series(dtype=float)
    # Keep the national unfiltered view blank because mCPR is reported as a
    # province/district indicator in the source profile, not as one dashboard
    # wide aggregate. Geographic selections retain the source value or the
    # population-weighted province calculation.
    if not province and not district_id:
        mcpr = None
    elif population and "population" in filtered and mcpr_values.size:
        weighted = filtered[["population", "mcpr"]].dropna()
        mcpr = float((weighted["population"] * weighted["mcpr"]).sum() / weighted["population"].sum()) if not weighted.empty else None
    else:
        mcpr = float(mcpr_values.mean()) if mcpr_values.size else None

    fp_users = {
        "condom": _sum_metric(filtered, "condomUsers"),
        "pills": _sum_metric(filtered, "pillsUsers"),
        "iud": _sum_metric(filtered, "iudUsers"),
        "injectables": _sum_metric(filtered, "injectableUsers"),
        "implant": _sum_metric(filtered, "implantUsers"),
        "vsc": _sum_metric(filtered, "vscUsers"),
    }
    beneficiaries = {
        "fpClients": _sum_metric(filtered, "fpClients"),
        "nfpUsers": _sum_metric(filtered, "newUsers"),
        "deliveries": _sum_metric(filtered, "deliveries"),
        "ipc": _sum_metric(filtered, "mwraRegistrations"),
        "tb": _sum_metric(filtered, "tbPatients"),
        "other": None,
    }
    total_tp = _sum_metric(filtered, "totalTp")
    cadre_values = [_sum_metric(filtered, "hakeem"), _sum_metric(filtered, "nurse"), _sum_metric(filtered, "sitaraBaji"), _sum_metric(filtered, "sattarBhahi")]
    other_cadres = sum(value or 0 for value in cadre_values) if any(value is not None for value in cadre_values) else None
    partners = {
        partner: int(filtered[f"partner_{partner}"].fillna(0).sum() > 0)
        for partner in PARTNER_ORDER
    }
    return {
        "record_count": int(len(filtered)),
        "population": population,
        "mwra": _sum_metric(filtered, "mwra"),
        "totalUnits": _sum_metric(filtered, "totalUnits"),
        "mcpr": mcpr,
        "cyp": {
            "total": _sum_metric(filtered, "totalCyp"),
            "condom": _sum_metric(filtered, "cypCondom"),
            "pills": _sum_metric(filtered, "cypPills"),
            "iud": _sum_metric(filtered, "cypIud"),
            "injectables": _sum_metric(filtered, "cypInjectables"),
            "implant": _sum_metric(filtered, "cypImplant"),
            "vsc": _sum_metric(filtered, "cypVsc"),
        },
        "network": {
            "total": sum(value or 0 for value in [_sum_metric(filtered, "providers"), _sum_metric(filtered, "chemists"), _sum_metric(filtered, "outlets"), other_cadres]),
            "providers": _sum_metric(filtered, "providers"),
            "chemists": _sum_metric(filtered, "chemists"),
            "outlets": _sum_metric(filtered, "outlets"),
            "mbbs": _sum_metric(filtered, "mbbs"),
            "lhvCmw": _sum_metric(filtered, "lhvCmw"),
            "hakeem": _sum_metric(filtered, "hakeem"),
            "nurse": _sum_metric(filtered, "nurse"),
            "otherCadres": other_cadres,
        },
        "services": {
            "fpClients": _sum_metric(filtered, "fpClients"),
            "iudInsertions": _sum_metric(filtered, "iudInsertions"),
            "mva": _sum_metric(filtered, "mva"),
            "pacfp": _sum_metric(filtered, "pacfp"),
            "deliveries": _sum_metric(filtered, "deliveries"),
        },
        "healthImpact": {"pregnanciesAverted": None, "maternalDeathsAverted": None, "childDeathsAverted": None, "abortionsAverted": None},
        "fpUsers": fp_users,
        "beneficiaries": beneficiaries,
        "partners": partners,
        "avgSales": int(round(total_tp / 10)) if total_tp is not None else None,
        "totalFpUsers": _sum_metric(filtered, "totalFpUsers"),
        "condomUsers": fp_users["condom"],
        "iudUsers": fp_users["iud"],
        "pillsUsers": fp_users["pills"],
        "injectableUsers": fp_users["injectables"],
        "mwraRegistrations": _sum_metric(filtered, "mwraRegistrations"),
        "tbPatients": _sum_metric(filtered, "tbPatients"),
    }


def metadata(frame: pd.DataFrame) -> dict:
    districts = (
        frame[["District_ID", "District", "Province"]]
        .drop_duplicates()
        .sort_values(["Province", "District"])
    )
    return {
        "years": sorted(int(year) for year in frame["Fiscal"].unique()),
        "provinces": sorted(frame["Province"].unique().tolist()),
        "groups": sorted(frame["Group"].unique().tolist()),
        "districts": [
            {"id": row.District_ID, "name": row.District, "province": row.Province}
            for row in districts.itertuples(index=False)
        ],
        "record_count": int(len(frame)),
    }


def summarize(
    frame: pd.DataFrame,
    *,
    province: str = "",
    district_id: str = "",
    group: str = "",
    fiscal: str | int = "",
) -> dict:
    """Filter with pandas and sum repeated rows by fiscal year."""
    filtered = frame
    if province:
        filtered = filtered[filtered["Province"].eq(province)]
    if district_id:
        filtered = filtered[filtered["District_ID"].eq(district_id)]
    if group:
        filtered = filtered[filtered["Group"].eq(group)]
    if fiscal:
        filtered = filtered[filtered["Fiscal"].eq(int(fiscal))]

    totals = filtered.groupby("Fiscal")["TP value total"].sum()
    years = [int(fiscal)] if fiscal else sorted(int(year) for year in frame["Fiscal"].unique())
    return {
        "filters": {"province": province, "district_id": district_id, "group": group, "fiscal": fiscal},
        "annual": [{"year": year, "value": int(totals.get(year, 0))} for year in years],
        "total": int(filtered["TP value total"].sum()),
        "average_annual": int(round(filtered["TP value total"].sum() / len(years))) if years else 0,
        "record_count": int(len(filtered)),
    }
