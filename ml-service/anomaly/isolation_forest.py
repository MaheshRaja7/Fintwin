import numpy as np
import pandas as pd
from typing import List, Dict, Any
from sklearn.ensemble import IsolationForest
import logging

logger = logging.getLogger("AnomalyDetector")

class AnomalyDetector:
    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination

    def detect_anomalies(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Uses Isolation Forest to detect atypical transactions based on:
        - transaction amount
        - amount relative to category median
        - day-of-week timing
        - merchant-specific frequency
        """
        expense_txs = [t for t in transactions if t.get("type") == "expense"]
        if len(expense_txs) < 5:
            # Not enough data for isolation forest training; use statistical z-score baseline
            return self._statistical_fallback(expense_txs)

        df = pd.DataFrame(expense_txs)
        df["amount"] = df["amount"].astype(float)
        df["date"] = pd.to_datetime(df["date"])
        df["day_of_week"] = df["date"].dt.dayofweek

        # Category statistics
        cat_medians = df.groupby("category")["amount"].transform("median")
        cat_means = df.groupby("category")["amount"].transform("mean")
        cat_stds = df.groupby("category")["amount"].transform("std").fillna(10.0)

        # Ratio to category median (how many times bigger than typical)
        df["category_ratio"] = df["amount"] / np.maximum(1.0, cat_medians)
        df["z_score"] = (df["amount"] - cat_means) / np.maximum(1.0, cat_stds)

        # Features for Isolation Forest:
        # [amount, category_ratio, z_score, day_of_week]
        feature_matrix = df[["amount", "category_ratio", "z_score", "day_of_week"]].values

        try:
            iso = IsolationForest(
                n_estimators=100,
                contamination=min(0.12, max(0.03, self.contamination)),
                random_state=42
            )
            df["is_anomaly"] = iso.fit_predict(feature_matrix)  # -1 for anomaly, 1 for normal
            df["anomaly_score"] = -iso.score_samples(feature_matrix)  # higher = more anomalous
        except Exception as e:
            logger.warning(f"Isolation Forest fitting failed, falling back to heuristic: {e}")
            return self._statistical_fallback(expense_txs)

        anomalies = []
        # Filter where is_anomaly == -1 and category_ratio >= 1.8 or amount >= 3x typical
        anomaly_rows = df[(df["is_anomaly"] == -1) & ((df["category_ratio"] >= 1.7) | (df["z_score"] >= 2.0))]

        for _, row in anomaly_rows.iterrows():
            ratio = round(float(row["category_ratio"]), 1)
            cat = row.get("category", "expense")
            merchant = row.get("merchant", "")
            amt = float(row["amount"])

            if ratio >= 2.0:
                explanation = f"This is {ratio}× higher than your typical {cat} transaction."
            else:
                explanation = f"Unusual amount for {cat} compared to historical patterns."

            anomalies.append({
                "transactionId": str(row.get("id") or row.get("_id") or ""),
                "date": str(row["date"].date()),
                "amount": round(amt, 2),
                "merchant": merchant,
                "category": cat,
                "description": row.get("description", ""),
                "multiplier": ratio,
                "anomalyScore": round(float(row["anomaly_score"]), 3),
                "alertTitle": "Unusual spending detected",
                "explanation": explanation,
                "severity": "high" if ratio >= 3.0 else "medium"
            })

        # Sort by highest multiplier/severity
        anomalies.sort(key=lambda x: x["multiplier"], reverse=True)
        return anomalies

    def _statistical_fallback(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        anomalies = []
        if not transactions:
            return anomalies

        df = pd.DataFrame(transactions)
        df["amount"] = df["amount"].astype(float)
        mean_amt = df["amount"].mean()
        std_amt = df["amount"].std() or 1.0

        for _, row in df.iterrows():
            amt = float(row["amount"])
            if amt > mean_amt + (2.2 * std_amt):
                ratio = round(amt / max(1.0, mean_amt), 1)
                anomalies.append({
                    "transactionId": str(row.get("id") or row.get("_id") or ""),
                    "date": str(pd.to_datetime(row.get("date")).date()),
                    "amount": round(amt, 2),
                    "merchant": row.get("merchant", ""),
                    "category": row.get("category", "General"),
                    "description": row.get("description", ""),
                    "multiplier": ratio,
                    "anomalyScore": 0.85,
                    "alertTitle": "Unusual spending detected",
                    "explanation": f"Transaction amount is {ratio}× higher than average spending.",
                    "severity": "medium"
                })
        return anomalies
