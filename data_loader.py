"""Load and summarize the GSM TP values CSV with pandas."""

from __future__ import annotations

from pathlib import Path

import pandas as pd


CSV_PATH = Path(__file__).resolve().parent / "data" / "GSM TP VALUES (2017-2026).csv"
REQUIRED_COLUMNS = {"Province", "District_ID", "District", "Group", "Fiscal", "TP value total"}
TEXT_COLUMNS = ["Province", "District_ID", "District", "Group"]


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

    frame["Fiscal"] = pd.to_numeric(frame["Fiscal"], errors="coerce").astype("Int64")
    frame["TP value total"] = pd.to_numeric(frame["TP value total"], errors="coerce").astype("Int64")
    if frame["Fiscal"].isna().any():
        raise ValueError("CSV contains an invalid Fiscal year")
    if frame["TP value total"].isna().any():
        raise ValueError("CSV contains an invalid TP value total")

    return frame


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
) -> dict:
    """Filter with pandas and sum repeated rows by fiscal year."""
    filtered = frame
    if province:
        filtered = filtered[filtered["Province"].eq(province)]
    if district_id:
        filtered = filtered[filtered["District_ID"].eq(district_id)]
    if group:
        filtered = filtered[filtered["Group"].eq(group)]

    totals = filtered.groupby("Fiscal")["TP value total"].sum()
    years = sorted(int(year) for year in frame["Fiscal"].unique())
    return {
        "filters": {"province": province, "district_id": district_id, "group": group},
        "annual": [{"year": year, "value": int(totals.get(year, 0))} for year in years],
        "total": int(filtered["TP value total"].sum()),
        "average_annual": int(round(filtered["TP value total"].sum() / len(years))) if years else 0,
        "record_count": int(len(filtered)),
    }
