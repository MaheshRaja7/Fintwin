from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uvicorn
import logging

from forecasting.xgboost_forecaster import ExpenseForecaster
from forecasting.overspending_classifier import OverspendingPredictor
from anomaly.isolation_forest import AnomalyDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FinTwinML")

app = FastAPI(
    title="FinTwin AI - ML Intelligence Engine",
    description="Dedicated machine learning service for XGBoost forecasting, overspending classification, and Isolation Forest anomaly detection.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ForecastRequest(BaseModel):
    transactions: List[Dict[str, Any]]
    horizonDays: Optional[int] = 30
    monthlyBudget: Optional[float] = 0.0
    monthlyIncome: Optional[float] = 0.0

class OverspendingRequest(BaseModel):
    transactions: List[Dict[str, Any]]
    budgets: Optional[List[Dict[str, Any]]] = []
    monthlyIncome: Optional[float] = 50000.0

class AnomalyRequest(BaseModel):
    transactions: List[Dict[str, Any]]
    contamination: Optional[float] = 0.05

class SimulationRequest(BaseModel):
    currentIncome: float
    currentExpenses: float
    monthlySavings: float
    plannedPurchase: Optional[float] = 0.0
    expenseReductionPercent: Optional[float] = 0.0 # e.g. 30% reduction in a category
    categoryToReduce: Optional[str] = None
    categorySpending: Optional[float] = 0.0
    incomeChange: Optional[float] = 0.0
    recurringExpenseChange: Optional[float] = 0.0
    targetGoalAmount: Optional[float] = 75000.0
    targetGoalCurrent: Optional[float] = 35000.0

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "FinTwin AI ML Engine",
        "algorithms": {
            "forecasting": "XGBoost Regressor + Holt-Winters Exponential Smoothing",
            "overspending": "XGBoost Classifier + Calibrated Sigmoid Risk Model",
            "anomaly": "Isolation Forest (Strictly isolated to outlier detection)"
        }
    }

@app.post("/predict/expenses")
def predict_expenses(req: ForecastRequest):
    try:
        forecaster = ExpenseForecaster()
        result = forecaster.train_and_forecast(
            transactions=req.transactions,
            horizon_days=req.horizonDays or 30,
            monthly_budget=req.monthlyBudget or 0.0,
            monthly_income=req.monthlyIncome or 0.0
        )
        return result
    except Exception as e:
        logger.error(f"Expense forecasting failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/overspending")
def predict_overspending(req: OverspendingRequest):
    try:
        predictor = OverspendingPredictor()
        result = predictor.predict_risk(
            transactions=req.transactions,
            budgets=req.budgets,
            monthly_income=req.monthlyIncome or 50000.0
        )
        return result
    except Exception as e:
        logger.error(f"Overspending prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect/anomaly")
def detect_anomaly(req: AnomalyRequest):
    try:
        detector = AnomalyDetector(contamination=req.contamination or 0.05)
        anomalies = detector.detect_anomalies(req.transactions)
        return {
            "status": "success",
            "anomalyCount": len(anomalies),
            "anomalies": anomalies
        }
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate")
def simulate(req: SimulationRequest):
    """
    Deterministic financial simulation engine:
    Calculates impact of planned purchase, expense reductions, or income boosts
    on monthly savings, runway, goal timelines, and financial health.
    """
    try:
        # Baseline
        base_income = req.currentIncome
        base_expense = req.currentExpenses
        base_savings = max(0.0, base_income - base_expense)

        # Apply adjustments
        adjusted_income = base_income + (req.incomeChange or 0.0)
        
        expense_delta = 0.0
        if req.expenseReductionPercent and req.categorySpending:
            # Saving by reducing category
            category_reduction = req.categorySpending * (req.expenseReductionPercent / 100.0)
            expense_delta -= category_reduction
        
        if req.recurringExpenseChange:
            expense_delta += req.recurringExpenseChange

        projected_expense = max(0.0, base_expense + expense_delta)
        projected_monthly_savings = max(0.0, adjusted_income - projected_expense)
        additional_monthly_savings = projected_monthly_savings - base_savings
        additional_annual_savings = additional_monthly_savings * 12.0

        # Purchase impact on goals
        remaining_goal = max(0.0, (req.targetGoalAmount or 0.0) - (req.targetGoalCurrent or 0.0))
        
        # Months to goal baseline
        months_baseline = round(remaining_goal / max(100.0, base_savings), 1) if remaining_goal > 0 else 0.0
        
        # With one-time purchase
        goal_current_after_purchase = max(0.0, (req.targetGoalCurrent or 0.0) - (req.plannedPurchase or 0.0))
        remaining_goal_after_purchase = max(0.0, (req.targetGoalAmount or 0.0) - goal_current_after_purchase)
        months_simulated = round(remaining_goal_after_purchase / max(100.0, projected_monthly_savings), 1) if remaining_goal_after_purchase > 0 else 0.0
        
        goal_delay_months = round(months_simulated - months_baseline, 1)

        # Financial health impact estimation (+/- points)
        savings_rate_base = (base_savings / max(1.0, base_income)) * 100.0
        savings_rate_sim = (projected_monthly_savings / max(1.0, adjusted_income)) * 100.0
        health_impact = round((savings_rate_sim - savings_rate_base) * 0.4, 1)

        return {
            "status": "success",
            "baseline": {
                "monthlyIncome": round(base_income, 2),
                "monthlyExpenses": round(base_expense, 2),
                "monthlySavings": round(base_savings, 2),
                "monthsToGoal": months_baseline
            },
            "projected": {
                "monthlyIncome": round(adjusted_income, 2),
                "monthlyExpenses": round(projected_expense, 2),
                "monthlySavings": round(projected_monthly_savings, 2),
                "monthsToGoal": months_simulated
            },
            "impact": {
                "additionalMonthlySavings": round(additional_monthly_savings, 2),
                "additionalAnnualSavings": round(additional_annual_savings, 2),
                "goalTimelineDeltaMonths": goal_delay_months,
                "goalImpactText": f"{abs(goal_delay_months)} months {'delay' if goal_delay_months > 0 else 'earlier'}" if goal_delay_months != 0 else "No timeline change",
                "healthScoreDelta": health_impact
            }
        }
    except Exception as e:
        logger.error(f"Financial simulation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
