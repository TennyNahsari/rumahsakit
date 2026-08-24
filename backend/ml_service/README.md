# ML Prediction Service

Machine Learning service for Hospital Information System predictions.

## Features
- Prophet-based time series forecasting
- Top 3 visit types prediction per day (7 days)
- Top 3 room types prediction per day (7 days)
- RESTful API with Flask

## Setup

### 1. Create Virtual Environment
```bash
cd backend/ml_service
python -m venv venv
```

### 2. Activate Virtual Environment
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Service
```bash
python app.py
```

Service will run on `http://localhost:5030`

## API Endpoints

### Health Check
```
GET /health
```

### Train Models
```
POST /train

Body:
{
  "visits": {
    "GENERAL_CHECKUP": [{"date": "2025-10-01", "count": 45}, ...],
    "INPATIENT": [...],
    "EMERGENCY": [...],
    "MEDICAL_ACTION": [...]
  },
  "rooms": {
    "VIP": [{"date": "2025-10-01", "count": 5}, ...],
    "KELAS_1": [...],
    ...
  }
}
```

### Get Predictions
```
POST /predict

Body (optional):
{
  "days": 7
}

Response:
{
  "visits": [
    {
      "date": "2026-03-11",
      "top3": [
        {"type": "GENERAL_CHECKUP", "value": 2.1},
        {"type": "INPATIENT", "value": 1.5},
        {"type": "MEDICAL_ACTION", "value": 1.2}
      ]
    },
    ...
  ],
  "rooms": [
    {
      "date": "2026-03-11",
      "top3": [
        {"type": "VIP", "value": 2.1},
        {"type": "KELAS_1", "value": 1.8},
        {"type": "ICU", "value": 1.3}
      ]
    },
    ...
  ],
  "generated_at": "2026-03-10T10:00:00"
}
```

## Models Storage
Trained models are stored in `backend/ml_models/`:
- `prophet_general_checkup.pkl`
- `prophet_outpatient.pkl`
- `prophet_inpatient.pkl`
- `prophet_emergency.pkl`
- `prophet_medical_action.pkl`
- `room_statistics.pkl`
