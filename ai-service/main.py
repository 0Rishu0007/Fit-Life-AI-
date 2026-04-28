"""
FitLife AI — Recommendation Engine (FastAPI Microservice)

Provides workout suggestions, calorie adjustments, and progress predictions
using rule-based logic and simple linear regression models.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import numpy as np
from collections import Counter, defaultdict

app = FastAPI(
    title="FitLife AI Recommendation Engine",
    description="ML-powered fitness recommendations",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Models ─────────────────────────────────────────

class Goals(BaseModel):
    dailyCalories: Optional[float] = 2000
    dailyProtein: Optional[float] = 150
    weeklyWorkouts: Optional[int] = 4
    targetWeight: Optional[float] = None


class Streak(BaseModel):
    current: Optional[int] = 0
    longest: Optional[int] = 0
    lastActivityDate: Optional[str] = None


class UserInfo(BaseModel):
    goals: Optional[Goals] = Goals()
    streak: Optional[Streak] = Streak()


class WorkoutEntry(BaseModel):
    exercise: str
    sets: int
    reps: int
    weight: float
    date: str


class DietEntry(BaseModel):
    meal: str
    calories: float
    protein: float
    carbs: float
    fats: float
    date: str


class RecommendationRequest(BaseModel):
    user: Optional[UserInfo] = UserInfo()
    workouts: Optional[List[WorkoutEntry]] = []
    diet: Optional[List[DietEntry]] = []


# ─── Helper Functions ─────────────────────────────────────────

def analyze_workout_patterns(workouts: List[WorkoutEntry]) -> dict:
    """Analyze workout frequency, volume, and muscle group distribution."""
    if not workouts:
        return {"frequency": 0, "exercises": {}, "total_volume": 0}

    exercise_counts = Counter(w.exercise for w in workouts)
    exercise_volumes = defaultdict(float)

    for w in workouts:
        volume = w.sets * w.reps * w.weight
        exercise_volumes[w.exercise] += volume

    # Calculate weekly frequency
    dates = set()
    for w in workouts:
        try:
            dt = datetime.fromisoformat(w.date.replace("Z", "+00:00"))
            dates.add(dt.date())
        except (ValueError, AttributeError):
            pass

    weeks = max(len(dates) / 7, 1)
    frequency = len(dates) / weeks

    return {
        "frequency": round(frequency, 1),
        "exercises": dict(exercise_counts),
        "volumes": dict(exercise_volumes),
        "total_volume": sum(exercise_volumes.values()),
        "unique_days": len(dates),
    }


def analyze_diet_patterns(diet: List[DietEntry]) -> dict:
    """Analyze daily calorie and macro averages."""
    if not diet:
        return {
            "avg_calories": 0,
            "avg_protein": 0,
            "avg_carbs": 0,
            "avg_fats": 0,
        }

    # Group by date
    daily = defaultdict(lambda: {"calories": 0, "protein": 0, "carbs": 0, "fats": 0})
    for d in diet:
        try:
            dt = datetime.fromisoformat(d.date.replace("Z", "+00:00"))
            key = dt.date().isoformat()
        except (ValueError, AttributeError):
            key = "unknown"
        daily[key]["calories"] += d.calories
        daily[key]["protein"] += d.protein
        daily[key]["carbs"] += d.carbs
        daily[key]["fats"] += d.fats

    num_days = max(len(daily), 1)
    return {
        "avg_calories": round(sum(d["calories"] for d in daily.values()) / num_days),
        "avg_protein": round(sum(d["protein"] for d in daily.values()) / num_days),
        "avg_carbs": round(sum(d["carbs"] for d in daily.values()) / num_days),
        "avg_fats": round(sum(d["fats"] for d in daily.values()) / num_days),
        "days_tracked": num_days,
    }


def predict_progress(workouts: List[WorkoutEntry]) -> dict:
    """Simple linear regression on workout volume to predict future progress."""
    if len(workouts) < 3:
        return {
            "trend": "insufficient_data",
            "message": "Log at least 3 workouts to see progress predictions.",
            "predicted_volume_change": 0,
        }

    # Group volume by date
    daily_volume = defaultdict(float)
    for w in workouts:
        try:
            dt = datetime.fromisoformat(w.date.replace("Z", "+00:00"))
            day_num = (dt.date() - datetime.now().date()).days
            daily_volume[day_num] += w.sets * w.reps * w.weight
        except (ValueError, AttributeError):
            pass

    if len(daily_volume) < 2:
        return {
            "trend": "insufficient_data",
            "message": "Need data from at least 2 different days.",
            "predicted_volume_change": 0,
        }

    # Simple linear regression
    x = np.array(list(daily_volume.keys())).reshape(-1, 1)
    y = np.array(list(daily_volume.values()))

    # Calculate slope manually (simple linear regression)
    x_mean = np.mean(x)
    y_mean = np.mean(y)
    numerator = np.sum((x.flatten() - x_mean) * (y - y_mean))
    denominator = np.sum((x.flatten() - x_mean) ** 2)

    if denominator == 0:
        slope = 0
    else:
        slope = numerator / denominator

    # Determine trend
    if slope > 50:
        trend = "strong_improvement"
        message = "🚀 Excellent! Your workout volume is increasing significantly."
    elif slope > 0:
        trend = "slight_improvement"
        message = "📈 Good progress! Your training volume is gradually increasing."
    elif slope > -50:
        trend = "plateau"
        message = "⚡ You're maintaining consistent volume. Consider progressive overload."
    else:
        trend = "declining"
        message = "📉 Volume is decreasing. Consider reviewing your recovery and nutrition."

    return {
        "trend": trend,
        "message": message,
        "predicted_volume_change": round(float(slope * 7), 1),  # Weekly projection
        "weekly_volume_trend": round(float(slope), 1),
    }


def generate_workout_suggestions(workout_analysis: dict, goals: Goals) -> List[dict]:
    """Rule-based workout recommendations."""
    suggestions = []

    frequency = workout_analysis.get("frequency", 0)
    exercises = workout_analysis.get("exercises", {})
    target_frequency = goals.weeklyWorkouts or 4

    # Frequency recommendations
    if frequency < target_frequency:
        deficit = target_frequency - frequency
        suggestions.append({
            "type": "frequency",
            "priority": "high",
            "title": "Increase Workout Frequency",
            "message": f"You're averaging {frequency} workouts/week but your goal is {target_frequency}. "
                       f"Try to add {round(deficit)} more sessions per week.",
            "icon": "📅",
        })
    elif frequency >= target_frequency:
        suggestions.append({
            "type": "frequency",
            "priority": "low",
            "title": "Great Consistency!",
            "message": f"You're hitting {frequency} workouts/week — meeting your goal of {target_frequency}!",
            "icon": "✅",
        })

    # Muscle group balance recommendations
    push_exercises = {"Bench Press", "Overhead Press", "Tricep Dips"}
    pull_exercises = {"Barbell Row", "Pull-ups", "Dumbbell Curl"}
    leg_exercises = {"Squat", "Deadlift", "Lunges", "Leg Press"}

    push_count = sum(exercises.get(e, 0) for e in push_exercises)
    pull_count = sum(exercises.get(e, 0) for e in pull_exercises)
    leg_count = sum(exercises.get(e, 0) for e in leg_exercises)

    total = push_count + pull_count + leg_count
    if total > 0:
        if leg_count < push_count * 0.5:
            suggestions.append({
                "type": "balance",
                "priority": "medium",
                "title": "Don't Skip Leg Day!",
                "message": "Your leg training volume is low compared to upper body. "
                           "Add squats, lunges, or leg press to balance your physique.",
                "icon": "🦵",
            })
        if pull_count < push_count * 0.7:
            suggestions.append({
                "type": "balance",
                "priority": "medium",
                "title": "Add More Pull Exercises",
                "message": "Your pull-to-push ratio is low. Add rows and pull-ups "
                           "to prevent muscle imbalances and shoulder injuries.",
                "icon": "💪",
            })

    # If no workouts at all
    if not exercises:
        suggestions.append({
            "type": "starter",
            "priority": "high",
            "title": "Start Your Fitness Journey!",
            "message": "Log your first workout to get personalized recommendations. "
                       "Start with compound exercises like squats, bench press, and rows.",
            "icon": "🏋️",
        })

    # Progressive overload suggestion
    if workout_analysis.get("total_volume", 0) > 0:
        suggestions.append({
            "type": "progression",
            "priority": "medium",
            "title": "Progressive Overload Tip",
            "message": "Try to increase weight by 2.5-5% every 1-2 weeks, "
                       "or add an extra rep to each set for continued gains.",
            "icon": "📊",
        })

    return suggestions


def generate_calorie_adjustments(diet_analysis: dict, goals: Goals) -> dict:
    """Rule-based calorie and macro adjustments."""
    target_cal = goals.dailyCalories or 2000
    target_protein = goals.dailyProtein or 150
    avg_cal = diet_analysis.get("avg_calories", 0)
    avg_protein = diet_analysis.get("avg_protein", 0)

    adjustments = {
        "calorie_status": "on_track",
        "protein_status": "on_track",
        "recommendations": [],
    }

    if avg_cal == 0:
        adjustments["calorie_status"] = "no_data"
        adjustments["recommendations"].append({
            "type": "tracking",
            "priority": "high",
            "title": "Start Logging Meals",
            "message": "Log your meals to get personalized nutrition recommendations.",
            "icon": "🍽️",
        })
        return adjustments

    # Calorie assessment
    cal_diff = avg_cal - target_cal
    cal_pct = abs(cal_diff) / target_cal * 100

    if cal_diff > 200:
        adjustments["calorie_status"] = "over"
        adjustments["recommendations"].append({
            "type": "calories",
            "priority": "high",
            "title": "Calorie Surplus Detected",
            "message": f"You're averaging {avg_cal} cal/day — {round(cal_diff)} over your "
                       f"{target_cal} target. Consider reducing portion sizes or swapping "
                       f"high-calorie snacks for vegetables and lean protein.",
            "icon": "⚠️",
        })
    elif cal_diff < -300:
        adjustments["calorie_status"] = "under"
        adjustments["recommendations"].append({
            "type": "calories",
            "priority": "high",
            "title": "Insufficient Calorie Intake",
            "message": f"You're averaging {avg_cal} cal/day — {round(abs(cal_diff))} below your "
                       f"{target_cal} target. Undereating can harm muscle recovery and energy levels. "
                       f"Add nutrient-dense meals like oats, nuts, and lean meats.",
            "icon": "🔻",
        })
    else:
        adjustments["recommendations"].append({
            "type": "calories",
            "priority": "low",
            "title": "Calories On Track",
            "message": f"Great job! Averaging {avg_cal} cal/day with a target of {target_cal}.",
            "icon": "✅",
        })

    # Protein assessment
    protein_diff = avg_protein - target_protein
    if protein_diff < -20:
        adjustments["protein_status"] = "low"
        adjustments["recommendations"].append({
            "type": "protein",
            "priority": "high",
            "title": "Increase Protein Intake",
            "message": f"Averaging {avg_protein}g protein/day vs {target_protein}g target. "
                       f"Add chicken, fish, eggs, or protein shakes to boost recovery.",
            "icon": "🥩",
        })
    elif protein_diff > 30:
        adjustments["protein_status"] = "high"
        adjustments["recommendations"].append({
            "type": "protein",
            "priority": "low",
            "title": "Protein Intake is High",
            "message": f"Averaging {avg_protein}g protein/day — exceeds your {target_protein}g target. "
                       f"This is fine for muscle building, but ensure you're hydrating well.",
            "icon": "💧",
        })

    # Macro balance check
    avg_carbs = diet_analysis.get("avg_carbs", 0)
    avg_fats = diet_analysis.get("avg_fats", 0)
    total_macros = avg_protein + avg_carbs + avg_fats
    if total_macros > 0:
        fat_pct = (avg_fats * 9) / max(avg_cal, 1) * 100
        if fat_pct > 40:
            adjustments["recommendations"].append({
                "type": "macros",
                "priority": "medium",
                "title": "High Fat Ratio",
                "message": f"Fats make up ~{round(fat_pct)}% of your calories. "
                           f"Consider replacing some fats with complex carbs for energy.",
                "icon": "🥑",
            })

    return adjustments


def calculate_analytics_score(
    workout_analysis: dict, diet_analysis: dict, goals: Goals, streak: Streak
) -> dict:
    """Calculate an overall fitness analytics score (0-100)."""
    score = 50  # Base score

    # Workout consistency (0-25 points)
    target_freq = goals.weeklyWorkouts or 4
    actual_freq = workout_analysis.get("frequency", 0)
    freq_ratio = min(actual_freq / max(target_freq, 1), 1.5)
    score += round(freq_ratio * 15)

    # Diet adherence (0-25 points)
    target_cal = goals.dailyCalories or 2000
    avg_cal = diet_analysis.get("avg_calories", 0)
    if avg_cal > 0:
        cal_accuracy = 1 - abs(avg_cal - target_cal) / max(target_cal, 1)
        score += round(max(cal_accuracy, 0) * 15)

    # Streak bonus (0-15 points)
    streak_current = streak.current or 0
    score += min(streak_current * 2, 15)

    # Protein bonus (0-10 points)
    target_protein = goals.dailyProtein or 150
    avg_protein = diet_analysis.get("avg_protein", 0)
    if avg_protein > 0:
        protein_ratio = min(avg_protein / max(target_protein, 1), 1.2)
        score += round(protein_ratio * 5)

    return {
        "score": min(max(score, 0), 100),
        "grade": (
            "A+" if score >= 90
            else "A" if score >= 80
            else "B+" if score >= 70
            else "B" if score >= 60
            else "C" if score >= 50
            else "D" if score >= 40
            else "F"
        ),
        "breakdown": {
            "consistency": round(freq_ratio * 15) if target_freq else 0,
            "nutrition": round(max(1 - abs(avg_cal - target_cal) / max(target_cal, 1), 0) * 15) if avg_cal > 0 else 0,
            "streak": min(streak_current * 2, 15),
            "protein": round(min(avg_protein / max(target_protein, 1), 1.2) * 5) if avg_protein > 0 else 0,
        },
    }


# ─── API Endpoints ────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "FitLife AI Recommendation Engine",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/recommend")
async def recommend(request: RecommendationRequest):
    """
    Main recommendation endpoint.
    Accepts user workout + diet data and returns personalized recommendations.
    """
    try:
        # Analyze patterns
        workout_analysis = analyze_workout_patterns(request.workouts)
        diet_analysis = analyze_diet_patterns(request.diet)

        # Generate recommendations
        workout_suggestions = generate_workout_suggestions(
            workout_analysis, request.user.goals
        )
        calorie_adjustments = generate_calorie_adjustments(
            diet_analysis, request.user.goals
        )
        progress = predict_progress(request.workouts)

        # Calculate analytics score
        analytics = calculate_analytics_score(
            workout_analysis,
            diet_analysis,
            request.user.goals,
            request.user.streak,
        )

        return {
            "success": True,
            "workout_suggestions": workout_suggestions,
            "calorie_adjustments": calorie_adjustments,
            "progress_prediction": progress,
            "analytics": analytics,
            "summary": {
                "workout_frequency": workout_analysis["frequency"],
                "avg_daily_calories": diet_analysis["avg_calories"],
                "avg_daily_protein": diet_analysis["avg_protein"],
                "overall_score": analytics["score"],
                "grade": analytics["grade"],
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
