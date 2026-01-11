from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "neobarber-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    barbershop_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Service Models
class ServiceBase(BaseModel):
    name: str
    price: float
    duration: str
    description: Optional[str] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: str
    barbershop_id: str
    
    class Config:
        from_attributes = True

# Client Models
class ClientBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientResponse(ClientBase):
    id: str
    barbershop_id: str
    visits: int = 0
    total_spent: float = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

# Appointment Models
class AppointmentBase(BaseModel):
    client_id: str
    client_name: str
    service_id: str
    service_name: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    price: float
    barber_name: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentResponse(AppointmentBase):
    id: str
    barbershop_id: str
    status: str  # confirmed, completed, cancelled
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Task Models
class TaskBase(BaseModel):
    title: str
    priority: str = "normal"  # low, normal, high

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str
    barbershop_id: str
    done: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== HELPER FUNCTIONS ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["created_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    
    # Create default services
    default_services = [
        {"name": "Cyber Fade", "price": 65, "duration": "45min", "barbershop_id": str(result.inserted_id), "description": "Corte moderno com degradê"},
        {"name": "Barba Viking", "price": 45, "duration": "30min", "barbershop_id": str(result.inserted_id), "description": "Barba completa estilo viking"},
        {"name": "Corte + Barba", "price": 100, "duration": "1h 15min", "barbershop_id": str(result.inserted_id), "description": "Combo completo"},
    ]
    await db.services.insert_many(default_services)
    
    # Generate token
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    
    user = await db.users.find_one({"_id": result.inserted_id})
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        barbershop_name=user.get("barbershop_name"),
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        barbershop_name=user.get("barbershop_name"),
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        name=current_user["name"],
        barbershop_name=current_user.get("barbershop_name"),
        created_at=current_user["created_at"]
    )

# ==================== SERVICES ROUTES ====================

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services(current_user = Depends(get_current_user)):
    services = await db.services.find({"barbershop_id": str(current_user["_id"])}).to_list(100)
    return [ServiceResponse(id=str(s["_id"]), **{k: v for k, v in s.items() if k != "_id"}) for s in services]

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service_data: ServiceCreate, current_user = Depends(get_current_user)):
    service_dict = service_data.model_dump()
    service_dict["barbershop_id"] = str(current_user["_id"])
    
    result = await db.services.insert_one(service_dict)
    service = await db.services.find_one({"_id": result.inserted_id})
    
    return ServiceResponse(id=str(service["_id"]), **{k: v for k, v in service.items() if k != "_id"})

# ==================== CLIENTS ROUTES ====================

@api_router.get("/clients", response_model=List[ClientResponse])
async def get_clients(current_user = Depends(get_current_user)):
    clients = await db.clients.find({"barbershop_id": str(current_user["_id"])}).to_list(1000)
    return [ClientResponse(id=str(c["_id"]), **{k: v for k, v in c.items() if k != "_id"}) for c in clients]

@api_router.post("/clients", response_model=ClientResponse)
async def create_client(client_data: ClientCreate, current_user = Depends(get_current_user)):
    client_dict = client_data.model_dump()
    client_dict["barbershop_id"] = str(current_user["_id"])
    client_dict["visits"] = 0
    client_dict["total_spent"] = 0
    client_dict["created_at"] = datetime.utcnow()
    
    result = await db.clients.insert_one(client_dict)
    client = await db.clients.find_one({"_id": result.inserted_id})
    
    return ClientResponse(id=str(client["_id"]), **{k: v for k, v in client.items() if k != "_id"})

@api_router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(client_id: str, current_user = Depends(get_current_user)):
    client = await db.clients.find_one({"_id": ObjectId(client_id), "barbershop_id": str(current_user["_id"])})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return ClientResponse(id=str(client["_id"]), **{k: v for k, v in client.items() if k != "_id"})

# ==================== APPOINTMENTS ROUTES ====================

@api_router.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(
    status: Optional[str] = None,
    date: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    query = {"barbershop_id": str(current_user["_id"])}
    if status:
        query["status"] = status
    if date:
        query["date"] = date
    
    appointments = await db.appointments.find(query).sort("time", 1).to_list(1000)
    return [AppointmentResponse(id=str(a["_id"]), **{k: v for k, v in a.items() if k != "_id"}) for a in appointments]

@api_router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(appointment_data: AppointmentCreate, current_user = Depends(get_current_user)):
    appointment_dict = appointment_data.model_dump()
    appointment_dict["barbershop_id"] = str(current_user["_id"])
    appointment_dict["status"] = "confirmed"
    appointment_dict["created_at"] = datetime.utcnow()
    appointment_dict["completed_at"] = None
    
    result = await db.appointments.insert_one(appointment_dict)
    appointment = await db.appointments.find_one({"_id": result.inserted_id})
    
    return AppointmentResponse(id=str(appointment["_id"]), **{k: v for k, v in appointment.items() if k != "_id"})

@api_router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    appointment_data: AppointmentCreate,
    current_user = Depends(get_current_user)
):
    appointment = await db.appointments.find_one({
        "_id": ObjectId(appointment_id),
        "barbershop_id": str(current_user["_id"])
    })
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = appointment_data.model_dump()
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": update_data}
    )
    
    updated = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    return AppointmentResponse(id=str(updated["_id"]), **{k: v for k, v in updated.items() if k != "_id"})

@api_router.put("/appointments/{appointment_id}/complete")
async def complete_appointment(appointment_id: str, current_user = Depends(get_current_user)):
    appointment = await db.appointments.find_one({
        "_id": ObjectId(appointment_id),
        "barbershop_id": str(current_user["_id"])
    })
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Update appointment status
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow()}}
    )
    
    # Update client stats
    await db.clients.update_one(
        {"_id": ObjectId(appointment["client_id"])},
        {
            "$inc": {"visits": 1, "total_spent": appointment["price"]}
        }
    )
    
    return {"message": "Appointment completed successfully"}

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, current_user = Depends(get_current_user)):
    result = await db.appointments.delete_one({
        "_id": ObjectId(appointment_id),
        "barbershop_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return {"message": "Appointment deleted successfully"}

# ==================== TASKS ROUTES ====================

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(current_user = Depends(get_current_user)):
    tasks = await db.tasks.find({"barbershop_id": str(current_user["_id"])}).sort("created_at", -1).to_list(1000)
    return [TaskResponse(id=str(t["_id"]), **{k: v for k, v in t.items() if k != "_id"}) for t in tasks]

@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, current_user = Depends(get_current_user)):
    task_dict = task_data.model_dump()
    task_dict["barbershop_id"] = str(current_user["_id"])
    task_dict["done"] = False
    task_dict["created_at"] = datetime.utcnow()
    
    result = await db.tasks.insert_one(task_dict)
    task = await db.tasks.find_one({"_id": result.inserted_id})
    
    return TaskResponse(id=str(task["_id"]), **{k: v for k, v in task.items() if k != "_id"})

@api_router.put("/tasks/{task_id}/toggle")
async def toggle_task(task_id: str, current_user = Depends(get_current_user)):
    task = await db.tasks.find_one({
        "_id": ObjectId(task_id),
        "barbershop_id": str(current_user["_id"])
    })
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"done": not task["done"]}}
    )
    
    return {"message": "Task toggled successfully"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user = Depends(get_current_user)):
    result = await db.tasks.delete_one({
        "_id": ObjectId(task_id),
        "barbershop_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/revenue")
async def get_revenue_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    query = {
        "barbershop_id": str(current_user["_id"]),
        "status": "completed"
    }
    
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    appointments = await db.appointments.find(query).to_list(10000)
    
    total_revenue = sum(apt["price"] for apt in appointments)
    total_appointments = len(appointments)
    
    # Group by date for chart
    revenue_by_date = {}
    for apt in appointments:
        date = apt["date"]
        if date not in revenue_by_date:
            revenue_by_date[date] = 0
        revenue_by_date[date] += apt["price"]
    
    chart_data = [{"date": date, "revenue": revenue} for date, revenue in sorted(revenue_by_date.items())]
    
    return {
        "total_revenue": total_revenue,
        "total_appointments": total_appointments,
        "average_ticket": total_revenue / total_appointments if total_appointments > 0 else 0,
        "chart_data": chart_data
    }

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "NEOBARBER API - Sistema de Gestão de Barbearia"}

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "service": "neobarber-api"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
