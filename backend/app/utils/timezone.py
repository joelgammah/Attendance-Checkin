from datetime import datetime
import pytz

# EST timezone constant
EST = pytz.timezone('America/New_York')

def now_est() -> datetime:
    """Get current time in EST"""
    return datetime.now(EST)

def to_est(dt: datetime) -> datetime:
    """Convert any datetime to EST"""
    return dt.astimezone(EST)

def naive_to_est(dt: datetime) -> datetime:
    """Convert naive datetime (assume EST) to timezone-aware EST"""
    if dt.tzinfo is None:
        return EST.localize(dt)
    return dt.astimezone(EST)