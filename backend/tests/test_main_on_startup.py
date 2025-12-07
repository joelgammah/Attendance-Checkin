from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models.base import Base
from app.models.user import User
import app.main as main

def test_on_startup_seeds_demo_users_idempotent():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    # Point main's engine to the test engine so startup uses the in-memory DB
    main.engine = engine

    # First run should insert demo users
    main.on_startup()
    with Session(bind=engine) as db:
        count_after_first = db.query(User).count()
    assert count_after_first == 7

    # Second run should be a no-op (idempotent)
    main.on_startup()
    with Session(bind=engine) as db:
        count_after_second = db.query(User).count()
    assert count_after_second == 7
# filepath: c:\Users\k8pod\SoftwareEngineeringF2025\Attendance-Checkin\backend\tests\test_main_on_startup.py
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.models.base import Base
from app.models.user import User
import app.main as main

def test_on_startup_seeds_demo_users_idempotent():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    # Point main's engine to the test engine so startup uses the in-memory DB
    main.engine = engine

    # First run should insert demo users
    main.on_startup()
    with Session(bind=engine) as db:
        count_after_first = db.query(User).count()
    assert count_after_first == 7

    # Second run should be a no-op (idempotent)
    main.on_startup()
    with Session(bind=engine) as db:
        count_after_second = db.query(User).count()
    assert count_after_second == 7