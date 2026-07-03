from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models.enquiry import Enquiry, Survey
from app.models.order import Order
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    ProfileUpdate,
    RegisterRequest,
    TokenResponse,
    UserMeOut,
)
from app.schemas.enquiry import EnquiryOut, SurveyOut
from app.schemas.order import OrderOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        is_admin=False,
    )
    db.add(user)
    db.commit()
    return TokenResponse(access_token=create_access_token(user.email))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
        )
    return TokenResponse(access_token=create_access_token(user.email))


@router.get("/me", response_model=UserMeOut)
def me(current: User = Depends(get_current_user)) -> UserMeOut:
    return UserMeOut.model_validate(current)


@router.patch("/me", response_model=UserMeOut)
def update_me(
    payload: ProfileUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserMeOut:
    data = payload.model_dump(exclude_unset=True)
    new_email = data.get("email")
    if new_email and new_email != current.email:
        clash = db.query(User).filter(User.email == new_email, User.id != current.id).first()
        if clash is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use"
            )
    for field, value in data.items():
        setattr(current, field, value)
    db.commit()
    db.refresh(current)
    return UserMeOut.model_validate(current)


@router.get("/me/orders", response_model=list[OrderOut])
def my_orders(
    current: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Order]:
    return (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.user_id == current.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/me/enquiries", response_model=list[EnquiryOut])
def my_enquiries(
    current: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Enquiry]:
    return (
        db.query(Enquiry)
        .filter(Enquiry.user_id == current.id)
        .order_by(Enquiry.created_at.desc())
        .all()
    )


@router.get("/me/surveys", response_model=list[SurveyOut])
def my_surveys(
    current: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Survey]:
    return (
        db.query(Survey)
        .filter(Survey.user_id == current.id)
        .order_by(Survey.created_at.desc())
        .all()
    )
