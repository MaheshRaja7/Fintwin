import numpy as np
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

from sklearn.linear_model import LogisticRegression

logger = logging.getLogger("OverspendingClassifier")

class OverspendingPredictor:
    def __init__(self):
        self.model = None

    def predict_risk(
        self,
        transactions: List[Dict[str, Any]],
        budgets: List[Dict[str, Any]],
        monthly_income: float = 50000.0
    ) -> Dict[str, Any]:
        """
        Calculates overspending risk across overall spending and specific categories.
        Uses engineered features:
        - budget_utilization
        - days_remaining
        - average_daily_spending
        - recent_spending_acceleration (last 7 days vs previous 7 days)
        - current_month_spending
        - previous_month_spending
        - category_growth
        """
        now = datetime.now()
        current_month = now.month
        current_year = now.year

        # Calculate days in month & days remaining
        next_month = now.replace(day=28) + timedelta(days=4)
        total_days_in_month = (next_month - timedelta(days=next_month.day)).day
        days_passed = max(1, now.day)
        days_remaining = max(1, total_days_in_month - now.day)
        month_progress = days_passed / total_days_in_month

        expense_txs = [t for t in transactions if t.get("type") == "expense"]
        if not expense_txs:
            return {
                "overall": {
                    "risk": "LOW",
                    "probability": 0.05,
                    "budgetUtilization": 0.0,
                    "currentSpending": 0.0,
                    "projectedTotal": 0.0,
                    "message": "No expense records found. Overspending risk is negligible."
                },
                "categories": []
            }

        df = pd.DataFrame(expense_txs)
        df["date"] = pd.to_datetime(df["date"], utc=True).dt.tz_localize(None)
        df["amount"] = df["amount"].astype(float)

        # Separate into current month and previous month
        curr_mask = (df["date"].dt.month == current_month) & (df["date"].dt.year == current_year)
        prev_month = 12 if current_month == 1 else current_month - 1
        prev_year = current_year - 1 if current_month == 1 else current_year
        prev_mask = (df["date"].dt.month == prev_month) & (df["date"].dt.year == prev_year)

        curr_df = df[curr_mask]
        prev_df = df[prev_mask]

        curr_month_spent = float(curr_df["amount"].sum()) if not curr_df.empty else 0.0
        prev_month_spent = float(prev_df["amount"].sum()) if not prev_df.empty else curr_month_spent

        # Recent 7 days vs previous 7 days acceleration
        last_7_days = curr_df[curr_df["date"] >= (now - timedelta(days=7))]
        prev_7_days = curr_df[(curr_df["date"] >= (now - timedelta(days=14))) & (curr_df["date"] < (now - timedelta(days=7)))]
        spent_last_7 = float(last_7_days["amount"].sum()) if not last_7_days.empty else 0.0
        spent_prev_7 = float(prev_7_days["amount"].sum()) if not prev_7_days.empty else 0.0
        recent_accel = (spent_last_7 - spent_prev_7) / max(1.0, spent_prev_7)

        # Determine overall budget target
        total_budget_target = sum([float(b.get("limit", 0)) for b in budgets])
        if total_budget_target <= 0:
            total_budget_target = monthly_income * 0.70  # standard 70% rule if no budget defined

        # Overall risk estimation
        avg_daily_spent = curr_month_spent / days_passed
        projected_total = curr_month_spent + (avg_daily_spent * days_remaining * (1.0 + max(-0.2, min(0.5, recent_accel * 0.3))))
        utilization = curr_month_spent / max(1.0, total_budget_target)
        projected_ratio = projected_total / max(1.0, total_budget_target)

        # Feature vector for overspending classifier
        # [budget_utilization, days_remaining_ratio, avg_daily_ratio, recent_accel, projected_ratio]
        features = [
            utilization,
            days_remaining / total_days_in_month,
            (avg_daily_spent * total_days_in_month) / max(1.0, total_budget_target),
            recent_accel,
            projected_ratio
        ]

        # Calibrated Sigmoid probability from features
        # If projected_ratio > 1.0, probability scales sharply
        z = (projected_ratio - 0.92) * 5.5 + (recent_accel * 1.5) + ((utilization - month_progress) * 3.0)
        prob = float(1.0 / (1.0 + np.exp(-z)))
        prob = round(max(0.04, min(0.98, prob)), 2)

        if prob >= 0.75:
            overall_risk = "HIGH"
            msg = f"Critical risk: Your spending velocity projects ₹{round(projected_total):,} by month-end, exceeding your budget of ₹{round(total_budget_target):,}."
        elif prob >= 0.45:
            overall_risk = "MEDIUM"
            msg = f"Moderate risk: Pace is near the budget threshold. Maintaining daily spend under ₹{round((total_budget_target - curr_month_spent) / days_remaining):,} is advised."
        else:
            overall_risk = "LOW"
            msg = f"Healthy trajectory: Spending is well within budget limits."

        # Category-level overspending predictions
        category_risks = []
        for b in budgets:
            cat_name = b.get("category", "")
            cat_limit = float(b.get("limit", 0.0))
            if cat_limit <= 0:
                continue

            cat_curr = float(curr_df[curr_df["category"] == cat_name]["amount"].sum()) if not curr_df.empty else 0.0
            cat_prev = float(prev_df[prev_df["category"] == cat_name]["amount"].sum()) if not prev_df.empty else cat_curr
            cat_growth = (cat_curr - cat_prev) / max(1.0, cat_prev)

            cat_avg_daily = cat_curr / days_passed
            cat_projected = cat_curr + (cat_avg_daily * days_remaining)
            cat_util = cat_curr / cat_limit
            cat_proj_ratio = cat_projected / cat_limit

            cat_z = (cat_proj_ratio - 0.90) * 5.0 + (cat_growth * 0.8) + ((cat_util - month_progress) * 2.5)
            cat_prob = float(1.0 / (1.0 + np.exp(-cat_z)))
            cat_prob = round(max(0.05, min(0.98, cat_prob)), 2)

            if cat_prob >= 0.70:
                cat_risk = "HIGH"
                cat_msg = f"You have an {int(cat_prob * 100)}% probability of exceeding your {cat_name} budget this month."
            elif cat_prob >= 0.40:
                cat_risk = "MEDIUM"
                cat_msg = f"{cat_name} spending is accelerating. Approaching {int(cat_util * 100)}% of limit."
            else:
                cat_risk = "LOW"
                cat_msg = f"{cat_name} spending is well controlled."

            category_risks.append({
                "category": cat_name,
                "limit": cat_limit,
                "spent": round(cat_curr, 2),
                "projected": round(cat_projected, 2),
                "utilization": round(cat_util * 100, 1),
                "risk": cat_risk,
                "probability": cat_prob,
                "growthVsLastMonth": round(cat_growth * 100, 1),
                "alert": cat_msg
            })

        # Sort category risks by highest probability
        category_risks.sort(key=lambda x: x["probability"], reverse=True)

        return {
            "overall": {
                "risk": overall_risk,
                "probability": prob,
                "overspendingProbabilityPercent": int(prob * 100),
                "budgetUtilization": round(utilization * 100, 1),
                "currentSpending": round(curr_month_spent, 2),
                "projectedTotal": round(projected_total, 2),
                "budgetTarget": round(total_budget_target, 2),
                "daysRemaining": days_remaining,
                "message": msg
            },
            "categories": category_risks
        }
