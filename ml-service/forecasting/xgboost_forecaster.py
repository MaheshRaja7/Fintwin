import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
import logging

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False

from sklearn.metrics import mean_absolute_error, root_mean_squared_error

logger = logging.getLogger("Forecaster")

def calculate_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    mask = y_true > 0
    if np.sum(mask) == 0:
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0)

def engineer_features(daily_df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineers temporal and lag features for time-series forecasting.
    Features:
    - day_of_month, day_of_week, week_of_month, month
    - previous_1_day, previous_7_day, previous_14_day, previous_30_day
    - rolling_7_day_mean, rolling_14_day_mean, rolling_30_day_mean
    - salary_day_distance, weekend_flag
    """
    df = daily_df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    df["day_of_month"] = df["date"].dt.day
    df["day_of_week"] = df["date"].dt.dayofweek
    df["week_of_month"] = (df["day_of_month"] - 1) // 7 + 1
    df["month"] = df["date"].dt.month
    df["weekend_flag"] = (df["day_of_week"] >= 5).astype(int)

    # Salary day distance (assuming typical salary around day 1 or end of month)
    df["salary_day_distance"] = df["day_of_month"].apply(lambda d: min(abs(d - 1), abs(d - 30), abs(d - 31)))

    # Lag features
    df["lag_1"] = df["amount"].shift(1)
    df["lag_7"] = df["amount"].shift(7)
    df["lag_14"] = df["amount"].shift(14)
    df["lag_30"] = df["amount"].shift(30)

    # Rolling statistics
    df["rolling_7_mean"] = df["amount"].shift(1).rolling(window=7, min_periods=1).mean()
    df["rolling_14_mean"] = df["amount"].shift(1).rolling(window=14, min_periods=1).mean()
    df["rolling_30_mean"] = df["amount"].shift(1).rolling(window=30, min_periods=1).mean()

    # Backfill early rows where lags are NaN
    df["lag_1"] = df["lag_1"].fillna(df["amount"].mean())
    df["lag_7"] = df["lag_7"].fillna(df["amount"].mean())
    df["lag_14"] = df["lag_14"].fillna(df["amount"].mean())
    df["lag_30"] = df["lag_30"].fillna(df["amount"].mean())
    df["rolling_7_mean"] = df["rolling_7_mean"].fillna(df["amount"].mean())
    df["rolling_14_mean"] = df["rolling_14_mean"].fillna(df["amount"].mean())
    df["rolling_30_mean"] = df["rolling_30_mean"].fillna(df["amount"].mean())

    return df

FEATURE_COLS = [
    "day_of_month", "day_of_week", "week_of_month", "month",
    "weekend_flag", "salary_day_distance",
    "lag_1", "lag_7", "lag_14", "lag_30",
    "rolling_7_mean", "rolling_14_mean", "rolling_30_mean"
]

class ExpenseForecaster:
    def __init__(self):
        self.best_model_name = "None"
        self.metrics = {"mae": 0.0, "rmse": 0.0, "mape": 0.0}

    def train_and_forecast(
        self,
        transactions: List[Dict[str, Any]],
        horizon_days: int = 30,
        monthly_budget: float = 0.0,
        monthly_income: float = 0.0
    ) -> Dict[str, Any]:
        """
        Takes raw transactions, aggregates daily expenses, trains both XGBoost and Holt-Winters,
        evaluates metrics, selects best model, and outputs daily predictions with confidence intervals.
        """
        # Filter expense transactions
        expense_txs = [t for t in transactions if t.get("type") == "expense"]
        if not expense_txs:
            # Fallback for empty transactions
            return self._empty_forecast(horizon_days, monthly_budget)

        df = pd.DataFrame(expense_txs)
        df["date"] = pd.to_datetime(df["date"], utc=True).dt.date
        df["amount"] = df["amount"].astype(float)

        # Aggregate daily total
        daily = df.groupby("date")["amount"].sum().reset_index()
        daily = daily.sort_values("date")

        # Fill missing calendar dates with 0
        all_dates = pd.date_range(start=daily["date"].min(), end=daily["date"].max(), freq="D").date
        full_daily = pd.DataFrame({"date": all_dates})
        full_daily = full_daily.merge(daily, on="date", how="left").fillna({"amount": 0.0})

        n_days = len(full_daily)

        # Cold start handling: if fewer than 14 days of data, use statistical baseline
        if n_days < 14:
            return self._cold_start_forecast(full_daily, horizon_days, monthly_budget, monthly_income, n_days)

        # Engineer features
        feat_df = engineer_features(full_daily)

        # Train/validation split: last 20% for testing
        test_size = max(5, int(n_days * 0.2))
        train_df = feat_df.iloc[:-test_size]
        val_df = feat_df.iloc[-test_size:]

        y_true = val_df["amount"].values

        # 1. XGBoost Model
        xgb_preds = None
        xgb_metrics = {"mae": float("inf"), "rmse": float("inf"), "mape": float("inf")}
        xgb_model = None

        if XGB_AVAILABLE:
            try:
                X_train = train_df[FEATURE_COLS]
                y_train = train_df["amount"]
                X_val = val_df[FEATURE_COLS]

                xgb_model = xgb.XGBRegressor(
                    n_estimators=75,
                    max_depth=4,
                    learning_rate=0.08,
                    subsample=0.85,
                    colsample_bytree=0.85,
                    random_state=42
                )
                xgb_model.fit(X_train, y_train)
                xgb_val_pred = np.maximum(0, xgb_model.predict(X_val))
                xgb_mae = float(mean_absolute_error(y_true, xgb_val_pred))
                xgb_rmse = float(root_mean_squared_error(y_true, xgb_val_pred))
                xgb_mape = float(calculate_mape(y_true, xgb_val_pred))
                xgb_metrics = {"mae": xgb_mae, "rmse": xgb_rmse, "mape": xgb_mape}
            except Exception as e:
                logger.warning(f"XGBoost training error: {e}")

        # 2. Holt-Winters / Exponential Smoothing Model
        hw_metrics = {"mae": float("inf"), "rmse": float("inf"), "mape": float("inf")}
        hw_model = None

        if STATSMODELS_AVAILABLE:
            try:
                hw_series = train_df["amount"].values + 1e-4  # prevent zeros in multiplicative if needed
                seasonal_periods = 7 if len(hw_series) >= 14 else None
                hw_model = ExponentialSmoothing(
                    hw_series,
                    trend="add",
                    seasonal="add" if seasonal_periods else None,
                    seasonal_periods=seasonal_periods
                ).fit()
                hw_val_pred = np.maximum(0, hw_model.forecast(test_size))
                hw_mae = float(mean_absolute_error(y_true, hw_val_pred))
                hw_rmse = float(root_mean_squared_error(y_true, hw_val_pred))
                hw_mape = float(calculate_mape(y_true, hw_val_pred))
                hw_metrics = {"mae": hw_mae, "rmse": hw_rmse, "mape": hw_mape}
            except Exception as e:
                logger.warning(f"Holt-Winters error: {e}")

        # Automatic model selection based on lowest MAE
        if xgb_metrics["mae"] <= hw_metrics["mae"] and xgb_model is not None:
            self.best_model_name = "XGBoost Regressor (Engineered Temporal Features)"
            self.metrics = xgb_metrics
            selected_model = "xgboost"
        elif hw_model is not None and hw_metrics["mae"] < float("inf"):
            self.best_model_name = "Holt-Winters Exponential Smoothing"
            self.metrics = hw_metrics
            selected_model = "holt_winters"
        else:
            self.best_model_name = "Moving Average Baseline"
            self.metrics = {"mae": float(val_df["amount"].std()), "rmse": float(val_df["amount"].std()), "mape": 15.0}
            selected_model = "baseline"

        # Fit on full dataset for future forecast
        last_date = full_daily["date"].max()
        future_dates = [last_date + timedelta(days=i) for i in range(1, horizon_days + 1)]
        future_df = pd.DataFrame({"date": future_dates, "amount": 0.0})

        # Iterative or direct future generation
        combined_df = pd.concat([full_daily, future_df], ignore_index=True)
        predictions = []
        std_resid = self.metrics["rmse"] if self.metrics["rmse"] > 0 else (full_daily["amount"].std() or 50.0)

        if selected_model == "xgboost" and xgb_model is not None:
            # Retrain on full dataset
            full_feat = engineer_features(full_daily)
            xgb_model.fit(full_feat[FEATURE_COLS], full_feat["amount"])
            
            # Autoregressive forward simulation
            sim_df = full_feat.copy()
            for idx, f_date in enumerate(future_dates):
                row_dict = {
                    "date": pd.to_datetime(f_date),
                    "day_of_month": f_date.day,
                    "day_of_week": f_date.weekday(),
                    "week_of_month": (f_date.day - 1) // 7 + 1,
                    "month": f_date.month,
                    "weekend_flag": 1 if f_date.weekday() >= 5 else 0,
                    "salary_day_distance": min(abs(f_date.day - 1), abs(f_date.day - 30), abs(f_date.day - 31)),
                    "lag_1": float(sim_df["amount"].iloc[-1]),
                    "lag_7": float(sim_df["amount"].iloc[-7] if len(sim_df) >= 7 else sim_df["amount"].mean()),
                    "lag_14": float(sim_df["amount"].iloc[-14] if len(sim_df) >= 14 else sim_df["amount"].mean()),
                    "lag_30": float(sim_df["amount"].iloc[-30] if len(sim_df) >= 30 else sim_df["amount"].mean()),
                    "rolling_7_mean": float(sim_df["amount"].iloc[-7:].mean()),
                    "rolling_14_mean": float(sim_df["amount"].iloc[-14:].mean()),
                    "rolling_30_mean": float(sim_df["amount"].iloc[-30:].mean()),
                }
                feat_vec = pd.DataFrame([row_dict])[FEATURE_COLS]
                pred_val = float(max(0, xgb_model.predict(feat_vec)[0]))
                row_dict["amount"] = pred_val
                sim_df = pd.concat([sim_df, pd.DataFrame([row_dict])], ignore_index=True)
                predictions.append(pred_val)
        elif selected_model == "holt_winters" and STATSMODELS_AVAILABLE:
            full_hw = ExponentialSmoothing(
                full_daily["amount"].values + 1e-4,
                trend="add",
                seasonal="add" if len(full_daily) >= 14 else None,
                seasonal_periods=7 if len(full_daily) >= 14 else None
            ).fit()
            predictions = list(np.maximum(0, full_hw.forecast(horizon_days)))
        else:
            avg_recent = float(full_daily["amount"].iloc[-14:].mean() or 500.0)
            predictions = [avg_recent for _ in range(horizon_days)]

        # Construct response with confidence intervals
        forecast_items = []
        cum_predicted = 0.0
        for i, (f_date, pred) in enumerate(zip(future_dates, predictions)):
            cum_predicted += pred
            # 85% confidence interval: +/- 1.44 * std_resid (growing slightly with horizon)
            uncertainty_growth = 1.0 + (i * 0.02)
            margin = 1.44 * std_resid * uncertainty_growth
            lower = max(0.0, pred - margin)
            upper = pred + margin
            forecast_items.append({
                "date": str(f_date),
                "predicted": round(pred, 2),
                "lowerBound": round(lower, 2),
                "upperBound": round(upper, 2),
                "cumulative": round(cum_predicted, 2)
            })

        # Calculate month-end projection
        now = datetime.now()
        current_month_spent = float(df[pd.to_datetime(df["date"]).apply(lambda d: d.month == now.month and d.year == now.year)]["amount"].sum())
        today_spent = float(full_daily[full_daily["date"] == now.date()]["amount"].sum()) if len(full_daily[full_daily["date"] == now.date()]) > 0 else 0.0
        avg_daily = float(full_daily["amount"].iloc[-30:].mean()) if len(full_daily) >= 30 else float(full_daily["amount"].mean())
        projected_daily = float(np.mean(predictions[:7])) if predictions else avg_daily

        # Days remaining in current month
        next_month = now.replace(day=28) + timedelta(days=4)
        last_day_of_month = (next_month - timedelta(days=next_month.day)).day
        days_remaining = max(0, last_day_of_month - now.day)
        predicted_month_end = current_month_spent + (projected_daily * days_remaining)

        # Confidence calculation based on data size and MAPE
        confidence = max(60, min(95, int(100 - (self.metrics["mape"] * 0.8) + min(15, n_days // 6))))

        return {
            "status": "success",
            "modelName": self.best_model_name,
            "metrics": {
                "mae": round(self.metrics["mae"], 2),
                "rmse": round(self.metrics["rmse"], 2),
                "mape": round(self.metrics["mape"], 2)
            },
            "dataPointsUsed": n_days,
            "dataStatus": f"Trained on {n_days} days of historical records",
            "confidence": confidence,
            "todaySpending": round(today_spent, 2),
            "averageDailySpending": round(avg_daily, 2),
            "projectedDailySpending": round(projected_daily, 2),
            "currentMonthSpent": round(current_month_spent, 2),
            "predictedMonthEndExpense": round(predicted_month_end, 2),
            "predictedRange": {
                "likelyLower": round(max(0, predicted_month_end * 0.94), 2),
                "likelyUpper": round(predicted_month_end * 1.08, 2)
            },
            "horizonDays": horizon_days,
            "forecast": forecast_items
        }

    def _cold_start_forecast(self, daily: pd.DataFrame, horizon_days: int, monthly_budget: float, monthly_income: float, n_days: int) -> Dict[str, Any]:
        """Statistical fallback for accounts with less than 14 days of history."""
        sample_avg = float(daily["amount"].mean()) if not daily.empty else (monthly_budget / 30.0 if monthly_budget > 0 else 500.0)
        daily_projection = sample_avg if sample_avg > 0 else 500.0
        
        last_date = daily["date"].max() if not daily.empty else datetime.now().date()
        future_dates = [last_date + timedelta(days=i) for i in range(1, horizon_days + 1)]
        
        forecast_items = []
        cum = 0.0
        for i, f_date in enumerate(future_dates):
            cum += daily_projection
            forecast_items.append({
                "date": str(f_date),
                "predicted": round(daily_projection, 2),
                "lowerBound": round(max(0, daily_projection * 0.8), 2),
                "upperBound": round(daily_projection * 1.25, 2),
                "cumulative": round(cum, 2)
            })

        now = datetime.now()
        next_month = now.replace(day=28) + timedelta(days=4)
        last_day_of_month = (next_month - timedelta(days=next_month.day)).day
        days_remaining = max(0, last_day_of_month - now.day)
        
        spent_so_far = float(daily["amount"].sum())
        month_end = spent_so_far + (daily_projection * days_remaining)

        return {
            "status": "cold_start",
            "modelName": "Cold Start Statistical Baseline (Moving Average + Budget Ratio)",
            "metrics": {"mae": 0.0, "rmse": 0.0, "mape": 0.0},
            "dataPointsUsed": n_days,
            "dataStatus": f"Cold start: based on {n_days} days of history + budget profile",
            "confidence": 68,
            "todaySpending": round(daily["amount"].iloc[-1], 2) if not daily.empty else 0.0,
            "averageDailySpending": round(daily_projection, 2),
            "projectedDailySpending": round(daily_projection, 2),
            "currentMonthSpent": round(spent_so_far, 2),
            "predictedMonthEndExpense": round(month_end, 2),
            "predictedRange": {
                "likelyLower": round(month_end * 0.90, 2),
                "likelyUpper": round(month_end * 1.15, 2)
            },
            "horizonDays": horizon_days,
            "forecast": forecast_items
        }

    def _empty_forecast(self, horizon_days: int, monthly_budget: float) -> Dict[str, Any]:
        daily_est = monthly_budget / 30.0 if monthly_budget > 0 else 400.0
        now = datetime.now().date()
        future_dates = [now + timedelta(days=i) for i in range(1, horizon_days + 1)]
        return {
            "status": "empty",
            "modelName": "Zero-Data Heuristic",
            "metrics": {"mae": 0.0, "rmse": 0.0, "mape": 0.0},
            "dataPointsUsed": 0,
            "dataStatus": "No historical transactions found; using baseline budget estimation",
            "confidence": 50,
            "todaySpending": 0.0,
            "averageDailySpending": round(daily_est, 2),
            "projectedDailySpending": round(daily_est, 2),
            "currentMonthSpent": 0.0,
            "predictedMonthEndExpense": round(monthly_budget, 2),
            "predictedRange": {"likelyLower": round(monthly_budget * 0.85, 2), "likelyUpper": round(monthly_budget * 1.15, 2)},
            "horizonDays": horizon_days,
            "forecast": [{"date": str(d), "predicted": round(daily_est, 2), "lowerBound": round(daily_est * 0.8, 2), "upperBound": round(daily_est * 1.2, 2), "cumulative": round(daily_est * (i + 1), 2)} for i, d in enumerate(future_dates)]
        }
